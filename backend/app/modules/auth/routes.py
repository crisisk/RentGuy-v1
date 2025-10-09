from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .schemas import UserCreate, UserOut, TokenOut, UserLogin
from .models import User
from .repo import UserRepo
from .security import hash_password, verify_password, create_access_token
from .deps import get_db, require_role

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    repo = UserRepo(db)
    if repo.by_email(payload.email):
        raise HTTPException(409, "Email already registered")
    u = User(email=payload.email, password_hash=hash_password(payload.password), role=payload.role)
    repo.add(u)
    db.commit()
    return UserOut(id=u.id, email=u.email, role=u.role)

@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    repo = UserRepo(db)
    u = repo.by_email(payload.email)
    if not u or not verify_password(payload.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(u.email)
    return TokenOut(access_token=token)

@router.get("/me", response_model=UserOut)
def me(user=Depends(require_role("admin","planner","warehouse","crew","finance","viewer"))):
    return UserOut(id=user.id, email=user.email, role=user.role)
