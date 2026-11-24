export interface UserSummary {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  headline?: string;
  civic_hours?: number;
}

export interface Experience {
  id: number;
  company: string;
  title: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  description: string;
  is_current: boolean;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
}

export interface Skill {
  id: number;
  name: string;
  endorsements_count: number;
}

export interface CivicBadge {
  id: number;
  badge_name: string;
  category: string;
  description: string;
  issued_by: string;
  issued_date: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  headline: string;
  about: string;
  location: string;
  industry: string;
  university: string;
  avatar_url: string;
  banner_url: string;
  civic_hours: number;
  causes: string[];
  github_url: string;
  linkedin_url: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  civic_badges: CivicBadge[];
}

export interface PollData {
  question: string;
  options: string[];
  votes: number[];
  user_vote: number | null;
}

export interface PostComment {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: number;
    full_name: string;
    avatar_url: string;
    headline: string;
  };
}

export interface Post {
  id: number;
  content: string;
  post_type: string;
  media_url?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_reaction: string | null;
  poll_data?: PollData | null;
  author: {
    id: number;
    full_name: string;
    role: string;
    avatar_url: string;
    headline: string;
    civic_hours: number;
  };
  comments: PostComment[];
}

export interface IdeaMember {
  id: number;
  user_id: number;
  full_name: string;
  role_title: string;
  application_note: string;
  status: string;
  avatar_url: string;
}

export interface StudentIdea {
  id: number;
  title: string;
  summary: string;
  problem_statement: string;
  solution_statement: string;
  cause_tag: string;
  needed_skills: string[];
  team_size_target: number;
  spots_remaining: number;
  status: string;
  created_at: string;
  is_author: boolean;
  user_application_status?: string | null;
  mentor?: {
    id: number;
    full_name: string;
    role: string;
    headline?: string;
    avatar_url?: string;
    university?: string;
  } | null;
  group?: {
    id: number;
    name: string;
  } | null;
  author: {
    id: number;
    full_name: string;
    headline: string;
    avatar_url: string;
    university: string;
  };
  members: IdeaMember[];
}

export interface JobApplication {
  id: number;
  job_id: number;
  title: string;
  company_name: string;
  job_type: string;
  location: string;
  status: string;
  ats_score: number;
  feedback: string;
  applied_at: string;
}

export interface Job {
  id: number;
  company_name: string;
  company_logo?: string;
  title: string;
  description: string;
  requirements?: string;
  skills_required: string[];
  location: string;
  job_type: string;
  cause_area: string;
  is_remote: boolean;
  salary_range: string;
  created_at: string;
  user_application?: {
    id: number;
    status: string;
    ats_score: number;
    feedback: string;
    applied_at: string;
  } | null;
  total_applicants: number;
}

export interface ATSMatchResult {
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  claude_analysis?: {
    summary: string;
    strengths: string[];
    actionable_steps: string[];
  };
  job_title?: string;
}

export interface ExtractedResumeData {
  headline: string;
  about: string;
  university: string;
  location: string;
  skills: string[];
  educations: {
    school: string;
    degree: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
  }[];
  experiences: {
    company: string;
    title: string;
    employment_type: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current: boolean;
  }[];
}

export interface OptimizedResumeResult {
  optimized_resume_text: string;
  added_keywords: string[];
  projected_score: number;
  improvements_made: string[];
}

export interface PeerRecommendation {
  user_id: number;
  full_name: string;
  headline: string;
  avatar_url: string;
  civic_hours: number;
  university: string;
  skills: string;
  causes: string;
  role: string;
  match_score: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    full_name: string;
    avatar_url: string;
  } | null;
}

export interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationItem {
  conversation_id: number;
  peer: {
    id: number;
    full_name: string;
    avatar_url: string;
    headline: string;
  };
  last_message: string;
  last_message_time: string;
}

export interface IdeaGroupMemberInfo {
  id: number;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  role: string;
}

export interface IdeaGroupItem {
  id: number;
  idea_id: number;
  name: string;
  idea_title: string;
  my_role: string;
  members_count: number;
  members: IdeaGroupMemberInfo[];
  last_message: string;
  last_message_time: string;
}

export interface GroupMessageItem {
  id: number;
  group_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  sender_role: string;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: string | null;
  created_at: string;
}

export interface MentorInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
  headline: string;
  avatar_url?: string;
  university?: string;
  location?: string;
  causes?: string;
}

export interface SearchResults {
  query: string;
  total: number;
  users: {
    id: number;
    full_name: string;
    role: string;
    headline: string;
    avatar_url: string;
    university: string;
    location: string;
  }[];
  ideas: {
    id: number;
    title: string;
    summary: string;
    cause_tag: string;
    author_name: string;
    spots_remaining: number;
  }[];
  jobs: {
    id: number;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
    cause_area: string;
  }[];
  posts: {
    id: number;
    content: string;
    author_name: string;
    tags: string;
  }[];
}
