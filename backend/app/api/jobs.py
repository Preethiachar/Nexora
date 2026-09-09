from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.all_models import Job, JobApplication, User, Notification
from app.schemas.schemas import JobCreate, JobApply
from app.api.deps import get_current_user
from app.services.nlp_service import calculate_ats_match
from app.services.claude_service import analyze_resume_feedback

router = APIRouter(prefix="/jobs", tags=["Jobs & Civic Opportunities"])

def serialize_job(job: Job, current_user_id: int):
    # Check if user applied
    user_application = None
    for app in job.applications:
        if app.user_id == current_user_id:
            user_application = {
                "id": app.id,
                "status": app.status,
                "ats_score": app.ats_score,
                "feedback": app.feedback,
                "applied_at": app.applied_at.isoformat() if app.applied_at else ""
            }
            break

    return {
        "id": job.id,
        "company_name": job.company_name,
        "company_logo": job.company_logo,
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "skills_required": [s.strip() for s in job.skills_required.split(",") if s.strip()],
        "location": job.location,
        "job_type": job.job_type,
        "cause_area": job.cause_area,
        "is_remote": job.is_remote,
        "salary_range": job.salary_range,
        "created_at": job.created_at.isoformat() if job.created_at else "",
        "user_application": user_application,
        "total_applicants": len(job.applications)
    }

@router.get("")
def get_jobs(
    job_type: Optional[str] = None,
    cause: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if job_type and job_type != "all":
        query = query.filter(Job.job_type == job_type)
    if cause and cause != "all":
        query = query.filter(Job.cause_area.ilike(f"%{cause}%"))
        
    jobs = query.order_by(Job.created_at.desc()).all()
    return [serialize_job(j, current_user.id) for j in jobs]

@router.get("/{job_id}")
def get_job_detail(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_job(job, current_user.id)

@router.post("")
def post_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = Job(
        posted_by_id=current_user.id,
        company_name=job_in.company_name,
        company_logo=job_in.company_logo or "",
        title=job_in.title,
        description=job_in.description,
        requirements=job_in.requirements or "",
        skills_required=job_in.skills_required,
        location=job_in.location,
        job_type=job_in.job_type,
        cause_area=job_in.cause_area,
        is_remote=job_in.is_remote,
        salary_range=job_in.salary_range
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return serialize_job(job, current_user.id)

@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: int,
    apply_in: JobApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if existing
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.user_id == current_user.id
    ).first()

    # Calculate Scikit-Learn TF-IDF Match and Claude Feedback
    ats_match = calculate_ats_match(apply_in.resume_text, job.description, job.skills_required)
    claude_analysis = analyze_resume_feedback(apply_in.resume_text, job.title, ats_match["score"])

    feedback_summary = (
        f"ATS Match: {ats_match['score']}%. "
        f"Matched Skills: {', '.join(ats_match['matched_skills']) or 'None'}. "
        f"{claude_analysis['summary']}"
    )

    if existing:
        existing.resume_text = apply_in.resume_text
        existing.ats_score = ats_match["score"]
        existing.feedback = feedback_summary
        db.commit()
        return {
            "message": "Application updated with new ATS evaluation",
            "ats_match": ats_match,
            "claude_analysis": claude_analysis
        }

    application = JobApplication(
        job_id=job_id,
        user_id=current_user.id,
        status="applied",
        resume_text=apply_in.resume_text,
        ats_score=ats_match["score"],
        feedback=feedback_summary
    )
    db.add(application)

    # Notify recruiter / poster
    notif = Notification(
        user_id=job.posted_by_id,
        sender_id=current_user.id,
        notification_type="job_update",
        title=f"New applicant for '{job.title}'",
        message=f"{current_user.full_name} applied (ATS Match: {ats_match['score']}%).",
        link_url="/jobs"
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Application submitted successfully with transparent ATS score!",
        "ats_match": ats_match,
        "claude_analysis": claude_analysis
    }

@router.get("/my/applications")
def get_my_applications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(JobApplication).filter(JobApplication.user_id == current_user.id).all()
    results = []
    for a in apps:
        results.append({
            "id": a.id,
            "job_id": a.job.id,
            "title": a.job.title,
            "company_name": a.job.company_name,
            "job_type": a.job.job_type,
            "location": a.job.location,
            "status": a.status,
            "ats_score": a.ats_score,
            "feedback": a.feedback,
            "applied_at": a.applied_at.isoformat() if a.applied_at else ""
        })
    return results
