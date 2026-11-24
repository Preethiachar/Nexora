from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import User, Profile, Experience, Education, Skill, CivicBadge
from app.schemas.schemas import (
    ProfileUpdate, ExperienceSchema, EducationSchema, 
    SkillSchema, CivicBadgeSchema, AIExtractedProfileApplyRequest
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/profiles", tags=["Profiles"])

def serialize_profile(profile: Profile, user: User):
    return {
        "id": profile.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "headline": profile.headline,
        "about": profile.about,
        "location": profile.location,
        "industry": profile.industry,
        "university": profile.university,
        "avatar_url": profile.avatar_url,
        "banner_url": profile.banner_url,
        "civic_hours": profile.civic_hours,
        "causes": [c.strip() for c in profile.causes.split(",") if c.strip()] if profile.causes else [],
        "github_url": profile.github_url,
        "linkedin_url": profile.linkedin_url,
        "experiences": [
            {
                "id": exp.id,
                "company": exp.company,
                "title": exp.title,
                "employment_type": exp.employment_type,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "description": exp.description,
                "is_current": exp.is_current
            }
            for exp in profile.experiences
        ],
        "educations": [
            {
                "id": edu.id,
                "school": edu.school,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "start_year": edu.start_year,
                "end_year": edu.end_year
            }
            for edu in profile.educations
        ],
        "skills": [
            {
                "id": sk.id,
                "name": sk.name,
                "endorsements_count": sk.endorsements_count
            }
            for sk in profile.skills
        ],
        "civic_badges": [
            {
                "id": bd.id,
                "badge_name": bd.badge_name,
                "category": bd.category,
                "description": bd.description,
                "issued_by": bd.issued_by,
                "issued_date": bd.issued_date
            }
            for bd in profile.civic_badges
        ]
    }

@router.get("/user/{user_id}")
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return serialize_profile(user.profile, user)

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return serialize_profile(current_user.profile, current_user)

@router.put("/me")
def update_my_profile(
    profile_in: ProfileUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(profile, k, v)
            
    db.commit()
    db.refresh(profile)
    return serialize_profile(profile, current_user)

@router.post("/me/avatar")
def update_avatar(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    avatar_url = data.get("avatar_url", "")
    if not avatar_url:
        raise HTTPException(status_code=400, detail="avatar_url is required")
        
    profile.avatar_url = avatar_url
    db.commit()
    db.refresh(profile)
    return {"message": "Profile picture updated successfully", "avatar_url": profile.avatar_url}

@router.post("/me/experiences")
def add_experience(exp_in: ExperienceSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    exp = Experience(
        profile_id=profile.id,
        company=exp_in.company,
        title=exp_in.title,
        employment_type=exp_in.employment_type,
        start_date=exp_in.start_date,
        end_date=exp_in.end_date,
        description=exp_in.description,
        is_current=exp_in.is_current
    )
    db.add(exp)
    db.commit()
    return {"message": "Experience added", "id": exp.id}

@router.post("/me/educations")
def add_education(edu_in: EducationSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    edu = Education(
        profile_id=profile.id,
        school=edu_in.school,
        degree=edu_in.degree,
        field_of_study=edu_in.field_of_study,
        start_year=edu_in.start_year,
        end_year=edu_in.end_year
    )
    db.add(edu)
    db.commit()
    return {"message": "Education added", "id": edu.id}

@router.post("/me/skills")
def add_skill(skill_in: SkillSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    # Prevent duplicate skill
    existing = db.query(Skill).filter(Skill.profile_id == profile.id, Skill.name.ilike(skill_in.name)).first()
    if existing:
        return {"message": "Skill already present", "id": existing.id}
    
    skill = Skill(profile_id=profile.id, name=skill_in.name, endorsements_count=1)
    db.add(skill)
    db.commit()
    return {"message": "Skill added", "id": skill.id}

@router.post("/skills/{skill_id}/endorse")
def endorse_skill(skill_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.endorsements_count += 1
    db.commit()
    return {"message": "Endorsed successfully", "endorsements_count": skill.endorsements_count}

@router.post("/me/civic-badges")
def add_civic_badge(badge_in: CivicBadgeSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    badge = CivicBadge(
        profile_id=profile.id,
        badge_name=badge_in.badge_name,
        category=badge_in.category,
        description=badge_in.description,
        issued_by=badge_in.issued_by,
        issued_date=badge_in.issued_date
    )
    db.add(badge)
    db.commit()
    return {"message": "Civic badge verified and added", "id": badge.id}

@router.post("/me/apply-extracted-resume")
def apply_extracted_resume(
    data: AIExtractedProfileApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.headline:
        profile.headline = data.headline
    if data.about:
        profile.about = data.about
    if data.university:
        profile.university = data.university
    if data.location:
        profile.location = data.location

    # Add educations
    for edu in data.educations or []:
        if edu.school:
            new_edu = Education(
                profile_id=profile.id,
                school=edu.school,
                degree=edu.degree or "Bachelor of Technology",
                field_of_study=edu.field_of_study or "Computer Science",
                start_year=edu.start_year or "2022",
                end_year=edu.end_year or "2026"
            )
            db.add(new_edu)

    # Add experiences
    for exp in data.experiences or []:
        if exp.company:
            new_exp = Experience(
                profile_id=profile.id,
                company=exp.company,
                title=exp.title or "Software Intern",
                employment_type=exp.employment_type or "Internship",
                start_date=exp.start_date or "2024",
                end_date=exp.end_date or "Present",
                description=exp.description or "",
                is_current=exp.is_current
            )
            db.add(new_exp)

    # Add skills (prevent duplicates)
    for skill_name in data.skills or []:
        skill_name_clean = skill_name.strip()
        if not skill_name_clean:
            continue
        existing = db.query(Skill).filter(
            Skill.profile_id == profile.id,
            Skill.name.ilike(skill_name_clean)
        ).first()
        if not existing:
            db.add(Skill(profile_id=profile.id, name=skill_name_clean, endorsements_count=1))

    db.commit()
    db.refresh(profile)
    return serialize_profile(profile, current_user)

