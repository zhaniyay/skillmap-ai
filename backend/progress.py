# backend/progress.py
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
import os
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, JSON
from models import User

# 1) Define the model
class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    goal: str
    skills: list = Field(default_factory=list, sa_column=Column(JSON))
    roadmap: list = Field(default_factory=list, sa_column=Column(JSON))
    completed_steps: list = Field(default_factory=list, sa_column=Column(JSON))  # now stores indices (ints)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

# Pydantic schemas
class ProgressBase(BaseModel):
    goal: str
    skills: List[str]
    roadmap: List[str]
    completed_steps: List[int] = []

class ProgressCreate(ProgressBase):
    pass

class ProgressOut(ProgressBase):
    id: int
    updated_at: datetime
    # Pydantic V2: replace orm_mode=True
    model_config = ConfigDict(from_attributes=True)

# 2) Initialize SQLite engine
DB_URL = os.getenv("PROGRESS_DB_URL", "sqlite:///progress.db")
engine = create_engine(DB_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_progress(user_id: str) -> list[Progress]:
    with Session(engine) as sess:
        return sess.exec(select(Progress).where(Progress.user_id == user_id)).all()

def update_progress(user_id: str, step: str, done: bool):
    with Session(engine) as sess:
        stmt = select(Progress).where(Progress.user_id == user_id, Progress.step == step)
        prog = sess.exec(stmt).first()
        if not prog:
            prog = Progress(user_id=user_id, step=step, done=done)
            sess.add(prog)
        else:
            prog.done = done
        sess.commit()
        return prog
