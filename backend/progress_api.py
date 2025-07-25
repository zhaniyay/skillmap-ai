from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from deps import get_current_user
from models import User
from progress import Progress, ProgressCreate, ProgressOut
from pydantic import BaseModel

router = APIRouter()

def get_db():
    from main import engine
    with Session(engine) as session:
        yield session

@router.get("/", response_model=ProgressOut)
def get_progress_for_user(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = db.exec(
        select(Progress).where(Progress.user_id == current_user.id).order_by(Progress.updated_at.desc())
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")
    return progress

@router.post("/", response_model=ProgressOut)
def create_or_update_progress(
    data: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.exec(
        select(Progress).where(Progress.user_id == current_user.id, Progress.goal == data.goal)
    ).first()
    if progress:
        progress.skills = data.skills
        progress.roadmap = data.roadmap
        progress.updated_at = datetime.utcnow()
    else:
        progress = Progress(
            user_id=current_user.id,
            goal=data.goal,
            skills=data.skills,
            roadmap=data.roadmap,
            updated_at=datetime.utcnow()
        )
        db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@router.get("/all/", response_model=List[ProgressOut])
def get_all_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.exec(
        select(Progress).where(Progress.user_id == current_user.id).order_by(Progress.updated_at.desc())
    ).all()

@router.delete("/{progress_id}/", status_code=204)
def delete_progress(
    progress_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.get(Progress, progress_id)
    if not progress or progress.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Progress not found")
    db.delete(progress)
    db.commit()
    return

class RenameGoalRequest(BaseModel):
    new_goal: str

@router.patch("/{progress_id}/", response_model=ProgressOut)
def rename_progress(
    progress_id: int,
    req: RenameGoalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.get(Progress, progress_id)
    if not progress or progress.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Progress not found")
    progress.goal = req.new_goal
    progress.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(progress)
    return progress

class ToggleStepRequest(BaseModel):
    step_idx: int
    done: bool

@router.patch("/{progress_id}/step/", response_model=ProgressOut)
def toggle_step(
    progress_id: int,
    req: ToggleStepRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.get(Progress, progress_id)
    if not progress or progress.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Progress not found")
    if req.done:
        if req.step_idx not in progress.completed_steps:
            progress.completed_steps.append(req.step_idx)
    else:
        progress.completed_steps = [i for i in progress.completed_steps if i != req.step_idx]
    progress.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(progress)
    return progress 