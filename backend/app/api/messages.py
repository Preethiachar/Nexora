from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, List
from app.database.session import get_db
from app.models.all_models import Conversation, Message, User
from app.schemas.schemas import MessageCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages & Real-Time Chat"])

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
