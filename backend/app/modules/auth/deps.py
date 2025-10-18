from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.db import SessionLocal
from .security import decode_token
from .repo import UserRepo
from .sso import (
    AzureB2CSSOClient,
    SSOStateStore,
)

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = UserRepo(db).by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user

def require_role(*roles: str):
    def checker(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker


_sso_state_store = SSOStateStore()


def get_sso_state_store() -> SSOStateStore:
    return _sso_state_store


def get_sso_client() -> AzureB2CSSOClient:
    if not settings.MRDJ_SSO_AUTHORITY or not settings.MRDJ_SSO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="SSO is not configured")

    client_secret = (
        settings.MRDJ_SSO_CLIENT_SECRET.get_secret_value()
        if settings.MRDJ_SSO_CLIENT_SECRET
        else None
    )

    return AzureB2CSSOClient(
        authority=settings.MRDJ_SSO_AUTHORITY,
        client_id=settings.MRDJ_SSO_CLIENT_ID,
        scope=settings.MRDJ_SSO_SCOPE,
        client_secret=client_secret,
    )
