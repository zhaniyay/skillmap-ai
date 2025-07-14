# backend/auth.py
import os, uuid
from datetime import datetime, timedelta

from sqlmodel import SQLModel, Field, Session, select, create_engine
from passlib.context import CryptContext
from jose import JWTError, jwt

# 1) User model
class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    username: str
    hashed_password: str

# 2) DB engine (reuse progress DB or create a new one)
DATABASE_URL = os.getenv("PROGRESS_DB_URL", "sqlite:///progress.db")
engine = create_engine(DATABASE_URL, echo=False)

def init_auth_db():
    SQLModel.metadata.create_all(engine)

# 3) Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(plain_pw, hashed_pw) -> bool:
    return pwd_context.verify(plain_pw, hashed_pw)

# 4) JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "change_this_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_username(username: str):
    with Session(engine) as sess:
        stmt = select(User).where(User.username == username)
        return sess.exec(stmt).first()

def create_user(username: str, password: str):
    user = User(username=username, hashed_password=hash_password(password))
    with Session(engine) as sess:
        sess.add(user)
        sess.commit()
        sess.refresh(user)
    return user

def authenticate_user(username: str, password: str):
    user = get_user_by_username(username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
