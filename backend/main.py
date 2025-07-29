import os
# 1) Silence the HuggingFace warning before anything else
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# 2) Load environment variables
from dotenv import load_dotenv
load_dotenv()

import tempfile
import traceback
from datetime import datetime, timedelta

from fastapi import (
    FastAPI, HTTPException, Depends,
    File, UploadFile, Form
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    OAuth2PasswordBearer, OAuth2PasswordRequestForm
)
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, create_engine, Session, select

from roadmap_generator import generate_roadmap
from resume_parser import extract_text_from_pdf, extract_skills
from progress import init_db, Progress, ProgressBase, ProgressCreate, ProgressOut
from progress_api import router as progress_router
from deps import get_current_user, get_user_by_username, SECRET_KEY, ALGORITHM, oauth2_scheme
from models import User

# --- Auth setup ----------------------------------------------------

# Models & engine
DATABASE_URL = os.getenv("PROGRESS_DB_URL", "sqlite:///progress.db")
engine = create_engine(DATABASE_URL, echo=False)

def init_auth_db():
    SQLModel.metadata.create_all(engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)
def verify_password(plain_pw, hashed_pw) -> bool:
    return pwd_context.verify(plain_pw, hashed_pw)

# JWT settings
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": username, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_user(username: str, password: str):
    hashed = hash_password(password)
    user = User(id=username, username=username, hashed_password=hashed)
    with Session(engine) as sess:
        sess.add(user)
        sess.commit()
    return user

def authenticate_user(username: str, password: str):
    user = get_user_by_username(username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

# --- App setup -----------------------------------------------------

# Configure CORS origins securely
def get_cors_origins():
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    if origins == "*":
        print("⚠️  WARNING: CORS_ORIGINS set to wildcard (*) - this is unsafe for production!")
        return ["*"]
    return [origin.strip() for origin in origins.split(",") if origin.strip()]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Init both DBs
init_db()
init_auth_db()

# Include progress router
app.include_router(progress_router, prefix="/progress")

# --- Data models --------------------------------------------------

from pydantic import validator, Field
from typing import List, Optional

class SkillRequest(BaseModel):
    skills: List[str] = Field(..., min_items=1, max_items=20, description="List of user skills")
    goal: str = Field(..., min_length=3, max_length=200, description="Career goal description")
    
    @validator('skills')
    def validate_skills(cls, v):
        if not v:
            raise ValueError('At least one skill is required')
        # Remove empty strings and duplicates
        cleaned_skills = list(set([skill.strip() for skill in v if skill.strip()]))
        if not cleaned_skills:
            raise ValueError('At least one non-empty skill is required')
        return cleaned_skills
    
    @validator('goal')
    def validate_goal(cls, v):
        if not v or not v.strip():
            raise ValueError('Goal cannot be empty')
        return v.strip()

class UploadResumeRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=200, description="Career goal description")
    
    @validator('goal')
    def validate_goal(cls, v):
        if not v or not v.strip():
            raise ValueError('Goal cannot be empty')
        return v.strip()

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class SuccessResponse(BaseModel):
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds

class Course(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None

class RoadmapResponse(BaseModel):
    roadmap: str = Field(..., description="Generated roadmap content")
    recommended_courses: List[Course] = Field(default_factory=list, description="Recommended courses")

class ResumeUploadResponse(BaseModel):
    extracted_skills: List[str] = Field(..., description="Skills extracted from resume")
    roadmap: str = Field(..., description="Generated roadmap content")
    recommended_courses: List[Course] = Field(default_factory=list, description="Recommended courses")

class StatusResponse(BaseModel):
    message: str
    status: str = "healthy"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# --- Auth endpoints -----------------------------------------------

@app.post("/signup", response_model=SuccessResponse)
def signup(form: OAuth2PasswordRequestForm = Depends()):
    # Validate username
    if not form.username or len(form.username.strip()) < 3:
        raise HTTPException(400, "Username must be at least 3 characters long")
    if len(form.username) > 50:
        raise HTTPException(400, "Username must be less than 50 characters")
    
    # Validate password
    if not form.password or len(form.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters long")
    
    if get_user_by_username(form.username.strip()):
        raise HTTPException(400, "Username already registered")
    
    create_user(form.username.strip(), form.password)
    return SuccessResponse(message="User created successfully")

@app.post("/token", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends()):
    # Validate input
    if not form.username or not form.username.strip():
        raise HTTPException(400, "Username is required")
    if not form.password:
        raise HTTPException(400, "Password is required")
    
    user = authenticate_user(form.username.strip(), form.password)
    if not user:
        raise HTTPException(401, "Incorrect username or password")
    
    token = create_access_token(user.username)
    return TokenResponse(access_token=token)

# --- Protected endpoints ------------------------------------------

@app.get("/", response_model=StatusResponse, dependencies=[Depends(get_current_user)])
def root():
    return StatusResponse(message="SkillMap AI backend is running 🚀")

@app.post(
    "/generate_roadmap",
    response_model=RoadmapResponse,
    dependencies=[Depends(get_current_user)]
)
async def roadmap_endpoint(data: SkillRequest):
    try:
        result = generate_roadmap(data.skills, data.goal)
        # Convert courses to proper format
        courses = [Course(title=course.get('title', ''), 
                         description=course.get('description'),
                         url=course.get('url'),
                         provider=course.get('provider')) 
                  for course in result.get('recommended_courses', [])]
        
        return RoadmapResponse(
            roadmap=result.get('roadmap', ''),
            recommended_courses=courses
        )
    except ValueError as e:
        print(f"⚠️ Validation error in /generate_roadmap: {str(e)}")
        raise HTTPException(400, f"Invalid input: {str(e)}")
    except Exception as e:
        print(f"❌ Exception in /generate_roadmap: {str(e)}")
        traceback.print_exc()
        raise HTTPException(500, "Failed to generate roadmap. Please try again later.")

@app.post(
    "/upload_resume",
    dependencies=[Depends(get_current_user)]
)
async def upload_resume(
    file: UploadFile = File(...),
    goal: str = Form(...)
):
    try:
        print(f"📁 Received file: {file.filename}, content_type: {file.content_type}")
        print(f"🎯 Goal: {goal}")
        
        # Security validations
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
        ALLOWED_CONTENT_TYPES = ['application/pdf']
        
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(400, "Only PDF files are supported")
        
        # Validate content type
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(400, f"Invalid content type. Expected: {ALLOWED_CONTENT_TYPES}")
        
        # Read and validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(400, f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB")
        
        if len(content) == 0:
            raise HTTPException(400, "File is empty")
        
        print(f"📄 File size: {len(content)} bytes (within {MAX_FILE_SIZE // (1024*1024)}MB limit)")
        
        # Save PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Extract text & skills
        print("🔍 Extracting text from PDF...")
        text = extract_text_from_pdf(tmp_path)
        print(f"📝 Extracted text length: {len(text)} characters")
        
        skills = extract_skills(text)
        print(f"🛠️ Found skills: {skills}")

        # Generate roadmap & courses
        print("🗺️ Generating roadmap...")
        result = generate_roadmap(skills, goal)

        # Clean up temp file
        os.unlink(tmp_path)
        
        # Return combined
        return {"extracted_skills": skills, **result}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception in /upload_resume: {str(e)}")
        traceback.print_exc()
        raise HTTPException(500, "Internal Server Error")

# --- Server startup -------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
