   
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
    # 1) Base prompt
    base_prompt = (
        f"You are a career mentor. A user has the following skills: "
        f"{', '.join(user_skills)}.\n"
        f"They want to become a {goal}. Create a personalized CV roadmap "
        f"with exactly three sections:\n\n"
        f"1. **Overview** – Write a 2–3 sentence summary of what makes a great CV for the {goal} role.\n\n"
        f"2. **Skills to Learn** – List 5–8 concrete, real-world skills they should develop, "
        f"formatted as unchecked markdown checkboxes (- [ ] Skill name). "
        f"Focus on specific, actionable skills like software tools, languages, certifications, or techniques.\n\n"
        f"3. **Additional CV Tips** – Provide 3–5 bullet points of actionable resume-enhancement "
        f"techniques such as quantifying results, tailoring to ATS systems, formatting best practices, "
        f"or industry-specific advice.\n\n"
        f"Format your response with clear section headers and follow the structure exactly."
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

    # 5) Course recommendations for gaps
    gap_text = ", ".join(user_skills)
    top_courses = recommender.recommend(gap_text, k=5)

    # 6) Return roadmap and course list
    return {
        "roadmap": roadmap_text,
        "recommended_courses": top_courses
    }
