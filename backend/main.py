import os
import json
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

# ——— Load environment and configure OpenAI client ———
load_dotenv()
client = OpenAI()

# ——— FastAPI setup ———
app = FastAPI()

# Allow frontend on localhost:5173 (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ——— Request models ———
class TextIn(BaseModel):
    text: str
    goal: str

class RoadmapIn(BaseModel):
    skills: list[str]
    goal: str

# ——— Health check ———
@app.get("/")
def read_root():
    return {"message": "SkillMap AI backend is running!"}

# ——— Extract skills from resume text ———
@app.post("/extract_skills")
async def extract_skills(payload: TextIn):
    prompt = f"""
You are an expert career coach. Analyze the following resume text and suggest:
1. A list of technical skills the candidate already has.
2. A list of important skills the candidate should learn to become a successful {payload.goal}.
Return the output in JSON format like this:
{{
  "skills": [...],
  "needed": [...]
}}

Resume Text:
\"\"\"
{payload.text}
\"\"\"
"""
    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        raw = resp.choices[0].message.content.strip()
        logging.info(f"GPT raw reply:\n{raw}")

        # Remove code fences if present
        if raw.startswith("```"):
            raw = "\n".join(raw.splitlines()[1:-1]).strip()

        data = json.loads(raw)
        return data

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse JSON: {e.msg}. GPT reply:\n{raw}"
        )
    except Exception as e:
        logging.exception("Error in /extract_skills")
        raise HTTPException(status_code=500, detail=str(e))

# ——— Generate learning roadmap ———
@app.post("/generate_roadmap")
async def generate_roadmap(payload: RoadmapIn):
    prompt = f"""
You are an expert career coach. The user knows these skills already: {payload.skills}.
They want to become a {payload.goal}.  
Create a week-by-week learning roadmap, 4–6 weeks long.  
Respond ONLY with JSON in this format:
{{
  "weeks": [
    {{"title": "Week 1", "topics": ["topic1", "topic2"], "resources": ["link1", "link2"]}},
    ...
  ]
}}
"""
    try:
        resp = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You build learning roadmaps."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.3,
        )

        raw = resp.choices[0].message.content.strip()

        # Remove code fences if present
        if raw.startswith("```"):
            raw = "\n".join(raw.splitlines()[1:-1]).strip()

        return json.loads(raw)

    except Exception as e:
        logging.exception("Error in /generate_roadmap")
        raise HTTPException(status_code=500, detail=str(e))
