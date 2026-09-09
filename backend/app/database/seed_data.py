import json
from sqlalchemy.orm import Session
from app.models.all_models import (
    User, Profile, Experience, Education, Skill, CivicBadge,
    Post, PostReaction, PostComment, PollVote,
    Connection, Job, StudentIdea, IdeaMember,
    Conversation, Message, Notification
)
from app.core.security import get_password_hash

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    print("Seeding database with rich Nexora student civic engagement data...")

    # 1. Create Users
    users_data = [
        {
            "email": "maya.chen@nexora.edu",
            "full_name": "Maya Chen",
            "role": "student",
            "password": "password123",
            "headline": "AI & Civic Tech Researcher | Lead @ CivicClean | Aspiring Public Interest Technologist",
            "about": "Junior in Computer Science passionate about building civic tech tools that democratize community organizing and environmental monitoring. Awarded National Youth Civic Innovation Fellow 2025.",
            "location": "Bengaluru, India",
            "university": "Indian Institute of Science (IISc)",
            "industry": "Artificial Intelligence & Civic Tech",
            "civic_hours": 140,
            "causes": "Civic Tech, Climate Action, Youth Empowerment",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80"
        },
        {
            "email": "alex.rivera@nexora.edu",
            "full_name": "Alex Rivera",
            "role": "student",
            "password": "password123",
            "headline": "Full-Stack Engineer & Climate Activist | Building Hyperlocal Climate Watch",
            "about": "Full stack developer leveraging React, Python, and IoT sensors to create community-led environmental tracking networks. Open source advocate and avid hackathon builder.",
            "location": "New Delhi, India",
            "university": "Delhi Technological University (DTU)",
            "industry": "Software Engineering & Sustainability",
            "civic_hours": 95,
            "causes": "Clean Energy, Open Source, Environmental Justice",
            "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"
        },
        {
            "email": "priya.sharma@nexora.edu",
            "full_name": "Priya Sharma",
            "role": "student",
            "password": "password123",
            "headline": "Data Science & Public Health Enthusiast | Volunteer Lead @ HealthFirst",
            "about": "Analyzing healthcare accessibility disparities with Python, Scikit-Learn, and geospatial data. Believes technology is most potent when serving under-resourced communities.",
            "location": "Mumbai, India",
            "university": "IIT Bombay",
            "industry": "Data Science & Healthcare",
            "civic_hours": 110,
            "causes": "Public Health, Gender Equity, Education For All",
            "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80"
        },
        {
            "email": "sarah.jenkins@civicalabs.org",
            "full_name": "Sarah Jenkins",
            "role": "organization_recruiter",
            "password": "password123",
            "headline": "Director of University Talent @ Civica Labs | Hiring Civic Innovators",
            "about": "Connecting mission-driven students and engineers with cutting-edge civic tech fellowships, research roles, and social impact opportunities.",
            "location": "Bengaluru, India",
            "university": "Stanford University Alum",
            "industry": "Social Enterprise & Civic Tech",
            "civic_hours": 320,
            "causes": "Civic Tech, Transparent Governance, Ethical AI",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80"
        },
        {
            "email": "vikram.patel@innovation.edu",
            "full_name": "Dr. Vikram Patel",
            "role": "mentor",
            "password": "password123",
            "headline": "Professor of Social Innovation & Human-Centered Computing | Nexora Mentor",
            "about": "Guiding the next generation of youth to design technologies that empower marginalized communities. 15+ years researching community-engaged algorithms and digital civic participation.",
            "location": "Hyderabad, India",
            "university": "IIIT Hyderabad",
            "industry": "Higher Education & Research",
            "civic_hours": 500,
            "causes": "Digital Literacy, Academic Equity, Youth Mentorship",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80"
        },
        {
            "email": "greenearth@ngo.org",
            "full_name": "GreenEarth Initiative",
            "role": "organization_recruiter",
            "password": "password123",
            "headline": "Youth-Led Environmental Protection & Climate Data Hub",
            "about": "Pioneering grassroots afforestation, urban heat island tracking, and student environmental internships across 40+ college campuses.",
            "location": "Pune, India",
            "university": "Civil Society Partner",
            "industry": "Environmental Nonprofit",
            "civic_hours": 1200,
            "causes": "Climate Action, Biodiversity, Sustainability",
            "avatar_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80",
            "banner_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80"
        }
    ]

    created_users = []
    for ud in users_data:
        u = User(
            email=ud["email"],
            full_name=ud["full_name"],
            role=ud["role"],
            password_hash=get_password_hash(ud["password"])
        )
        db.add(u)
        db.flush()

        p = Profile(
            user_id=u.id,
            headline=ud["headline"],
            about=ud["about"],
            location=ud["location"],
            industry=ud["industry"],
            university=ud["university"],
            civic_hours=ud["civic_hours"],
            causes=ud["causes"],
            avatar_url=ud["avatar_url"],
            banner_url=ud["banner_url"],
            github_url=f"https://github.com/{ud['full_name'].lower().replace(' ', '')}",
            linkedin_url=f"https://linkedin.com/in/{ud['full_name'].lower().replace(' ', '')}"
        )
        db.add(p)
        db.flush()

        # Seed Skills
        if ud["role"] == "student":
            skills = ["Python", "React", "Machine Learning", "FastAPI", "Civic Tech", "Volunteering", "Git", "Community Organizing"]
            for s in skills:
                db.add(Skill(profile_id=p.id, name=s, endorsements_count=12))

            # Civic Badges
            db.add(CivicBadge(
                profile_id=p.id,
                badge_name="Verified Civic Contributor (100+ Hours)",
                category="Civic Action",
                description="Recognized for 100+ verified hours of community organizing and volunteer engagement.",
                issued_by="Nexora Civic Foundation"
            ))
            db.add(CivicBadge(
                profile_id=p.id,
                badge_name="Youth Climate Fellow",
                category="Climate Action",
                description="Active participant in campus sustainability and local emission reduction projects.",
                issued_by="GreenEarth Initiative"
            ))

            # Education
            db.add(Education(
                profile_id=p.id,
                school=ud["university"],
                degree="Bachelor of Technology",
                field_of_study="Computer Science & Engineering",
                start_year="2022",
                end_year="2026"
            ))

            # Experience
            db.add(Experience(
                profile_id=p.id,
                company="CivicClean Project",
                title="Student Project Lead",
                employment_type="Civic Initiative",
                start_date="Jan 2025",
                end_date="Present",
                description="Organized 12 neighborhood cleanups, mapped 400+ waste hotspots using computer vision models, and mobilized 60 student volunteers.",
                is_current=True
            ))

        created_users.append(u)

    maya, alex, priya, sarah, vikram, greenearth = created_users

    # 2. Connections
    db.add(Connection(sender_id=maya.id, receiver_id=alex.id, status="accepted"))
    db.add(Connection(sender_id=maya.id, receiver_id=priya.id, status="accepted"))
    db.add(Connection(sender_id=maya.id, receiver_id=vikram.id, status="accepted"))
    db.add(Connection(sender_id=alex.id, receiver_id=sarah.id, status="accepted"))
    db.add(Connection(sender_id=priya.id, receiver_id=greenearth.id, status="pending"))

    # 3. Student Idea Marketplace (Distinguishing Feature!)
    ideas_data = [
        {
            "author_id": maya.id,
            "title": "CivicClean: AI-Powered Waste Hotspot Mapping for Student Drives",
            "summary": "A mobile web app that lets student volunteers snap photos of local trash clusters, classify materials with AI, and schedule efficient peer cleanup events.",
            "problem_statement": "Municipal waste cleanup often misses neighborhood hotspots. Student volunteer drives struggle with disorganized scheduling and lack real impact data.",
            "solution_statement": "We are building an open-source civic map with YOLOv8 trash classification and live event routing so students can mobilize in hours.",
            "cause_tag": "Civic Tech & Environment",
            "needed_skills": "React, Python, FastApi, Computer Vision, Community Organizing",
            "team_size_target": 5
        },
        {
            "author_id": alex.id,
            "title": "CodeForElders: Intergenerational Digital Literacy Hub",
            "summary": "Pairing computer science undergrads with senior citizens to provide patient, one-on-one digital safety and smartphone literacy workshops.",
            "problem_statement": "Rapid digitization has left elderly populations vulnerable to digital fraud, isolation, and trouble accessing essential public services.",
            "solution_statement": "A platform matching student volunteers with local community centers, tracking student volunteer credits and student impact.",
            "cause_tag": "Digital Equity & Education",
            "needed_skills": "UI/UX Design, Workshop Facilitation, React, Content Writing",
            "team_size_target": 4
        },
        {
            "author_id": priya.id,
            "title": "CampusFoodRescue: Peer-to-Peer Dining Surplus Redistribution",
            "summary": "Real-time notification system connecting campus dining halls and catered events with local shelters to prevent edible food waste.",
            "problem_statement": "Universities discard hundreds of kilograms of untouched food daily while surrounding community shelters face severe shortages.",
            "solution_statement": "A quick push-notification dispatcher allowing student volunteers on campus to transport excess trays safely within 45 minutes.",
            "cause_tag": "Food Security & Sustainability",
            "needed_skills": "FastAPI, React Native, Logistics, Food Safety Coordination",
            "team_size_target": 4
        }
    ]

    for idata in ideas_data:
        idea = StudentIdea(**idata)
        db.add(idea)
        db.flush()
        # Add author as accepted lead
        db.add(IdeaMember(
            idea_id=idea.id,
            user_id=idata["author_id"],
            role_title="Project Lead",
            application_note="Founder & Lead Builder",
            status="accepted"
        ))

    # 4. Jobs & Civic Opportunities
    jobs_data = [
        {
            "posted_by_id": sarah.id,
            "company_name": "Civica Labs",
            "company_logo": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80",
            "title": "Civic Tech Fellow – Full-Stack (Fall 2026)",
            "description": "Join our civic technology fellowship to build digital public infrastructure tools used by municipalities and citizen watchdog groups. You will architect accessible React interfaces and scalable FastAPI endpoints.",
            "requirements": "Proficiency in React, TypeScript, Python, REST APIs. Strong passion for civic engagement, public interest technology, and open source.",
            "skills_required": "React, TypeScript, Python, FastAPI, SQL, Git, Civic Tech",
            "location": "Bengaluru / Remote",
            "job_type": "fellowship",
            "cause_area": "Civic Tech",
            "is_remote": True,
            "salary_range": "₹45,000 / month Stipend"
        },
        {
            "posted_by_id": greenearth.id,
            "company_name": "GreenEarth Initiative",
            "company_logo": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&auto=format&fit=crop&q=80",
            "title": "Youth Climate Data Analyst (Internship)",
            "description": "Analyze municipal emission datasets, citizen air quality monitor logs, and urban vegetation coverage. Help our volunteer chapters visualize environmental hotspots.",
            "requirements": "Experience with Python, Pandas, Scikit-Learn, and data visualization tools. Demonstrated interest in climate action and grassroots research.",
            "skills_required": "Python, Data Analysis, Pandas, Scikit-Learn, Environmental Science",
            "location": "Pune / Hybrid",
            "job_type": "internship",
            "cause_area": "Climate Action",
            "is_remote": True,
            "salary_range": "₹30,000 / month Stipend"
        },
        {
            "posted_by_id": vikram.id,
            "company_name": "Nexora Social Innovation Lab",
            "company_logo": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80",
            "title": "Student Community Organizer & Volunteer Coordinator",
            "description": "Help coordinate civic action days across 15+ student chapters, organize digital safety seminars, and manage verified civic profile hour validations.",
            "requirements": "Excellent communication, event management experience, community organizing zeal, and basic knowledge of digital collaboration tools.",
            "skills_required": "Community Organizing, Volunteering, Youth Leadership, Public Speaking",
            "location": "National / Remote",
            "job_type": "volunteer",
            "cause_area": "Youth Empowerment",
            "is_remote": True,
            "salary_range": "Verified Academic Credits & Certificate"
        }
    ]

    for jdata in jobs_data:
        db.add(Job(**jdata))

    # 5. Feed Posts
    posts_data = [
        {
            "author_id": maya.id,
            "content": "Excited to share that our student team at IISc just completed our 12th community cleanup drive! 🌿 Through our open-source CivicClean initiative, 60+ student volunteers removed over 1,200 kg of plastic waste from neighborhood wetlands.\n\nWe tracked every spot using our mobile mapping prototype. Huge thanks to everyone who spent their Saturday morning with us! Next step: expanding to 3 more campus chapters.\n\nCheck out the pitch in the Nexora Idea Marketplace if you'd like to collaborate as a developer or campus lead! 🚀",
            "post_type": "civic_initiative",
            "media_url": "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1000&auto=format&fit=crop&q=80",
            "tags": "#CivicAction,#StudentLeadership,#Sustainability,#TechForGood",
            "likes_count": 48,
            "comments_count": 8
        },
        {
            "author_id": vikram.id,
            "content": "A question for all student technologists, researchers, and recruiters on Nexora:\n\nShould universities and companies officially weigh verifiable civic engagement & social impact projects equally alongside traditional GPA and LeetCode ratings when evaluating candidates?",
            "post_type": "poll",
            "media_url": "",
            "tags": "#HigherEd,#FutureOfWork,#YouthEngagement",
            "likes_count": 92,
            "comments_count": 24,
            "poll_question": "Should verified civic projects count alongside GPA/coding tests?",
            "poll_options": json.dumps(["Yes, absolutely essential", "Partially (for cultural fit)", "No, technical skill first", "View Results"])
        },
        {
            "author_id": sarah.jenkins.id if hasattr(sarah, 'jenkins') else sarah.id,
            "content": "📢 We just opened applications for the Civica Labs Fall 2026 Civic Tech Fellowships!\n\nWe are specifically looking for undergraduate and graduate students who want their code to solve real civic challenges—from digital voting transparency to climate data pipelines.\n\nTip for applicants: Use the Nexora AI Resume Screener to review your project descriptions before submitting. We value clarity of impact over endless buzzwords! Apply via the Jobs portal.",
            "post_type": "standard",
            "media_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80",
            "tags": "#CivicTech,#Internship,#StudentCareers,#Hiring",
            "likes_count": 65,
            "comments_count": 12
        }
    ]

    for pdata in posts_data:
        post = Post(**pdata)
        db.add(post)
        db.flush()

        # Add sample comments & reactions
        db.add(PostReaction(post_id=post.id, user_id=alex.id, reaction_type="celebrate"))
        db.add(PostReaction(post_id=post.id, user_id=priya.id, reaction_type="support"))
        db.add(PostReaction(post_id=post.id, user_id=sarah.id, reaction_type="insightful"))

        db.add(PostComment(
            post_id=post.id,
            user_id=alex.id,
            content="Incredible work Maya! The mapping model was super responsive. Proud to have contributed to the telemetry integration!"
        ))
        db.add(PostComment(
            post_id=post.id,
            user_id=vikram.id,
            content="Exemplary model of how students can bridge technical coursework with tangible community citizenship. Well done!"
        ))

    # 6. Messages
    conv = Conversation(participant1_id=maya.id, participant2_id=alex.id)
    db.add(conv)
    db.flush()

    db.add(Message(
        conversation_id=conv.id,
        sender_id=alex.id,
        receiver_id=maya.id,
        content="Hey Maya! Loved the CivicClean update on the feed today. Are we still meeting tomorrow to refine the volunteer push notifications?"
    ))
    db.add(Message(
        conversation_id=conv.id,
        sender_id=maya.id,
        receiver_id=alex.id,
        content="Hey Alex! Yes absolutely, let's connect at 4 PM. We also have two new applicants from the Student Idea Marketplace who want to help with the data pipeline!"
    ))

    # 7. Notifications
    db.add(Notification(
        user_id=maya.id,
        sender_id=alex.id,
        notification_type="reaction",
        title="Alex Rivera celebrated your post",
        message="Alex Rivera celebrated your update on the CivicClean initiative.",
        link_url="/feed"
    ))
    db.add(Notification(
        user_id=maya.id,
        sender_id=sarah.id,
        notification_type="connection",
        title="Sarah Jenkins accepted your connection",
        message="You and Sarah Jenkins are now 1st-degree connections on Nexora.",
        link_url="/network"
    ))

    db.commit()
    print("Database seeding completed successfully!")
