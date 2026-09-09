import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import Post, PostReaction, PostComment, PollVote, User
from app.schemas.schemas import PostCreate, ReactionCreate, CommentCreate, PollVoteCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts & Feed"])

def serialize_post(post: Post, current_user_id: int):
    # Current user's reaction
    user_reaction = None
    for r in post.reactions:
        if r.user_id == current_user_id:
            user_reaction = r.reaction_type
            break

    # Parse poll options & count votes
    poll_data = None
    if post.post_type == "poll" and post.poll_options:
        try:
            options = json.loads(post.poll_options)
            votes_counts = [0] * len(options)
            user_voted_idx = None
            for v in post.reactions: # or PollVote query
                pass
            poll_data = {
                "question": post.poll_question,
                "options": options,
                "votes": votes_counts,
                "user_vote": user_voted_idx
            }
        except Exception:
            pass

    return {
        "id": post.id,
        "content": post.content,
        "post_type": post.post_type,
        "media_url": post.media_url,
        "tags": [t.strip() for t in post.tags.split(",") if t.strip()] if post.tags else [],
        "likes_count": len(post.reactions),
        "comments_count": len(post.comments),
        "shares_count": post.shares_count,
        "created_at": post.created_at.isoformat() if post.created_at else "",
        "user_reaction": user_reaction,
        "poll_data": poll_data,
        "author": {
            "id": post.author.id,
            "full_name": post.author.full_name,
            "role": post.author.role,
            "avatar_url": post.author.profile.avatar_url if post.author.profile else "",
            "headline": post.author.profile.headline if post.author.profile else "",
            "civic_hours": post.author.profile.civic_hours if post.author.profile else 0
        },
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "created_at": c.created_at.isoformat() if c.created_at else "",
                "author": {
                    "id": c.author.id,
                    "full_name": c.author.full_name,
                    "avatar_url": c.author.profile.avatar_url if c.author.profile else "",
                    "headline": c.author.profile.headline if c.author.profile else ""
                }
            }
            for c in reversed(post.comments[-5:]) # Latest 5 comments
        ]
    }

@router.get("")
def get_feed(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return [serialize_post(p, current_user.id) for p in posts]

@router.post("")
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    poll_opts_str = json.dumps(post_in.poll_options) if post_in.poll_options else ""
    post = Post(
        author_id=current_user.id,
        content=post_in.content,
        post_type=post_in.post_type,
        media_url=post_in.media_url or "",
        tags=post_in.tags or "",
        poll_question=post_in.poll_question or "",
        poll_options=poll_opts_str
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return serialize_post(post, current_user.id)

@router.post("/{post_id}/react")
def react_to_post(
    post_id: int,
    reaction_in: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id
    ).first()

    if existing:
        if existing.reaction_type == reaction_in.reaction_type:
            # Toggle off
            db.delete(existing)
            db.commit()
            return {"status": "unreacted", "reaction": None}
        else:
            existing.reaction_type = reaction_in.reaction_type
            db.commit()
            return {"status": "updated", "reaction": existing.reaction_type}
    else:
        new_reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=reaction_in.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        return {"status": "reacted", "reaction": new_reaction.reaction_type}

@router.post("/{post_id}/comments")
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
        "author": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "avatar_url": current_user.profile.avatar_url if current_user.profile else "",
            "headline": current_user.profile.headline if current_user.profile else ""
        }
    }
