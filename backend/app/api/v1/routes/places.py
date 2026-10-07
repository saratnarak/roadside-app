import logging
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import get_settings
from app.dependencies.auth import get_current_user
from app.repositories.place_repository import (
    DatabaseQueryError,
    PlaceRepository,
    PostgresPlaceRepository,
)
from app.schemas.place import (
    CreatePlaceRequest,
    CreateReportRequest,
    NearbyPlacesResponse,
    PlaceResponse,
    PlaceType,
    ReportResponse,
)
from app.schemas.user import ClerkUser
from app.services.place_service import PlaceService

logger = logging.getLogger(__name__)
router = APIRouter()


def get_place_repository() -> PlaceRepository:
    database_url = get_settings().database_url
    if not database_url:
        raise HTTPException(
            status_code=503,
            detail="Database service is temporarily unavailable.",
        )
    return PostgresPlaceRepository(database_url)


def get_place_service(
    repository: Annotated[PlaceRepository, Depends(get_place_repository)],
) -> PlaceService:
    return PlaceService(repository)


@router.get("/nearby", response_model=NearbyPlacesResponse)
def find_nearby_places(
    service: Annotated[PlaceService, Depends(get_place_service)],
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    radius: Annotated[float, Query(ge=1, le=50_000)] = 3000,
    place_type: Annotated[Optional[PlaceType], Query(alias="type")] = None,
) -> NearbyPlacesResponse:
    """Public endpoint to discover nearby places. No authentication required."""
    try:
        return service.find_nearby_places(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius,
            place_type=place_type,
        )
    except DatabaseQueryError as error:
        logger.exception("Nearby places database query failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve nearby places.",
        ) from error


@router.post("", response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
def create_place(
    request: CreatePlaceRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    service: Annotated[PlaceService, Depends(get_place_service)],
) -> PlaceResponse:
    """
    Authenticated endpoint to add a new repair shop or gas station.
    The created_by attribute is strictly derived from the verified Clerk user identity.
    """
    try:
        return service.create_place(
            request=request,
            created_by=current_user.user_id,
        )
    except DatabaseQueryError as error:
        logger.exception("Failed to create place")
        raise HTTPException(
            status_code=500,
            detail="Unable to create place.",
        ) from error


@router.post("/{place_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def report_place(
    place_id: UUID,
    request: CreateReportRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    service: Annotated[PlaceService, Depends(get_place_service)],
) -> ReportResponse:
    """
    Authenticated endpoint to report an inaccurate or closed place.
    The reported_by attribute is strictly derived from the verified Clerk user identity.
    """
    try:
        return service.create_report(
            place_id=place_id,
            reported_by=current_user.user_id,
            request=request,
        )
    except DatabaseQueryError as error:
        logger.exception("Failed to create report")
        raise HTTPException(
            status_code=500,
            detail="Unable to submit report.",
        ) from error
