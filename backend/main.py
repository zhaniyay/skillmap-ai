from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# allow your React dev server to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SkillMap AI backend is running!"}


class TextIn(BaseModel):
    text: str
    goal: str  # optional for now, but include it

@app.post("/extract_skills")
async def extract_skills(payload: TextIn):
    # TODO: replace dummy logic with GPT call later
    # For now, return a hard-coded list so frontend can display it
    return {
        "skills": ["Python", "Machine Learning", "Data Analysis"],
        "needed": ["Deep Learning", "Docker", "MLOps"]
    }
