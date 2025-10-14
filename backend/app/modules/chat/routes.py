from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.deps import get_db, require_role, get_current_user
from app.modules.auth.models import User
from .schemas import MessageOut
from .repo import ChatRepo

router = APIRouter()

@router.get("/projects/{project_id}/chat", response_model=list[MessageOut])
def get_project_chat_history(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "planner", "crew", "viewer"))
):
    """
    Retrieves the chat history for a specific project.
    """
    # Note: A proper check would ensure the user is part of the project
    messages = ChatRepo(db).get_messages_by_project(project_id)
    return messages

