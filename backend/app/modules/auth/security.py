from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from app.core.config import settings

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    return pwd.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return pwd.verify(password, hashed)
    except (ValueError, UnknownHashError):
        return False

def create_access_token(sub: str) -> str:
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {"sub": sub, "exp": exp, "iat": now, "nbf": now}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.JWT_ALG)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.JWT_ALG])
