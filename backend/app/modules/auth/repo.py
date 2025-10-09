from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import User

class UserRepo:
    def __init__(self, db: Session):
        self.db = db

    def by_email(self, email: str) -> User | None:
        normalized = email.strip().lower()
        return self.db.execute(select(User).where(User.email == normalized)).scalar_one_or_none()

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user
