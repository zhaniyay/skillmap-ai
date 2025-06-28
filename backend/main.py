import os
import json
import logging
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from openai import OpenAI

# Load environment variables and OpenAI client
load_dotenv()
client = OpenAI()

# Ensure snapshot folder exists
os.makedirs("snapshots", exist_ok=True)

# Initialize FastAPI app
app = FastAPI()

# CORS config for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class TextIn(BaseModel):
    text: str
    goal: str

class RoadmapIn(BaseModel):
    skills: list[str]
    goal: str

class SaveRequest(BaseModel):
    roadmap: list[dict]

# Health check
@app.get("/")
def read_root():
    return {"message": "SkillMap AI backend is running!"}

# Extract skills
@app.post("/extract_skills")
async def extract_skills(payload: TextIn):
    if len(payload.text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Resume text is too short.")
    if len(payload.goal.strip()) < 3:
        raise HTTPException(status_code=400, detail="Goal is too short.")

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
        return json.loads(resp.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate learning roadmap
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
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.splitlines()[1:-1])
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Save roadmap to file
@app.post("/save_roadmap")
async def save_roadmap(payload: SaveRequest):
    try:
        roadmap_id = str(uuid4())[:8]
        path = f"snapshots/{roadmap_id}.json"
        with open(path, "w") as f:
            json.dump(payload.roadmap, f)
        return {"id": roadmap_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get saved roadmap
@app.get("/shared/{roadmap_id}")
async def get_saved_roadmap(roadmap_id: str):
    try:
        path = f"snapshots/{roadmap_id}.json"
        with open(path) as f:
            roadmap = json.load(f)
        return {"weeks": roadmap}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Roadmap not found")
