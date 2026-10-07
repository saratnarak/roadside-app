from fastapi import APIRouter

from app.api.v1.routes.places import router as places_router
from app.api.v1.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(places_router, prefix="/places", tags=["places"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
