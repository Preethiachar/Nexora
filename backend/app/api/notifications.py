from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import Notification, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    unread_count = sum(1 for n in notifs if not n.is_read)
    return {
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "link_url": n.link_url,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else "",
                "sender": {
                    "id": n.sender.id,
                    "full_name": n.sender.full_name,
                    "avatar_url": n.sender.profile.avatar_url if n.sender.profile else ""
                } if n.sender else None
            }
            for n in notifs
        ],
        "unread_count": unread_count
    }

@router.post("/{notification_id}/read")
def mark_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}

@router.post("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({Notification.is_read: True})
    db.commit()
    return {"message": "All marked as read"}
