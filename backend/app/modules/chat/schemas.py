from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MessageIn(BaseModel):
    project_id: int
    content: str

class MessageOut(BaseModel):
    id: int
    project_id: int
    user_id: int
    content: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

