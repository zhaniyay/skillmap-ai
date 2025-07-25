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

def get_user_by_username(username: str):
    with Session(engine) as sess:
        stmt = select(User).where(User.username == username)
        return sess.exec(stmt).first()

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

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # in prod specify your front-end URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init both DBs
init_db()
init_auth_db()

# Include progress router
app.include_router(progress_router, prefix="/progress")

# --- Data models --------------------------------------------------

class SkillRequest(BaseModel):
    skills: list[str]
    goal: str

# --- Auth endpoints -----------------------------------------------

@app.post("/signup")
def signup(form: OAuth2PasswordRequestForm = Depends()):
    if get_user_by_username(form.username):
        raise HTTPException(400, "Username already registered")
    create_user(form.username, form.password)
    return {"msg": "User created"}

@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(401, "Incorrect username or password")
    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer"}

# --- Protected endpoints ------------------------------------------

@app.get("/", dependencies=[Depends(get_current_user)])
def root():
    return {"message": "SkillMap AI backend is running 🚀"}

@app.post(
    "/generate_roadmap",
    dependencies=[Depends(get_current_user)]
)
async def roadmap_endpoint(data: SkillRequest):
    try:
        return generate_roadmap(data.skills, data.goal)
    except Exception:
        print("❌ Exception in /generate_roadmap:")
        traceback.print_exc()
        raise HTTPException(500, "Internal Server Error")

@app.post(
    "/upload_resume",
    dependencies=[Depends(get_current_user)]
)
async def upload_resume(
    file: UploadFile = File(...),
    goal: str = Form(...)
):
    try:
        # Save PDF
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Extract text & skills
        text = extract_text_from_pdf(tmp_path)
        skills = extract_skills(text)

        # Generate roadmap & courses
        result = generate_roadmap(skills, goal)

        # Return combined
        return {"extracted_skills": skills, **result}

    except Exception:
        print("❌ Exception in /upload_resume:")
        traceback.print_exc()
        raise HTTPException(500, "Internal Server Error")
