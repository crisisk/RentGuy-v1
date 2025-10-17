
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
import uuid
from datetime import datetime, timedelta

app = FastAPI()

# In-memory user storage (mock database)
USERS = {
    "user@example.com": {
        "email": "user@example.com",
        "hashed_password": "mock_hashed_password",
        "is_active": True
    }
}

# Token storage
TOKEN_STORE = {}

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    email: EmailStr
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Simple token generation mock
def generate_token(user_email: str, token_type: str = "access") -> str:
    token_id = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(minutes=30 if token_type == "access" else 60)
    
    token_store_entry = {
        "email": user_email,
        "type": token_type,
        "expiry": expiry
    }
    
    TOKEN_STORE[token_id] = token_store_entry
    return token_id

# Token validation
def validate_token(token: str) -> Optional[str]:
    token_info = TOKEN_STORE.get(token)
    if not token_info:
        return None
    
    if token_info['expiry'] < datetime.utcnow():
        del TOKEN_STORE[token]
        return None
    
    return token_info['email']

# OAuth2 password bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Token dependency
def get_current_user(token: str = Depends(oauth2_scheme)):
    email = validate_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return USERS.get(email)

# Authentication routes
@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = USERS.get(form_data.username)
    if not user or user['hashed_password'] != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = generate_token(form_data.username)
    refresh_token = generate_token(form_data.username, "refresh")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }

@app.post("/api/v1/auth/logout")
def logout(token: str = Depends(oauth2_scheme)):
    if token in TOKEN_STORE:
        del TOKEN_STORE[token]
    return {"message": "Logged out successfully"}

@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/api/v1/auth/refresh", response_model=TokenResponse)
def refresh_token(token: str = Depends(oauth2_scheme)):
    email = validate_token(token)
    if not email or TOKEN_STORE[token]['type'] != 'refresh':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Invalidate old tokens
    del TOKEN_STORE[token]
    
    # Generate new tokens
    access_token = generate_token(email)
    refresh_token = generate_token(email, "refresh")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


