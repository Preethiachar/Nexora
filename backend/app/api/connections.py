from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.all_models import User, Connection, Profile, Notification
from app.api.deps import get_current_user
from app.services.nlp_service import calculate_peer_recommendations

router = APIRouter(prefix="/connections", tags=["Connections & Networking"])

@router.get("")
def get_connections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Accepted connections
    accepted_conns = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id),
        Connection.status == "accepted"
    ).all()

    connections_list = []
    connected_user_ids = {current_user.id}
    for c in accepted_conns:
        peer = c.receiver if c.sender_id == current_user.id else c.sender
        connected_user_ids.add(peer.id)
        connections_list.append({
            "connection_id": c.id,
            "user_id": peer.id,
            "full_name": peer.full_name,
            "headline": peer.profile.headline if peer.profile else "",
            "avatar_url": peer.profile.avatar_url if peer.profile else "",
            "civic_hours": peer.profile.civic_hours if peer.profile else 0,
            "university": peer.profile.university if peer.profile else "",
            "degree": "1st"
        })

    # Received pending requests
    received_requests = db.query(Connection).filter(
        Connection.receiver_id == current_user.id,
        Connection.status == "pending"
    ).all()

    pending_list = [
        {
            "connection_id": r.id,
            "user_id": r.sender.id,
            "full_name": r.sender.full_name,
            "headline": r.sender.profile.headline if r.sender.profile else "",
            "avatar_url": r.sender.profile.avatar_url if r.sender.profile else "",
            "civic_hours": r.sender.profile.civic_hours if r.sender.profile else 0,
            "university": r.sender.profile.university if r.sender.profile else ""
        }
        for r in received_requests
    ]

    return {
        "connections": connections_list,
        "pending_requests": pending_list,
        "total_connections": len(connections_list)
    }

@router.post("/request/{target_user_id}")
def send_connection_request(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    existing = db.query(Connection).filter(
        or_(
            (Connection.sender_id == current_user.id) & (Connection.receiver_id == target_user_id),
            (Connection.sender_id == target_user_id) & (Connection.receiver_id == current_user.id)
        )
    ).first()

    if existing:
        return {"message": f"Connection request already {existing.status}", "status": existing.status}
    
    conn = Connection(
        sender_id=current_user.id,
        receiver_id=target_user_id,
        status="pending"
    )
    db.add(conn)

    # Notify recipient
    notif = Notification(
        user_id=target_user_id,
        sender_id=current_user.id,
        notification_type="connection",
        title=f"New connection request from {current_user.full_name}",
        message=f"{current_user.full_name} would like to connect with you on Nexora.",
        link_url="/network"
    )
    db.add(notif)
    db.commit()
    return {"message": "Connection request sent successfully", "status": "pending"}

@router.post("/{connection_id}/accept")
def accept_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn or conn.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    conn.status = "accepted"

    # Notify sender
    notif = Notification(
        user_id=conn.sender_id,
        sender_id=current_user.id,
        notification_type="connection",
        title=f"{current_user.full_name} accepted your invitation",
        message=f"You and {current_user.full_name} are now connected on Nexora.",
        link_url="/network"
    )
    db.add(notif)
    db.commit()
    return {"message": "Connection accepted"}

@router.post("/{connection_id}/reject")
def reject_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn or conn.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    conn.status = "rejected"
    db.commit()
    return {"message": "Connection request rejected"}

@router.get("/recommendations")
def get_ai_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch all other users
    other_users = db.query(User).filter(User.id != current_user.id).all()

    # Get already connected or pending user IDs
    existing_conns = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id)
    ).all()
    connected_ids = set()
    for c in existing_conns:
        connected_ids.add(c.receiver_id if c.sender_id == current_user.id else c.sender_id)

    curr_p = current_user.profile
    curr_skills_str = ", ".join([s.name for s in curr_p.skills]) if curr_p and curr_p.skills else ""
    user_dict = {
        "headline": curr_p.headline if curr_p else "",
        "skills": curr_skills_str,
        "causes": curr_p.causes if curr_p else "",
        "university": curr_p.university if curr_p else ""
    }

    candidates = []
    for u in other_users:
        if u.id in connected_ids:
            continue
        p = u.profile
        sk_str = ", ".join([s.name for s in p.skills]) if p and p.skills else ""
        candidates.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "headline": p.headline if p else "",
            "avatar_url": p.avatar_url if p else "",
            "civic_hours": p.civic_hours if p else 0,
            "university": p.university if p else "",
            "skills": sk_str,
            "causes": p.causes if p else "",
            "role": u.role
        })

    recommendations = calculate_peer_recommendations(user_dict, candidates)
    return recommendations
