from app.core.db import SessionLocal, Base, engine
from app.modules.auth.repo import UserRepo
from app.modules.auth.models import User
from app.modules.auth.security import hash_password

def main():
    db = SessionLocal()
    try:
        repo = UserRepo(db)
        email = "rentguy@demo.local"
        if not repo.by_email(email):
            u = User(email=email, password_hash=hash_password("rentguy"), role="admin")
            db.add(u)
            db.commit()
            print("[seed] Created admin user:", email)
        else:
            print("[seed] Admin user exists:", email)
    finally:
        db.close()

if __name__ == "__main__":
    main()
