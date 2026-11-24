from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database.session import get_db
from app.models.all_models import User, StudentIdea, Job, Post
from app.api.deps import get_current_user

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=1, description="Search term"),
    category: Optional[str] = "all", # all, people, ideas, jobs, posts
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_str = f"%{q.strip()}%"
    results = {
        "query": q,
        "users": [],
        "ideas": [],
        "jobs": [],
        "posts": []
    }

    # 1. Search Users / People
    if category in ["all", "people"]:
        users = db.query(User).filter(
            or_(
                User.full_name.ilike(query_str),
                User.email.ilike(query_str),
                User.role.ilike(query_str)
            )
        ).limit(8).all()
        
        for u in users:
            results["users"].append({
                "id": u.id,
                "full_name": u.full_name,
                "role": u.role,
                "headline": u.profile.headline if u.profile else "",
                "avatar_url": u.profile.avatar_url if u.profile else "",
                "university": u.profile.university if u.profile else "",
                "location": u.profile.location if u.profile else ""
            })

    # 2. Search Student Ideas
    if category in ["all", "ideas"]:
        ideas = db.query(StudentIdea).filter(
            or_(
                StudentIdea.title.ilike(query_str),
                StudentIdea.summary.ilike(query_str),
                StudentIdea.cause_tag.ilike(query_str),
                StudentIdea.needed_skills.ilike(query_str)
            )
        ).limit(8).all()

        for i in ideas:
            results["ideas"].append({
                "id": i.id,
                "title": i.title,
                "summary": i.summary,
                "cause_tag": i.cause_tag,
                "author_name": i.author.full_name if i.author else "",
                "spots_remaining": max(0, i.team_size_target - sum(1 for m in i.members if m.status == "accepted"))
            })

    # 3. Search Opportunities / Jobs
    if category in ["all", "jobs"]:
        jobs = db.query(Job).filter(
            or_(
                Job.title.ilike(query_str),
                Job.company_name.ilike(query_str),
                Job.cause_area.ilike(query_str),
                Job.skills_required.ilike(query_str)
            )
        ).limit(8).all()

        for j in jobs:
            results["jobs"].append({
                "id": j.id,
                "title": j.title,
                "company_name": j.company_name,
                "location": j.location,
                "job_type": j.job_type,
                "cause_area": j.cause_area
            })

    # 4. Search Posts
    if category in ["all", "posts"]:
        posts = db.query(Post).filter(
            or_(
                Post.content.ilike(query_str),
                Post.tags.ilike(query_str)
            )
        ).limit(6).all()

        for p in posts:
            results["posts"].append({
                "id": p.id,
                "content": p.content[:140] + ("..." if len(p.content) > 140 else ""),
                "author_name": p.author.full_name if p.author else "",
                "tags": p.tags
            })

    results["total"] = (
        len(results["users"]) + len(results["ideas"]) + 
        len(results["jobs"]) + len(results["posts"])
    )
    return results
