
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import uuid4

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role_id: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str

class Role(BaseModel):
    id: str
    name: str
    permissions: List[str]

class Settings(BaseModel):
    maintenance_mode: bool = False
    max_login_attempts: int = 3
    allow_registration: bool = True

# In-memory storage
users = [
    User(id=str(uuid4()), email="admin@example.com", name="Admin", role_id="admin"),
    User(id=str(uuid4()), email="user1@example.com", name="User 1", role_id="user"),
    User(id=str(uuid4()), email="user2@example.com", name="User 2", role_id="user"),
    User(id=str(uuid4()), email="user3@example.com", name="User 3", role_id="user"),
    User(id=str(uuid4()), email="user4@example.com", name="User 4", role_id="user"),
    User(id=str(uuid4()), email="user5@example.com", name="User 5", role_id="user")
]

roles = [
    Role(id="admin", name="Administrator", permissions=["full_access"]),
    Role(id="user", name="Regular User", permissions=["read", "create"]),
    Role(id="guest", name="Guest", permissions=["read"])
]

settings = Settings()

# Admin Router
admin_router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Users Endpoints
@admin_router.get("/users", response_model=List[User])
async def list_users():
    return users

@admin_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    new_user = User(
        id=str(uuid4()),
        email=user.email,
        name=user.name,
        role_id=user.role_id
    )
    users.append(new_user)
    return new_user

@admin_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user: UserCreate):
    for idx, existing_user in enumerate(users):
        if existing_user.id == user_id:
            updated_user = User(
                id=user_id,
                email=user.email,
                name=user.name,
                role_id=user.role_id
            )
            users[idx] = updated_user
            return updated_user
    raise HTTPException(status_code=404, detail="User not found")

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    for idx, user in enumerate(users):
        if user.id == user_id:
            del users[idx]
            return {"message": "User deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")

# Roles Endpoint
@admin_router.get("/roles", response_model=List[Role])
async def list_roles():
    return roles

# Settings Endpoints
@admin_router.get("/settings", response_model=Settings)
async def get_settings():
    return settings

@admin_router.patch("/settings", response_model=Settings)
async def update_settings(new_settings: Settings):
    global settings
    settings = new_settings
    return settings


