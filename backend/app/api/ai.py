from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import User, Job
from app.schemas.schemas import (
    AIResumeScreenRequest, AIPostGenerateRequest, 
    AIProfileImproveRequest, AIChatRequest
)
from app.api.deps import get_current_user
from app.services.nlp_service import calculate_ats_match
from app.services.claude_service import (
    generate_ai_post, improve_profile, 
    analyze_resume_feedback, answer_career_question
)

router = APIRouter(prefix="/ai", tags=["AI & NLP Intelligence"])

@router.post("/screen-resume")
def screen_resume(req: AIResumeScreenRequest, db: Session = Depends(get_db)):
    job_desc = req.job_description or ""
    job_skills = req.job_skills or ""
    job_title = req.job_title or "Target Opportunity"

    if req.job_id:
        job = db.query(Job).filter(Job.id == req.job_id).first()
        if job:
            job_desc = f"{job.description}\n{job.requirements}"
            job_skills = job.skills_required
            job_title = job.title

    ats_match = calculate_ats_match(req.resume_text, job_desc, job_skills)
    claude_feedback = analyze_resume_feedback(req.resume_text, job_title, ats_match["score"])

    return {
        "ats_score": ats_match["score"],
        "matched_skills": ats_match["matched_skills"],
        "missing_skills": ats_match["missing_skills"],
        "recommendations": ats_match["recommendations"],
        "claude_analysis": claude_feedback,
        "job_title": job_title
    }

@router.post("/generate-post")
def generate_post_endpoint(req: AIPostGenerateRequest):
    content = generate_ai_post(req.topic, req.post_type, req.tone)
    return {"generated_post": content}

@router.post("/improve-profile")
def improve_profile_endpoint(req: AIProfileImproveRequest):
    suggestions = improve_profile(req.headline, req.about, req.target_role)
    return suggestions

@router.post("/career-chat")
def career_chat_endpoint(req: AIChatRequest, current_user: User = Depends(get_current_user)):
    user_context = (
        f"User: {current_user.full_name}, Role: {current_user.role}, "
        f"Headline: {current_user.profile.headline if current_user.profile else ''}, "
        f"Civic Hours: {current_user.profile.civic_hours if current_user.profile else 0}"
    )
    if req.context:
        user_context += f", Additional Context: {req.context}"
        
    answer = answer_career_question(req.question, user_context)
    return {"response": answer}
