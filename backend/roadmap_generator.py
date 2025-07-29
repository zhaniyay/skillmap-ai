   
import os
from dotenv import load_dotenv           # 1. Import dotenv
load_dotenv()   
from openai import OpenAI            # 3. Now OpenAI will find the key
from memory_manager import MemoryManager
from course_recommender import CourseRecommender

# 4. Initialize OpenAI client with loaded key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 5. FAISS memory for context
memory = MemoryManager()

# 6. Course recommendations
recommender = CourseRecommender()

def generate_roadmap(user_skills: list[str], goal: str) -> dict:
    # Clean and normalize user skills
    normalized_skills = [skill.strip().lower() for skill in user_skills if skill.strip()]
    skills_text = ', '.join(user_skills) if user_skills else 'No specific skills listed'
    
    # Enhanced personalized prompt
    base_prompt = (
        f"You are an expert career mentor and CV consultant. A user wants to become a {goal}.\n\n"
        f"**CURRENT SKILLS FROM THEIR RESUME:** {skills_text}\n\n"
        f"Create a comprehensive, personalized career development plan with exactly four sections:\n\n"
        f"1. **CV Overview & Assessment** – Analyze their current skill set and provide a 3-4 sentence assessment of their CV's strengths and areas for improvement specific to the {goal} role. Be constructive and specific.\n\n"
        f"2. **Skills Gap Analysis** – List 6-10 specific skills they need to learn to become a successful {goal}. "
        f"IMPORTANT: Do NOT suggest skills they already have ({skills_text}). "
        f"Focus on missing technical skills, tools, frameworks, certifications, or methodologies. "
        f"Format as actionable items (e.g., 'Learn React.js for frontend development', 'Master SQL for database management').\n\n"
        f"3. **Learning Roadmap** – Prioritize the skills from section 2 into a logical learning sequence. "
        f"Explain why each skill builds on the previous ones and provide estimated timeframes.\n\n"
        f"4. **CV Enhancement Tips** – Provide 5-7 specific, actionable tips to improve their resume for {goal} positions. "
        f"Include advice on formatting, keywords, quantifying achievements, and industry-specific best practices.\n\n"
        f"Make your response highly personalized based on their existing skills. Be specific and actionable."
    )

    # 2) Pull context from memory
    ctx_items = memory.retrieve(f"{','.join(user_skills)}::{goal}", k=3)
    context = "\n".join(ctx_items) if ctx_items else ""
    full_prompt = f"{context}\n\n{base_prompt}" if context else base_prompt

    # 3) Make request to OpenAI
    resp = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0.7,
        max_tokens=700
    )
    roadmap_text = resp.choices[0].message.content

    # 4) Save new dialogue to memory
    memory.add(full_prompt, roadmap_text)

    # 5) Generate course recommendations based on skill gaps
    # Create a query focusing on skills they need to learn (not what they have)
    gap_query = f"skills needed for {goal} career development learning roadmap"
    if normalized_skills:
        gap_query += f" excluding {', '.join(normalized_skills)}"
    
    top_courses = recommender.recommend(gap_query, k=8)
    print(f"📚 Found {len(top_courses)} relevant courses for skill gaps")

    # 6) Parse the roadmap text into structured sections
    def parse_roadmap_sections(text):
        """Parse AI-generated roadmap text into structured sections"""
        sections = {
            "cv_assessment": "",
            "skill_gaps": [],
            "learning_path": [],
            "cv_tips": []
        }
        
        try:
            # Split by section headers
            lines = text.split('\n')
            current_section = None
            current_content = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Detect section headers
                if "CV Overview" in line or "Assessment" in line:
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "cv_assessment"
                    current_content = []
                elif "Skills Gap" in line or "Gap Analysis" in line:
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "skill_gaps"
                    current_content = []
                elif "Learning Roadmap" in line or "Roadmap" in line:
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "learning_path"
                    current_content = []
                elif "CV Enhancement" in line or "Tips" in line:
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "cv_tips"
                    current_content = []
                elif current_section and line and not line.startswith('**') and not line.startswith('#'):
                    # Add content to current section
                    if line.startswith(('-', '•', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
                        # Remove bullet points and numbering
                        clean_line = line.lstrip('-•123456789. ').strip()
                        if clean_line:
                            current_content.append(clean_line)
                    elif len(line) > 10:  # Avoid short fragments
                        current_content.append(line)
            
            # Save the last section
            if current_section and current_content:
                _save_section_content(sections, current_section, current_content)
                
        except Exception as e:
            print(f"⚠️ Error parsing roadmap sections: {e}")
            # Fallback: put everything in learning_path
            sections["learning_path"] = [roadmap_text]
            
        return sections
    
    def _save_section_content(sections, section_name, content):
        """Helper to save content to the appropriate section"""
        if section_name == "cv_assessment":
            sections["cv_assessment"] = " ".join(content)
        else:
            sections[section_name].extend(content)
    
    # Parse the roadmap into structured sections
    structured_roadmap = parse_roadmap_sections(roadmap_text)
    
    print(f"📊 Structured roadmap sections:")
    print(f"  - CV Assessment: {len(structured_roadmap['cv_assessment'])} chars")
    print(f"  - Skill Gaps: {len(structured_roadmap['skill_gaps'])} items")
    print(f"  - Learning Path: {len(structured_roadmap['learning_path'])} items")
    print(f"  - CV Tips: {len(structured_roadmap['cv_tips'])} items")
    
    # 7) Return comprehensive roadmap with structured data
    return {
        "roadmap": roadmap_text,  # Keep original for backwards compatibility
        "cv_assessment": structured_roadmap["cv_assessment"],
        "skill_gaps": structured_roadmap["skill_gaps"],
        "learning_path": structured_roadmap["learning_path"],
        "cv_tips": structured_roadmap["cv_tips"],
        "recommended_courses": top_courses,
        "extracted_skills_count": len(user_skills),
        "personalized": True
    }
