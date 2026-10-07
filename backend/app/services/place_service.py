from collections.abc import Mapping, Sequence
from typing import Optional, Protocol
from uuid import UUID

from app.schemas.place import (
    CreatePlaceRequest,
    CreateReportRequest,
    NearbyCenter,
    NearbyPlace,
    NearbyPlacesResponse,
    PlaceResponse,
    PlaceType,
    ReportResponse,
)

DEFAULT_RADIUS_METERS = 3000
MAX_RADIUS_METERS = 50_000
MAX_RESULTS = 100


class PlaceRepository(Protocol):
    def find_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float,
        place_type: Optional[PlaceType],
        limit: int,
    ) -> Sequence[Mapping[str, object]]: ...

    def create_place(
        self,
        name: str,
        place_type: PlaceType,
        latitude: float,
        longitude: float,
        created_by: str,
        description: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
    ) -> Mapping[str, object]: ...

    def create_report(
        self,
        place_id: UUID,
        reported_by: str,
        reason: str,
        description: Optional[str] = None,
    ) -> Mapping[str, object]: ...


class PlaceService:
    def __init__(self, repository: PlaceRepository):
        self._repository = repository

    def find_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float = DEFAULT_RADIUS_METERS,
        place_type: Optional[PlaceType] = None,
    ) -> NearbyPlacesResponse:
        if not -90 <= latitude <= 90:
            raise ValueError("Latitude must be between -90 and 90.")
        if not -180 <= longitude <= 180:
            raise ValueError("Longitude must be between -180 and 180.")
        if not 1 <= radius_meters <= MAX_RADIUS_METERS:
            raise ValueError("Radius must be between 1 and 50000 meters.")

        rows = self._repository.find_nearby_places(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius_meters,
            place_type=place_type,
            limit=MAX_RESULTS,
        )

        return NearbyPlacesResponse(
            items=[NearbyPlace.model_validate(row) for row in rows],
            center=NearbyCenter(latitude=latitude, longitude=longitude),
            radius_meters=radius_meters,
        )

    def create_place(
        self,
        request: CreatePlaceRequest,
        created_by: str,
    ) -> PlaceResponse:
        row = self._repository.create_place(
            name=request.name,
            place_type=request.type,
            latitude=request.latitude,
            longitude=request.longitude,
            created_by=created_by,
            description=request.description,
            phone=request.phone,
            address=request.address,
        )
        return PlaceResponse.model_validate(row)

    def create_report(
        self,
        place_id: UUID,
        reported_by: str,
        request: CreateReportRequest,
    ) -> ReportResponse:
        row = self._repository.create_report(
            place_id=place_id,
            reported_by=reported_by,
            reason=request.reason,
            description=request.description,
        )
        return ReportResponse.model_validate(row)
