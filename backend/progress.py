# backend/progress.py
from sqlmodel import SQLModel, Field, create_engine, Session, select
import os

# 1) Определяем модель
class Progress(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str
    step: str
    done: bool = False

# 2) Инитим движок SQLite
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
