from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.all_models import StudentIdea, IdeaMember, User, Notification, IdeaGroup, IdeaGroupMember, GroupMessage
from app.schemas.schemas import StudentIdeaCreate, IdeaMemberApply, StudentIdeaMentorSelect
from app.api.deps import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Student Idea Marketplace"])

def serialize_idea(idea: StudentIdea, current_user_id: int):
    members = []
    user_status = None
    for m in idea.members:
        if m.user_id == current_user_id:
            user_status = m.status
        members.append({
            "id": m.id,
            "user_id": m.user.id,
            "full_name": m.user.full_name,
            "role_title": m.role_title,
            "application_note": m.application_note,
            "status": m.status,
            "avatar_url": m.user.profile.avatar_url if m.user.profile else ""
        })

    is_author = idea.author_id == current_user_id
    accepted_members_count = sum(1 for m in idea.members if m.status == "accepted")
    spots_remaining = max(0, idea.team_size_target - accepted_members_count)

    return {
        "id": idea.id,
        "title": idea.title,
        "summary": idea.summary,
        "problem_statement": idea.problem_statement,
        "solution_statement": idea.solution_statement,
        "cause_tag": idea.cause_tag,
        "needed_skills": [s.strip() for s in idea.needed_skills.split(",") if s.strip()],
        "team_size_target": idea.team_size_target,
        "spots_remaining": spots_remaining,
        "status": idea.status,
        "created_at": idea.created_at.isoformat() if idea.created_at else "",
        "is_author": is_author,
        "user_application_status": user_status,
        "mentor": {
            "id": idea.mentor.id,
            "full_name": idea.mentor.full_name,
            "role": idea.mentor.role,
            "headline": idea.mentor.profile.headline if idea.mentor.profile else "",
            "avatar_url": idea.mentor.profile.avatar_url if idea.mentor.profile else "",
            "university": idea.mentor.profile.university if idea.mentor.profile else ""
        } if idea.mentor else None,
        "group": {
            "id": idea.group.id,
            "name": idea.group.name
        } if idea.group else None,
        "author": {
            "id": idea.author.id,
            "full_name": idea.author.full_name,
            "headline": idea.author.profile.headline if idea.author.profile else "",
            "avatar_url": idea.author.profile.avatar_url if idea.author.profile else "",
            "university": idea.author.profile.university if idea.author.profile else ""
        },
        "members": members
    }

@router.get("/mentors")
def get_available_mentors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mentors = db.query(User).filter(
        User.role.in_(["mentor", "organization_recruiter"])
    ).all()
    
    return [
        {
            "id": m.id,
            "full_name": m.full_name,
            "email": m.email,
            "role": m.role,
            "headline": m.profile.headline if m.profile else "Civic & Industry Mentor",
            "avatar_url": m.profile.avatar_url if m.profile else "",
            "university": m.profile.university if m.profile else "",
            "location": m.profile.location if m.profile else "",
            "causes": m.profile.causes if m.profile else ""
        }
        for m in mentors
    ]

