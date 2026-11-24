const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // When deployed to production (e.g. Render, or any non-localhost domain),
  // ensure we hit the live Render backend service
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    if (!envUrl || envUrl.includes("127.0.0.1") || envUrl.includes("localhost")) {
      return "https://nexora-backend-to0k.onrender.com/api/v1";
    }
  }

  if (!envUrl) return "http://127.0.0.1:8000/api/v1";
  let cleanUrl = envUrl.replace(/\/+$/, "");
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
};

export const API_BASE = getApiBase();

export const getFileUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseHost = API_BASE.replace(/\/api\/v1\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseHost}${cleanPath}`;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("nexora_token");
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("nexora_token", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("nexora_token");
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API Request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => apiRequest<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: any) => apiRequest<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => apiRequest<any>("/auth/me"),
  getAllUsers: () => apiRequest<any[]>("/auth/users"),
  switchUser: (userId: number) => apiRequest<any>(`/auth/switch/${userId}`, { method: "POST" }),

  // Profiles
  getMyProfile: () => apiRequest<any>("/profiles/me"),
  getUserProfile: (userId: number) => apiRequest<any>(`/profiles/user/${userId}`),
  updateMyProfile: (data: any) => apiRequest<any>("/profiles/me", { method: "PUT", body: JSON.stringify(data) }),
  updateAvatar: (avatarUrl: string) => apiRequest<any>("/profiles/me/avatar", { method: "POST", body: JSON.stringify({ avatar_url: avatarUrl }) }),
  addExperience: (data: any) => apiRequest<any>("/profiles/me/experiences", { method: "POST", body: JSON.stringify(data) }),
  addEducation: (data: any) => apiRequest<any>("/profiles/me/educations", { method: "POST", body: JSON.stringify(data) }),
  addSkill: (data: any) => apiRequest<any>("/profiles/me/skills", { method: "POST", body: JSON.stringify(data) }),
  endorseSkill: (skillId: number) => apiRequest<any>(`/profiles/skills/${skillId}/endorse`, { method: "POST" }),
  addCivicBadge: (data: any) => apiRequest<any>("/profiles/me/civic-badges", { method: "POST", body: JSON.stringify(data) }),

  // Feed & Posts
  getFeed: () => apiRequest<any[]>("/posts"),
  createPost: (data: any) => apiRequest<any>("/posts", { method: "POST", body: JSON.stringify(data) }),
  reactToPost: (postId: number, reactionType: string) =>
    apiRequest<any>(`/posts/${postId}/react`, { method: "POST", body: JSON.stringify({ reaction_type: reactionType }) }),
  commentOnPost: (postId: number, content: string) =>
    apiRequest<any>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),

  // Connections & Network
  getConnections: () => apiRequest<any>("/connections"),
  sendConnectionRequest: (userId: number) => apiRequest<any>(`/connections/request/${userId}`, { method: "POST" }),
  acceptConnection: (connId: number) => apiRequest<any>(`/connections/${connId}/accept`, { method: "POST" }),
  rejectConnection: (connId: number) => apiRequest<any>(`/connections/${connId}/reject`, { method: "POST" }),
  getPeerRecommendations: () => apiRequest<any[]>("/connections/recommendations"),

  // Student Idea Marketplace
  getIdeas: (cause?: string, skill?: string) => {
    const params = new URLSearchParams();
    if (cause) params.append("cause", cause);
    if (skill) params.append("skill", skill);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<any[]>(`/marketplace/ideas${query}`);
  },
  getIdeaDetail: (ideaId: number) => apiRequest<any>(`/marketplace/ideas/${ideaId}`),
  createIdea: (data: any) => apiRequest<any>("/marketplace/ideas", { method: "POST", body: JSON.stringify(data) }),
  joinIdeaTeam: (ideaId: number, data: any) =>
    apiRequest<any>(`/marketplace/ideas/${ideaId}/join`, { method: "POST", body: JSON.stringify(data) }),
  updateMemberStatus: (ideaId: number, memberId: number, status: string) =>
    apiRequest<any>(`/marketplace/ideas/${ideaId}/members/${memberId}/status?new_status=${status}`, { method: "POST" }),

  // Jobs & Civic Opportunities
  getJobs: (jobType?: string, cause?: string) => {
    const params = new URLSearchParams();
    if (jobType) params.append("job_type", jobType);
    if (cause) params.append("cause", cause);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<any[]>(`/jobs${query}`);
  },
  getJobDetail: (jobId: number) => apiRequest<any>(`/jobs/${jobId}`),
  postJob: (data: any) => apiRequest<any>("/jobs", { method: "POST", body: JSON.stringify(data) }),
  applyToJob: (jobId: number, resumeText: string) =>
    apiRequest<any>(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify({ resume_text: resumeText }) }),
  getMyApplications: () => apiRequest<any[]>("/jobs/my/applications"),

  // AI & NLP Services
  screenResume: (data: any) => apiRequest<any>("/ai/screen-resume", { method: "POST", body: JSON.stringify(data) }),
  extractResume: (resumeText: string) =>
    apiRequest<any>("/ai/extract-resume", { method: "POST", body: JSON.stringify({ resume_text: resumeText }) }),
  applyExtractedResume: (data: any) =>
    apiRequest<any>("/profiles/me/apply-extracted-resume", { method: "POST", body: JSON.stringify(data) }),
  generateEmail: (data: { recipient_name: string; recipient_headline?: string; mail_type: string; tone: string; key_notes?: string }) =>
    apiRequest<{ subject: string; body: string }>("/ai/generate-email", { method: "POST", body: JSON.stringify(data) }),
  buildOptimizedResume: (data: { resume_text: string; job_title?: string; job_description?: string; missing_skills?: string[]; recommendations?: string[] }) =>
    apiRequest<{ optimized_resume_text: string; added_keywords: string[]; projected_score: number; improvements_made: string[] }>("/ai/build-optimized-resume", { method: "POST", body: JSON.stringify(data) }),
  generatePost: (topic: string, postType = "general", tone = "inspirational") =>
    apiRequest<any>("/ai/generate-post", { method: "POST", body: JSON.stringify({ topic, post_type: postType, tone }) }),
  improveProfile: (headline: string, about: string, targetRole = "Civic Tech Developer") =>
    apiRequest<any>("/ai/improve-profile", { method: "POST", body: JSON.stringify({ headline, about, target_role: targetRole }) }),
  careerChat: (question: string, context = "") =>
    apiRequest<any>("/ai/career-chat", { method: "POST", body: JSON.stringify({ question, context }) }),

  // Messages
  getConversations: () => apiRequest<any[]>("/messages/conversations"),
  getMessages: (peerId: number) => apiRequest<any[]>(`/messages/conversations/${peerId}/messages`),
  sendMessage: (receiverId: number, content: string) =>
    apiRequest<any>("/messages/send", { method: "POST", body: JSON.stringify({ receiver_id: receiverId, content }) }),

  // Notifications
  getNotifications: () => apiRequest<any>("/notifications"),
  markNotificationRead: (id: number) => apiRequest<any>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => apiRequest<any>("/notifications/read-all", { method: "POST" }),

  // Global Search
  search: (query: string, category = "all") =>
    apiRequest<any>(`/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`),

  // Mentors for Idea Marketplace
  getMentors: () => apiRequest<any[]>("/marketplace/mentors"),
  selectIdeaMentor: (ideaId: number, mentorId: number) =>
    apiRequest<any>(`/marketplace/ideas/${ideaId}/mentor`, {
      method: "POST",
      body: JSON.stringify({ mentor_id: mentorId }),
    }),

  // Project Idea Group Messaging & Document Uploads
  getUserGroups: () => apiRequest<any[]>("/messages/groups"),
  getGroupMessages: (groupId: number) => apiRequest<any[]>(`/messages/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: number, content: string) =>
    apiRequest<any>(`/messages/groups/${groupId}/send`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  uploadGroupDocument: (groupId: number, file: File, content?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (content) {
      formData.append("content", content);
    }
    return apiRequest<any>(`/messages/groups/${groupId}/upload`, {
      method: "POST",
      body: formData,
    });
  },
};
