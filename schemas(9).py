from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "admin"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