@router.post("/ideas/{idea_id}/mentor")
def select_idea_mentor(
    idea_id: int,
    mentor_data: StudentIdeaMentorSelect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(StudentIdea).filter(StudentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if idea.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can select a mentor")

    mentor = db.query(User).filter(User.id == mentor_data.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    idea.mentor_id = mentor.id

    # If idea has a group chat, ensure mentor is in group
    group = db.query(IdeaGroup).filter(IdeaGroup.idea_id == idea.id).first()
    if group:
        existing_gm = db.query(IdeaGroupMember).filter(
            IdeaGroupMember.group_id == group.id,
            IdeaGroupMember.user_id == mentor.id
        ).first()
        if not existing_gm:
            db.add(IdeaGroupMember(group_id=group.id, user_id=mentor.id, role="mentor"))
            db.add(GroupMessage(
                group_id=group.id,
                sender_id=current_user.id,
                content=f"🌟 {mentor.full_name} has joined as the Project Mentor!"
            ))

    # Send notification to the mentor
    notif = Notification(
        user_id=mentor.id,
        sender_id=current_user.id,
        notification_type="idea_mentor",
        title=f"Selected as Mentor for '{idea.title}'",
        message=f"{current_user.full_name} selected you as Mentor for '{idea.title}'.",
        link_url="/marketplace"
    )
    db.add(notif)
    db.commit()
    db.refresh(idea)
    return serialize_idea(idea, current_user.id)

@router.get("/ideas")
def get_ideas(
    cause: Optional[str] = None,
    skill: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentIdea)
    if cause and cause != "All":
        query = query.filter(StudentIdea.cause_tag.ilike(f"%{cause}%"))
    if skill:
        query = query.filter(StudentIdea.needed_skills.ilike(f"%{skill}%"))
        
    ideas = query.order_by(StudentIdea.created_at.desc()).all()
    return [serialize_idea(i, current_user.id) for i in ideas]

@router.get("/ideas/{idea_id}")
def get_idea_detail(idea_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    idea = db.query(StudentIdea).filter(StudentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return serialize_idea(idea, current_user.id)

@router.post("/ideas")
def create_idea(
    idea_in: StudentIdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = StudentIdea(
        author_id=current_user.id,
        mentor_id=idea_in.mentor_id,
        title=idea_in.title,
        summary=idea_in.summary,
        problem_statement=idea_in.problem_statement,
        solution_statement=idea_in.solution_statement,
        cause_tag=idea_in.cause_tag,
        needed_skills=idea_in.needed_skills,
        team_size_target=idea_in.team_size_target
    )
    db.add(idea)
    db.flush()

    if idea.mentor_id:
        notif = Notification(
            user_id=idea.mentor_id,
            sender_id=current_user.id,
            notification_type="idea_mentor",
            title=f"Selected as Mentor for '{idea.title}'",
            message=f"{current_user.full_name} has chosen you as Mentor for their new civic pitch '{idea.title}'.",
            link_url="/marketplace"
        )
        db.add(notif)

    # Automatically add author as accepted team lead
    db.add(IdeaMember(
        idea_id=idea.id,
        user_id=current_user.id,
        role_title="Project Founder & Lead",
        application_note="Project Creator",
        status="accepted"
    ))
    db.commit()
    db.refresh(idea)
    return serialize_idea(idea, current_user.id)

@router.post("/ideas/{idea_id}/join")
def join_idea_team(
    idea_id: int,
    apply_in: IdeaMemberApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(StudentIdea).filter(StudentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    existing = db.query(IdeaMember).filter(
        IdeaMember.idea_id == idea_id,
        IdeaMember.user_id == current_user.id
    ).first()

    if existing:
        return {"message": f"Already applied with status: {existing.status}", "status": existing.status}
    
    member = IdeaMember(
        idea_id=idea_id,
        user_id=current_user.id,
        role_title=apply_in.role_title,
        application_note=apply_in.application_note,
        status="pending"
    )
    db.add(member)

    # Notify project founder
    notif = Notification(
        user_id=idea.author_id,
        sender_id=current_user.id,
        notification_type="idea_apply",
        title=f"New team application for '{idea.title}'",
        message=f"{current_user.full_name} applied to join your project team as '{apply_in.role_title}'.",
        link_url="/marketplace"
    )
    db.add(notif)
    db.commit()
    return {"message": "Application to join project team submitted successfully!", "status": "pending"}

@router.post("/ideas/{idea_id}/members/{member_id}/status")
def update_member_status(
    idea_id: int,
    member_id: int,
    new_status: str, # accepted or rejected
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(StudentIdea).filter(StudentIdea.id == idea_id).first()
    if not idea or idea.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can manage team members")
    
    member = db.query(IdeaMember).filter(IdeaMember.id == member_id, IdeaMember.idea_id == idea_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member application not found")
    
    member.status = new_status

    # If accepted, automatically create / update the IdeaGroup
    if new_status == "accepted":
        group = db.query(IdeaGroup).filter(IdeaGroup.idea_id == idea.id).first()
        if not group:
            group = IdeaGroup(idea_id=idea.id, name=f"{idea.title} - Team")
            db.add(group)
            db.flush()
            # Add author as lead
            db.add(IdeaGroupMember(group_id=group.id, user_id=idea.author_id, role="lead"))
            if idea.mentor_id:
                db.add(IdeaGroupMember(group_id=group.id, user_id=idea.mentor_id, role="mentor"))

        # Add the newly accepted applicant as member if not already added
        existing_gm = db.query(IdeaGroupMember).filter(
            IdeaGroupMember.group_id == group.id,
            IdeaGroupMember.user_id == member.user_id
        ).first()
        if not existing_gm:
            db.add(IdeaGroupMember(group_id=group.id, user_id=member.user_id, role="member"))
            db.add(GroupMessage(
                group_id=group.id,
                sender_id=current_user.id,
                content=f"🎉 Welcome {member.user.full_name} to the team as {member.role_title}!"
            ))

        # Automatically send request / invitation notification to join the team group
        notif = Notification(
            user_id=member.user_id,
            sender_id=current_user.id,
            notification_type="group_invite",
            title=f"🎉 Team Application Accepted: Joined '{group.name}'!",
            message=f"{current_user.full_name} accepted your request to join '{idea.title}' as {member.role_title}. You have been automatically added to the project group chat. Click to start communicating and sharing files!",
            link_url="/messages"
        )
        db.add(notif)
    else:
        # Notify applicant of rejection
        notif = Notification(
            user_id=member.user_id,
            sender_id=current_user.id,
            notification_type="idea_apply",
            title=f"Team application update for '{idea.title}'",
            message=f"Your application to join '{idea.title}' as {member.role_title} was declined.",
            link_url="/marketplace"
        )
        db.add(notif)

    db.commit()
    return {"message": f"Member application {new_status} and automatically added to group"}
