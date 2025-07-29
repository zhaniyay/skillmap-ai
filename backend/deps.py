from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select
from models import User
import os
import secrets
import sys

# Generate a secure JWT secret
def get_jwt_secret():
    # Load environment variables first
    from dotenv import load_dotenv
    load_dotenv()
    
    secret = os.getenv("JWT_SECRET")
    if not secret or secret.strip() == "" or secret == "CHANGE_ME" or secret == "your_secure_jwt_secret_here":
        print("⚠️  WARNING: JWT_SECRET not set or using default value!")
        print(f"📋 Current JWT_SECRET value: '{secret}'")
        print("🔐 Generating a secure random secret for this session...")
        print("📝 For production, set JWT_SECRET environment variable to a secure value.")
        # Generate a cryptographically secure random secret
        return secrets.token_urlsafe(32)
    
    print(f"✅ JWT_SECRET loaded successfully (length: {len(secret)})")
    return secret

SECRET_KEY = get_jwt_secret()
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_user_by_username(username: str):
    from sqlmodel import create_engine
    DATABASE_URL = os.getenv("PROGRESS_DB_URL", "sqlite:///progress.db")
    engine = create_engine(DATABASE_URL, echo=False)
    with Session(engine) as sess:
        stmt = select(User).where(User.username == username)
        return sess.exec(stmt).first()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(username)
    if not user:
        raise credentials_exception
    return user 