import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Curated dictionary of Tech, Civic, and Professional skills
KNOWN_SKILLS = [
    # Programming & Tech
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "SQL", "PostgreSQL",
    "Docker", "AWS", "Machine Learning", "Deep Learning", "NLP", "Scikit-Learn", "Git", "HTML",
    "CSS", "TailwindCSS", "Next.js", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch",
    "REST API", "GraphQL", "Cybersecurity", "UI/UX Design", "Figma", "DevOps", "Linux", "C++",
    
    # Civic, Social Impact & Youth Engagement
    "Community Organizing", "Volunteering", "Civic Tech", "Climate Action", "Youth Leadership",
    "Public Speaking", "Grant Writing", "Campaign Management", "Nonprofit Management", 
    "Policy Analysis", "Social Media Advocacy", "Fundraising", "Event Planning", 
    "Environmental Science", "Sustainability", "Grassroots Organizing", "Conflict Resolution",
    "Crisis Management", "Public Health", "Educational Mentoring", "Content Writing"
]

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts known skills from text using regex boundary matching.
    """
    if not text:
        return []
    
    extracted = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted.append(skill)
            
    return list(dict.fromkeys(extracted)) # Deduplicate maintaining order

def calculate_ats_match(resume_text: str, job_description: str, job_skills: str = "") -> Dict[str, Any]:
    """
    Computes Scikit-Learn TF-IDF Cosine Similarity, extracts matched skills,
    identifies missing keywords, and produces an ATS percentage score.
    """
    if not resume_text.strip() or not job_description.strip():
        return {
            "score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "recommendations": ["Provide more detailed resume and job description text."]
        }
    
    # 1. TF-IDF Cosine Similarity Matrix
    corpus = [resume_text, job_description]
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except Exception:
        similarity = 0.4
    
    # 2. Extract Skills
    resume_skills = set(extract_skills_from_text(resume_text))
    job_extracted_skills = set(extract_skills_from_text(job_description))
    
    if job_skills:
        for s in job_skills.split(","):
            s_clean = s.strip()
            if s_clean:
                job_extracted_skills.add(s_clean)
                
    matched_skills = sorted(list(resume_skills.intersection(job_extracted_skills)))
    missing_skills = sorted(list(job_extracted_skills - resume_skills))
    
    # 3. Composite ATS Score (combination of TF-IDF similarity + skill match coverage)
    skill_coverage = len(matched_skills) / max(len(job_extracted_skills), 1) if job_extracted_skills else 0.5
    composite_score = round(float((similarity * 0.5 + skill_coverage * 0.5) * 100), 1)
    # Clamp between 15 and 98%
    composite_score = max(15.0, min(98.0, composite_score))
    
    # 4. Actionable ATS recommendations
    recommendations = []
    if missing_skills:
        recommendations.append(f"Incorporate missing core skills: {', '.join(missing_skills[:5])}.")
    if len(resume_text.split()) < 100:
        recommendations.append("Expand on specific achievements, quantitative impact metrics, and leadership outcomes.")
    if "civic" in job_description.lower() and not any(s in resume_skills for s in ["Volunteering", "Civic Tech", "Youth Leadership"]):
        recommendations.append("Highlight relevant extracurricular, student organization, or community volunteering experience.")
    if not recommendations:
        recommendations.append("Strong keyword resonance! Review formatting for clean bullet points and metric-backed impact.")
        
    return {
        "score": composite_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations
    }

def calculate_peer_recommendations(user_profile: Dict[str, Any], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks peer candidates by similarity using Scikit-Learn TF-IDF over skills, causes, and bio.
    """
    if not candidates:
        return []
    
    user_text = f"{user_profile.get('headline', '')} {user_profile.get('skills', '')} {user_profile.get('causes', '')} {user_profile.get('university', '')}"
    candidate_texts = [
        f"{c.get('headline', '')} {c.get('skills', '')} {c.get('causes', '')} {c.get('university', '')}"
        for c in candidates
    ]
    
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf = vectorizer.fit_transform([user_text] + candidate_texts)
        sims = cosine_similarity(tfidf[0:1], tfidf[1:])[0]
    except Exception:
        sims = [0.5] * len(candidates)
        
    results = []
    for i, c in enumerate(candidates):
        score = round(float(sims[i] * 100), 1)
        results.append({
            **c,
            "match_score": min(98.0, max(20.0, score + 25.0)) # baseline friendly score
        })
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results
