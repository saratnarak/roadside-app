import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.schemas.user import ClerkUser, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
) -> UserResponse:
    """
    Returns the authenticated user's profile derived from their verified Clerk session.
    """
    claims = current_user.claims
    display_name = (
        claims.get("name")
        or claims.get("first_name")
        or (current_user.email.split("@")[0] if current_user.email else None)
        or "MotoRescue Rider"
    )
    avatar_url = claims.get("image_url") or claims.get("picture")

    return UserResponse(
        clerk_user_id=current_user.user_id,
        email=current_user.email,
        display_name=display_name,
        avatar_url=avatar_url,
    )
