from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
import datetime

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "student"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Any

# --- Profile Schemas ---
class ExperienceSchema(BaseModel):
    id: Optional[int] = None
    company: str
    title: str
    employment_type: str = "Internship"
    start_date: str
    end_date: str = "Present"
    description: str = ""
    is_current: bool = False

class EducationSchema(BaseModel):
    id: Optional[int] = None
    school: str
    degree: str
    field_of_study: str
    start_year: str
    end_year: str

class SkillSchema(BaseModel):
    id: Optional[int] = None
    name: str
    endorsements_count: int = 0

class CivicBadgeSchema(BaseModel):
    id: Optional[int] = None
    badge_name: str
    category: str
    description: str
    issued_by: str
    issued_date: str

class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    about: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    university: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    civic_hours: Optional[int] = None
    causes: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

# --- Post Schemas ---
class PostCreate(BaseModel):
    content: str
    post_type: str = "standard" # standard, poll, civic_initiative, article, idea_pitch
    media_url: Optional[str] = ""
    tags: Optional[str] = ""
    poll_question: Optional[str] = ""
    poll_options: Optional[List[str]] = []

class ReactionCreate(BaseModel):
    reaction_type: str = "like" # like, celebrate, support, insightful

class CommentCreate(BaseModel):
    content: str

class PollVoteCreate(BaseModel):
    option_index: int

# --- Student Idea Marketplace Schemas ---
class StudentIdeaCreate(BaseModel):
    title: str
    summary: str
    problem_statement: str
    solution_statement: str
    cause_tag: str = "Civic Tech"
    needed_skills: str # Comma-separated
    team_size_target: int = 4
    mentor_id: Optional[int] = None

class IdeaMemberApply(BaseModel):
    role_title: str
    application_note: str

# --- Jobs & Opportunities Schemas ---
class JobCreate(BaseModel):
    company_name: str
    company_logo: Optional[str] = ""
    title: str
    description: str
    requirements: Optional[str] = ""
    skills_required: str
    location: str = "Remote / Hybrid"
    job_type: str = "internship" # job, internship, volunteer, fellowship
    cause_area: str = "Civic Tech"
    is_remote: bool = True
    salary_range: str = "Stipend / Grant Supported"

class JobApply(BaseModel):
    resume_text: str

# --- AI Schemas ---
class AIPostGenerateRequest(BaseModel):
    topic: str
    post_type: str = "general"
    tone: str = "inspirational"

class AIProfileImproveRequest(BaseModel):
    headline: str
    about: str
    target_role: str = "Civic Tech Developer"

class AIResumeScreenRequest(BaseModel):
    resume_text: str
    job_id: Optional[int] = None
    job_title: Optional[str] = "Civic Tech Engineer"
    job_description: Optional[str] = ""
    job_skills: Optional[str] = ""

class AIChatRequest(BaseModel):
    question: str
    context: Optional[str] = ""

class AIResumeExtractRequest(BaseModel):
    resume_text: str

class AIExtractedProfileApplyRequest(BaseModel):
    headline: Optional[str] = None
    about: Optional[str] = None
    university: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = []
    educations: Optional[List[EducationSchema]] = []
    experiences: Optional[List[ExperienceSchema]] = []

class AIGenerateEmailRequest(BaseModel):
    recipient_name: str
    recipient_headline: Optional[str] = ""
    mail_type: str = "internship_inquiry" # internship_inquiry, collaboration_pitch, coffee_chat_mentorship, application_followup, networking
    tone: str = "professional" # professional, enthusiastic, concise, formal
    key_notes: Optional[str] = ""

class AIBuildOptimizedResumeRequest(BaseModel):
    resume_text: str
    job_title: Optional[str] = "Target Opportunity"
    job_description: Optional[str] = ""
    missing_skills: Optional[List[str]] = []
    recommendations: Optional[List[str]] = []

# --- Message Schemas ---
class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class StudentIdeaMentorSelect(BaseModel):
    mentor_id: int

class GroupMessageCreate(BaseModel):
    content: str

