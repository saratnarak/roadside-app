from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ClerkUser(BaseModel):
    user_id: str
    email: Optional[str] = None
    session_id: Optional[str] = None
    claims: Dict[str, Any] = Field(default_factory=dict)


class UserResponse(BaseModel):
    id: Optional[str] = None
    clerk_user_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
