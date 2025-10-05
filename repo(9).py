from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import User

class UserRepo:
    def __init__(self, db: Session):
        self.db = db

    def by_email(self, email: str) -> User | None:
        return self.db.execute(select(User).where(User.email==email)).scalar_one_or_none()

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user
