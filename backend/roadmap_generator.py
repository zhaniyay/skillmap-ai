   
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
            
            print(f"🔍 DEBUG: Parsing roadmap with {len(lines)} lines")
            
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                    
                print(f"🔍 Line {i}: '{line}' -> Current section: {current_section}")
                    
                # Detect section headers with more precise matching
                line_lower = line.lower()
                
                # More flexible section detection
                is_section_header = False
                
                # CV Overview & Assessment section (1.)
                if (line.startswith("1.") and ("cv overview" in line_lower or "assessment" in line_lower)) or \
                   ("cv overview" in line_lower and "assessment" in line_lower):
                    print(f"✅ Found CV Assessment section: {line}")
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "cv_assessment"
                    current_content = []
                    is_section_header = True
                    
                # Skills Gap Analysis section (2.)
                elif (line.startswith("2.") and ("skill" in line_lower and "gap" in line_lower)) or \
                     ("skills gap" in line_lower and "analysis" in line_lower):
                    print(f"✅ Found Skills Gap section: {line}")
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "skill_gaps"
                    current_content = []
                    is_section_header = True
                    
                # Learning Roadmap section (3.)
                elif (line.startswith("3.") and ("learning" in line_lower or "roadmap" in line_lower)) or \
                     ("learning roadmap" in line_lower):
                    print(f"✅ Found Learning Path section: {line}")
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "learning_path"
                    current_content = []
                    is_section_header = True
                    
                # CV Enhancement Tips section (4.)
                elif (line.startswith("4.") and ("cv" in line_lower or "tips" in line_lower)) or \
                     ("cv enhancement" in line_lower and "tips" in line_lower):
                    print(f"✅ Found CV Tips section: {line}")
                    if current_section and current_content:
                        _save_section_content(sections, current_section, current_content)
                    current_section = "cv_tips"
                    current_content = []
                    is_section_header = True
                elif current_section and line and not line.startswith('**') and not line.startswith('#') and not is_section_header:
                    # Add content to current section (skip section headers)
                    if line.startswith(('-', '•', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
                        # Remove bullet points and numbering
                        clean_line = line.lstrip('-•123456789. ').strip()
                        if clean_line:
                            print(f"📝 Adding to {current_section}: {clean_line}")
                            current_content.append(clean_line)
                    elif len(line) > 10:  # Avoid short fragments
                        print(f"📝 Adding to {current_section}: {line}")
                        current_content.append(line)
            
            # Save the last section
            if current_section and current_content:
                _save_section_content(sections, current_section, current_content)
                
        except Exception as e:
            print(f"⚠️ Error parsing roadmap sections: {e}")
            # Fallback: put everything in learning_path
            sections["learning_path"] = [roadmap_text]
            
        # Ensure CV assessment has content - fallback to first part of roadmap if empty
        if not sections["cv_assessment"] and roadmap_text:
            # Try to extract first paragraph as CV assessment
            first_paragraph = roadmap_text.split('\n\n')[0] if '\n\n' in roadmap_text else roadmap_text[:200]
            sections["cv_assessment"] = first_paragraph
            print(f"🔄 Fallback: Using first paragraph as CV assessment: {first_paragraph[:50]}...")
            
        return sections
    
    def _save_section_content(sections, section_name, content):
        """Helper to save content to the appropriate section"""
        if section_name == "cv_assessment":
            sections["cv_assessment"] = " ".join(content)
        elif section_name == "learning_path":
            # Special handling for learning path - split into individual actionable steps
            for item in content:
                individual_steps = _split_learning_path_into_steps(item)
                sections[section_name].extend(individual_steps)
        else:
            sections[section_name].extend(content)
    
    def _split_learning_path_into_steps(text):
        """Split learning path text into individual actionable steps"""
        steps = []
        
        # Split by common sentence patterns that indicate separate steps
        import re
        
        # Patterns that typically indicate step boundaries
        step_patterns = [
            r'\. Next,',
            r'\. Then,', 
            r'\. After that,',
            r'\. This will be followed by',
            r'\. Simultaneously,',
            r'\. Finally,',
            r'\. Subsequently,',
            r'\. Additionally,'
        ]
        
        # Split the text by these patterns
        current_text = text
        for pattern in step_patterns:
            parts = re.split(pattern, current_text, flags=re.IGNORECASE)
            if len(parts) > 1:
                # Rejoin with a delimiter we can split on later
                current_text = '|||STEP_BREAK|||'.join(parts)
        
        # Split by the delimiter
        potential_steps = current_text.split('|||STEP_BREAK|||')
        
        for step in potential_steps:
            step = step.strip()
            if len(step) > 20:  # Only include substantial steps
                # Clean up the step text
                step = step.strip('.').strip()
                
                # Extract time estimates if present
                time_match = re.search(r'\((\d+[-–]?\d*\s*months?)\)', step)
                if time_match:
                    # Keep the time estimate for clarity
                    steps.append(step)
                else:
                    # Add the step even without time estimate
                    steps.append(step)
        
        # If no clear splits found, try to split by periods and filter
        if len(steps) <= 1 and len(text) > 100:
            sentences = text.split('. ')
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 30 and ('learn' in sentence.lower() or 
                                         'understand' in sentence.lower() or
                                         'focus' in sentence.lower() or
                                         'obtain' in sentence.lower() or
                                         'familiarize' in sentence.lower()):
                    steps.append(sentence.strip('.'))
        
        # Ensure we have at least the original text if no splits worked
        if not steps:
            steps = [text]
            
        print(f"🔄 Split learning path into {len(steps)} steps:")
        for i, step in enumerate(steps):
            print(f"  {i+1}. {step[:60]}...")
            
        return steps
    
    # Parse the roadmap into structured sections
    structured_roadmap = parse_roadmap_sections(roadmap_text)
    
    print(f"📊 Structured roadmap sections:")
    print(f"  - CV Assessment: {len(structured_roadmap['cv_assessment'])} chars")
    print(f"    Content: '{structured_roadmap['cv_assessment'][:100]}...'")  # Show first 100 chars
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
