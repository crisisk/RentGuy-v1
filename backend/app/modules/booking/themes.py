"""
Theme management and validation
"""
from enum import Enum
from pydantic import BaseModel, validator

class ThemeName(str, Enum):
    PHOTOGRAPHY = "Photography"
    VIDEOGRAPHY = "Videography"
    LIGHTING = "Lighting"
    AUDIO = "Audio"
    DRONES = "Drones"
    VR = "Virtual Reality"
    STABILIZATION = "Stabilization"
    LIVE_STREAMING = "Live Streaming"
    POWER = "Power Solutions"
    ACCESSORIES = "Accessories"

class ThemeBase(BaseModel):
    name: ThemeName
    description: str
    icon: str = "mdi-camera"

    class Config:
        use_enum_values = True

    @validator("name")
    def validate_theme(cls, value):
        """Validate theme name against predefined list"""
        if value not in ThemeName._value2member_map_:
            raise ValueError(f"Invalid theme: {value}")
        return value