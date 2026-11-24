import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="student") # student, organization_recruiter, mentor, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    ideas = relationship("StudentIdea", back_populates="author", cascade="all, delete-orphan", foreign_keys="StudentIdea.author_id")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    headline = Column(String(255), default="Student & Aspiring Innovator | Nexora Member")
    about = Column(Text, default="")
    location = Column(String(255), default="Bengaluru, India")
    industry = Column(String(255), default="Technology & Civic Impact")
    university = Column(String(255), default="National Institute of Technology")
    avatar_url = Column(String(500), default="")
    banner_url = Column(String(500), default="")
    civic_hours = Column(Integer, default=0) # Verifiable volunteer / civic participation hours
    causes = Column(String(500), default="Climate Action, Civic Tech, Youth Education") # Comma-separated
    github_url = Column(String(255), default="")
    linkedin_url = Column(String(255), default="")
    
    user = relationship("User", back_populates="profile")
    experiences = relationship("Experience", back_populates="profile", cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="profile", cascade="all, delete-orphan")
    civic_badges = relationship("CivicBadge", back_populates="profile", cascade="all, delete-orphan")

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    employment_type = Column(String(100), default="Internship")
    start_date = Column(String(100), nullable=False)
    end_date = Column(String(100), default="Present")
    description = Column(Text, default="")
    is_current = Column(Boolean, default=False)

    profile = relationship("Profile", back_populates="experiences")

class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    school = Column(String(255), nullable=False)
    degree = Column(String(255), nullable=False)
    field_of_study = Column(String(255), default="Computer Science & Engineering")
    start_year = Column(String(20), default="2022")
    end_year = Column(String(20), default="2026")

    profile = relationship("Profile", back_populates="educations")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    endorsements_count = Column(Integer, default=0)

    profile = relationship("Profile", back_populates="skills")

class CivicBadge(Base):
    __tablename__ = "civic_badges"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    badge_name = Column(String(255), nullable=False)
    category = Column(String(100), default="Volunteering") # Climate, Mentorship, Civic Tech, Social Impact
    description = Column(Text, default="")
    issued_by = Column(String(255), default="Nexora Civic Foundation")
    issued_date = Column(String(100), default="2026")

    profile = relationship("Profile", back_populates="civic_badges")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String(50), default="standard") # standard, poll, civic_initiative, article, idea_pitch
    media_url = Column(String(500), default="")
    tags = Column(String(255), default="") # Comma-separated e.g. #CivicTech,#Volunteering
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    poll_question = Column(String(255), default="")
    poll_options = Column(Text, default="") # JSON string e.g. ["Yes", "No"]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    author = relationship("User", back_populates="posts")
    reactions = relationship("PostReaction", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")

class PostReaction(Base):
    __tablename__ = "post_reactions"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reaction_type = Column(String(50), default="like") # like, celebrate, support, insightful

    post = relationship("Post", back_populates="reactions")

class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    author = relationship("User")

class PollVote(Base):
    __tablename__ = "poll_votes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    option_index = Column(Integer, nullable=False)

class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending") # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class Follower(Base):
    __tablename__ = "followers"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    posted_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(255), nullable=False)
    company_logo = Column(String(500), default="")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, default="")
    skills_required = Column(String(500), default="") # Comma-separated
    location = Column(String(255), default="Remote / Hybrid")
    job_type = Column(String(100), default="internship") # job, internship, volunteer, fellowship
    cause_area = Column(String(100), default="Civic Tech") # Climate, Civic Tech, Social Impact, Education
    is_remote = Column(Boolean, default=True)
    salary_range = Column(String(100), default="Stipend / Grant Supported")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="applied") # applied, under_review, shortlisted, interview, selected, rejected
    resume_text = Column(Text, default="")
    ats_score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    user = relationship("User", back_populates="applications")

class StudentIdea(Base):
    __tablename__ = "student_ideas"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=False)
    solution_statement = Column(Text, nullable=False)
    cause_tag = Column(String(100), default="Civic Tech")
    needed_skills = Column(String(500), default="") # Comma-separated (e.g. "React, Python, GIS Mapping")
    team_size_target = Column(Integer, default=4)
    status = Column(String(50), default="open") # open, assembling, active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    author = relationship("User", foreign_keys=[author_id], back_populates="ideas")
    mentor = relationship("User", foreign_keys=[mentor_id])
    members = relationship("IdeaMember", back_populates="idea", cascade="all, delete-orphan")
    group = relationship("IdeaGroup", back_populates="idea", uselist=False, cascade="all, delete-orphan")

class IdeaMember(Base):
    __tablename__ = "idea_members"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("student_ideas.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_title = Column(String(100), default="Collaborator")
    application_note = Column(Text, default="")
    status = Column(String(50), default="pending") # pending, accepted, rejected
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    idea = relationship("StudentIdea", back_populates="members")
    user = relationship("User")

class IdeaGroup(Base):
    __tablename__ = "idea_groups"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("student_ideas.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    idea = relationship("StudentIdea", back_populates="group")
    members = relationship("IdeaGroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")

class IdeaGroupMember(Base):
    __tablename__ = "idea_group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("idea_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member") # lead, mentor, member
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    group = relationship("IdeaGroup", back_populates="members")
    user = relationship("User")

class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("idea_groups.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True) # doc, docx, pdf, ppt, pptx
    file_size = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    group = relationship("IdeaGroup", back_populates="messages")
    sender = relationship("User")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    participant1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    participant2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    p1 = relationship("User", foreign_keys=[participant1_id])
    p2 = relationship("User", foreign_keys=[participant2_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notification_type = Column(String(50), default="connection_request") # connection, reaction, comment, idea_apply, job_update
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(String(255), default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
