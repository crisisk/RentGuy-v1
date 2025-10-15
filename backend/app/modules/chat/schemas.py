from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime

class MessageIn(BaseModel):
    project_id: int
    user_id: int
    content: str = Field(..., min_length=1)

    model_config = ConfigDict(extra="forbid")

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

class MessageOut(BaseModel):
    id: int
    project_id: int
    user_id: int
    content: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

