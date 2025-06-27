import os
import json
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

# ——— Load env and configure OpenAI client ———
load_dotenv()
client = OpenAI()

# ——— FastAPI app & CORS setup ———
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ——— Request model ———
class TextIn(BaseModel):
    text: str
    goal: str

# ——— Health check ———
@app.get("/")
def read_root():
    return {"message": "SkillMap AI backend is running!"}

# ——— Main endpoint ———
@app.post("/extract_skills")
async def extract_skills(payload: TextIn):
    # build the prompt
    prompt = f"""
You are an expert career coach.
Extract all the technical skills mentioned in this resume,
and then suggest additional skills needed to become a {payload.goal}.
Resume:
\"\"\"{payload.text}\"\"\"
Respond ONLY with valid JSON in this exact format:
{{"skills":[...], "needed":[...]}}
"""

    try:
        # call the new OpenAI v1 client
        resp = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You extract technical skills from resumes."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
        )

        # get the assistant’s reply
        raw = resp.choices[0].message.content.strip()
        logging.info(f"GPT raw reply:\n{raw}")

        # strip code fences if present
        if raw.startswith("```") and raw.endswith("```"):
            raw = "\n".join(raw.splitlines()[1:-1]).strip()

        # parse JSON
        data = json.loads(raw)
        return data

    except json.JSONDecodeError as e:
        # bad JSON from GPT – return the raw reply for debugging
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse JSON: {e.msg}. GPT reply:\n{raw}"
        )
    except Exception as e:
        logging.exception("Error in /extract_skills")
        raise HTTPException(status_code=500, detail=str(e))

class RoadmapIn(BaseModel):
    skills: list[str]
    goal: str

@app.post("/generate_roadmap")
async def generate_roadmap(payload: RoadmapIn):
    prompt = f"""
You are an expert career coach. The user knows these skills already: {payload.skills}.
They want to become a {payload.goal}.  
Create a week-by-week learning roadmap, 4–6 weeks long.  
Respond ONLY with JSON in this format:
{{
  "weeks": [
    {{"title": "Week 1", "topics": ["topic1", "topic2"], "resources": ["link1","link2"]}},
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
        # strip code fences if any...
        if raw.startswith("```"):
            raw = "\n".join(raw.splitlines()[1:-1])
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
