from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select
from models import User
import os

SECRET_KEY = os.getenv("JWT_SECRET", "CHANGE_ME")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_user_by_username(username: str):
    from main import engine
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