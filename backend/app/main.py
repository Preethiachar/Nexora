import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.seed_data import seed_database
from app.models.all_models import StudentIdea, IdeaGroup, IdeaGroupMember, GroupMessage
from app.api import auth, profiles, posts, connections, marketplace, jobs, ai, messages, notifications, search

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database schema
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    db = SessionLocal()
    try:
        seed_database(db)

        # Backfill groups for ideas that have accepted members
        ideas = db.query(StudentIdea).all()
        for idea in ideas:
            accepted_members = [m for m in idea.members if m.status == "accepted"]
            if accepted_members:
                group = db.query(IdeaGroup).filter(IdeaGroup.idea_id == idea.id).first()
                if not group:
                    group = IdeaGroup(idea_id=idea.id, name=f"{idea.title} - Team")
                    db.add(group)
                    db.flush()
                    db.add(IdeaGroupMember(group_id=group.id, user_id=idea.author_id, role="lead"))
                    if idea.mentor_id:
                        db.add(IdeaGroupMember(group_id=group.id, user_id=idea.mentor_id, role="mentor"))
                    for m in accepted_members:
                        if m.user_id != idea.author_id:
                            db.add(IdeaGroupMember(group_id=group.id, user_id=m.user_id, role="member"))
                    db.add(GroupMessage(
                        group_id=group.id,
                        sender_id=idea.author_id,
                        content=f"Welcome everyone to the {idea.title} collaboration group! Share documents, plans, and ideas here. 🚀"
                    ))
                    db.commit()
    except Exception as e:
        print(f"Warning during startup seeding/backfill: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="Nexora API - The Digital Platform for Students & Young Engagement",
    description="LinkedIn-inspired Professional & Civic Networking Platform powered by FastAPI, Scikit-Learn NLP, and Claude AI.",
    version="1.0.0",
    lifespan=lifespan
)

# Static files for document & media uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(os.path.join(uploads_dir, "documents"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profiles.router, prefix=settings.API_V1_STR)
app.include_router(posts.router, prefix=settings.API_V1_STR)
app.include_router(connections.router, prefix=settings.API_V1_STR)
app.include_router(marketplace.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(messages.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Nexora API",
        "platform": "The Digital Platform for Students/Young Engagement",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
