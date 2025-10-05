from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class StepOut(BaseModel):
    code: str
    title: str
    description: str
    class Config: from_attributes = True

class ProgressOut(BaseModel):
    user_email: EmailStr
    step_code: str
    status: str
    completed_at: Optional[datetime] = None
    class Config: from_attributes = True

class CompleteIn(BaseModel):
    user_email: EmailStr
    step_code: str

class TipOut(BaseModel):
    id: int
    module: str
    message: str
    cta: str
    class Config: from_attributes = True
