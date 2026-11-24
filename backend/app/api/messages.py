from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, List, Optional
import os
import uuid
import shutil
import datetime
from app.database.session import get_db
from app.models.all_models import Conversation, Message, User, IdeaGroup, IdeaGroupMember, GroupMessage
from app.schemas.schemas import MessageCreate, GroupMessageCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages & Real-Time Chat"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
DOCS_DIR = os.path.join(UPLOAD_DIR, "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

def format_size(bytes_size: int) -> str:
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    else:
        return f"{bytes_size / (1024 * 1024):.1f} MB"

# In-memory active WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

ws_manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)

@router.get("/conversations")
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(
        or_(Conversation.participant1_id == current_user.id, Conversation.participant2_id == current_user.id)
    ).order_by(Conversation.updated_at.desc()).all()

    results = []
    for c in convs:
        peer = c.p2 if c.participant1_id == current_user.id else c.p1
        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.desc()).first()
        results.append({
            "conversation_id": c.id,
            "peer": {
                "id": peer.id,
                "full_name": peer.full_name,
                "avatar_url": peer.profile.avatar_url if peer.profile else "",
                "headline": peer.profile.headline if peer.profile else ""
            },
            "last_message": last_msg.content if last_msg else "Started conversation",
            "last_message_time": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else c.updated_at.isoformat()
        })
    return results

@router.get("/conversations/{peer_id}/messages")
def get_messages(peer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find or create conversation
    conv = db.query(Conversation).filter(
        or_(
            (Conversation.participant1_id == current_user.id) & (Conversation.participant2_id == peer_id),
            (Conversation.participant1_id == peer_id) & (Conversation.participant2_id == current_user.id)
        )
    ).first()

    if not conv:
        conv = Conversation(participant1_id=current_user.id, participant2_id=peer_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    msgs = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else ""
        }
        for m in msgs
    ]

@router.post("/send")
def send_message(
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find or create conversation
    conv = db.query(Conversation).filter(
        or_(
            (Conversation.participant1_id == current_user.id) & (Conversation.participant2_id == msg_in.receiver_id),
            (Conversation.participant1_id == msg_in.receiver_id) & (Conversation.participant2_id == current_user.id)
        )
    ).first()

    if not conv:
        conv = Conversation(participant1_id=current_user.id, participant2_id=msg_in.receiver_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        content=msg_in.content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "conversation_id": conv.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "created_at": msg.created_at.isoformat()
    }

# ==========================================
# Group Messaging for Student Project Ideas
# ==========================================

@router.get("/groups")
def get_user_groups(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find groups where user is a member
    memberships = db.query(IdeaGroupMember).filter(IdeaGroupMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in memberships]

    groups = db.query(IdeaGroup).filter(IdeaGroup.id.in_(group_ids)).order_by(IdeaGroup.updated_at.desc()).all()

    results = []
    for g in groups:
        last_msg = db.query(GroupMessage).filter(GroupMessage.group_id == g.id).order_by(GroupMessage.created_at.desc()).first()
        my_role = next((m.role for m in g.members if m.user_id == current_user.id), "member")
        
        results.append({
            "id": g.id,
            "idea_id": g.idea_id,
            "name": g.name,
            "idea_title": g.idea.title if g.idea else g.name,
            "my_role": my_role,
            "members_count": len(g.members),
            "members": [
                {
                    "id": m.user.id,
                    "full_name": m.user.full_name,
                    "avatar_url": m.user.profile.avatar_url if m.user.profile else "",
                    "headline": m.user.profile.headline if m.user.profile else "",
                    "role": m.role
                }
                for m in g.members
            ],
            "last_message": last_msg.content if last_msg else "Group initialized. Welcome!",
            "last_message_time": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else g.updated_at.isoformat()
        })
    return results

@router.get("/groups/{group_id}/messages")
def get_group_messages(group_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Ensure current user is in group
    membership = db.query(IdeaGroupMember).filter(
        IdeaGroupMember.group_id == group_id,
        IdeaGroupMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this project group")

    msgs = db.query(GroupMessage).filter(GroupMessage.group_id == group_id).order_by(GroupMessage.created_at.asc()).all()
    
    # Map user roles in this group
    member_roles = {
        m.user_id: m.role for m in db.query(IdeaGroupMember).filter(IdeaGroupMember.group_id == group_id).all()
    }

    return [
        {
            "id": m.id,
            "group_id": m.group_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name if m.sender else "Unknown",
            "sender_avatar": m.sender.profile.avatar_url if m.sender and m.sender.profile else "",
            "sender_role": member_roles.get(m.sender_id, "member"),
            "content": m.content,
            "file_url": m.file_url,
            "file_name": m.file_name,
            "file_type": m.file_type,
            "file_size": m.file_size,
            "created_at": m.created_at.isoformat() if m.created_at else ""
        }
        for m in msgs
    ]

@router.post("/groups/{group_id}/send")
def send_group_message(
    group_id: int,
    msg_in: GroupMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user is member
    membership = db.query(IdeaGroupMember).filter(
        IdeaGroupMember.group_id == group_id,
        IdeaGroupMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this project group")

    group = db.query(IdeaGroup).filter(IdeaGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    msg = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=msg_in.content
    )
    db.add(msg)
    group.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name,
        "sender_avatar": current_user.profile.avatar_url if current_user.profile else "",
        "sender_role": membership.role,
        "content": msg.content,
        "file_url": None,
        "file_name": None,
        "file_type": None,
        "file_size": None,
        "created_at": msg.created_at.isoformat()
    }

@router.post("/groups/{group_id}/upload")
async def upload_group_document(
    group_id: int,
    file: UploadFile = File(...),
    content: Optional[str] = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(IdeaGroupMember).filter(
        IdeaGroupMember.group_id == group_id,
        IdeaGroupMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this project group")

    group = db.query(IdeaGroup).filter(IdeaGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Determine extension
    orig_name = file.filename or "document"
    ext = orig_name.split(".")[-1].lower() if "." in orig_name else "doc"

    safe_name = f"{uuid.uuid4().hex[:8]}_{orig_name.replace(' ', '_')}"
    dest_path = os.path.join(DOCS_DIR, safe_name)

    # Read and save file
    contents = await file.read()
    file_bytes_size = len(contents)
    with open(dest_path, "wb") as f:
        f.write(contents)

    file_size_formatted = format_size(file_bytes_size)
    file_url = f"/uploads/documents/{safe_name}"

    msg_text = content.strip() if content and content.strip() else f"Shared document: {orig_name}"

    msg = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=msg_text,
        file_url=file_url,
        file_name=orig_name,
        file_type=ext,
        file_size=file_size_formatted
    )
    db.add(msg)
    group.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name,
        "sender_avatar": current_user.profile.avatar_url if current_user.profile else "",
        "sender_role": membership.role,
        "content": msg.content,
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_type": msg.file_type,
        "file_size": msg.file_size,
        "created_at": msg.created_at.isoformat()
    }
