from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import User, Profile
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_response(user: User):
    avatar_url = user.profile.avatar_url if user.profile else ""
    headline = user.profile.headline if user.profile else ""
    civic_hours = user.profile.civic_hours if user.profile else 0
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "avatar_url": avatar_url,
        "headline": headline,
        "civic_hours": civic_hours
    }

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(new_user)
    db.flush()

    new_profile = Profile(
        user_id=new_user.id,
        headline=f"{user_in.role.replace('_', ' ').title()} at Nexora",
        about="",
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={new_user.email}",
        civic_hours=0
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_response(new_user)
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_response(user)
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return format_user_response(current_user)

@router.get("/users")
def get_all_users_for_switch(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [format_user_response(u) for u in users]

@router.post("/switch/{user_id}", response_model=TokenResponse)
def switch_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_response(user)
    }
