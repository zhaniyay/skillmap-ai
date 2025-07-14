   
import os
from dotenv import load_dotenv           # 1. Импортируем
load_dotenv()   
from openai import OpenAI            # 3. Теперь OpenAI найдёт ключ
from memory_manager import MemoryManager
from course_recommender import CourseRecommender

# 4. Инициализируем OpenAI-клиента с загруженным ключом
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 5. FAISS-память для контекста
memory = MemoryManager()

# 6. Рекомендации курсов
recommender = CourseRecommender()

def generate_roadmap(user_skills: list[str], goal: str) -> dict:
    # 1) Базовый prompt
    base_prompt = (
        f"You are a career mentor. A user has the following skills: "
        f"{', '.join(user_skills)}.\n"
        f"They want to become a {goal}. Suggest a personalized, "
        f"step-by-step roadmap to reach this goal, "
        f"highlighting what they need to learn or improve.\n"
        f"Return the result as a numbered list."
    )

    # 2) Подтягиваем контекст из памяти
    ctx_items = memory.retrieve(f"{','.join(user_skills)}::{goal}", k=3)
    context = "\n".join(ctx_items) if ctx_items else ""
    full_prompt = f"{context}\n\n{base_prompt}" if context else base_prompt

    # 3) Делаем запрос к OpenAI
    resp = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0.7,
        max_tokens=700
    )
    roadmap_text = resp.choices[0].message.content

    # 4) Сохраняем в память новый диалог
    memory.add(full_prompt, roadmap_text)

    # 5) Рекомендации курсов по пробелам
    gap_text = ", ".join(user_skills)
    top_courses = recommender.recommend(gap_text, k=5)

    # 6) Возвращаем roadmap и список курсов
    return {
        "roadmap": roadmap_text,
        "recommended_courses": top_courses
    }
