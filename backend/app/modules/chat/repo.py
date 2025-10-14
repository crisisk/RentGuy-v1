from sqlalchemy.orm import Session
from .models import Message
from .schemas import MessageIn

class ChatRepo:
    def __init__(self, db: Session):
        self.db = db

    def create_message(self, project_id: int, user_id: int, content: str) -> Message:
        message = Message(
            project_id=project_id,
            user_id=user_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_messages_by_project(self, project_id: int, limit: int = 50) -> list[Message]:
        return self.db.query(Message).filter(Message.project_id == project_id).order_by(Message.timestamp.desc()).limit(limit).all()

