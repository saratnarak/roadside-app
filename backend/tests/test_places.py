from collections.abc import Mapping, Sequence
from typing import Any, Optional
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.api.v1.routes.places import get_place_service
from app.main import app
from app.schemas.place import NearbyPlacesResponse, PlaceType
from app.services.place_service import PlaceService

client = TestClient(app)

REPAIR_PLACE = {
    "id": UUID("a1000000-0000-4000-8000-000000000001"),
    "name": "Demo Sokha Moto Repair",
    "type": PlaceType.REPAIR_SHOP,
    "description": "Development/demo listing; not externally verified.",
    "phone": "+855 12 000 101",
    "address": "Boeng Keng Kang I",
    "latitude": 11.5564,
    "longitude": 104.9282,
    "distance_meters": 12.5,
    "is_verified": False,
}

GAS_PLACE = {
    **REPAIR_PLACE,
    "id": UUID("a2000000-0000-4000-8000-000000000001"),
    "name": "Demo Central Phnom Penh Fuel",
    "type": PlaceType.GAS_STATION,
    "distance_meters": 55.1,
}


class FakePlaceRepository:
    def __init__(self, rows: Sequence[Mapping[str, object]]):
        self.rows = rows
        self.calls: list[dict[str, Any]] = []

    def find_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float,
        place_type: Optional[PlaceType],
        limit: int,
    ) -> Sequence[Mapping[str, object]]:
        self.calls.append(
            {
                "latitude": latitude,
                "longitude": longitude,
                "radius_meters": radius_meters,
                "place_type": place_type,
                "limit": limit,
            }
        )
        return self.rows


@pytest.fixture
def restore_dependency_override():
    original = app.dependency_overrides.copy()
    yield
    app.dependency_overrides = original


def test_service_transforms_nearby_place_and_applies_defaults():
    repository = FakePlaceRepository([REPAIR_PLACE])
    response = PlaceService(repository).find_nearby_places(
        latitude=11.5564,
        longitude=104.9282,
    )

    assert isinstance(response, NearbyPlacesResponse)
    assert response.center.latitude == 11.5564
    assert response.center.longitude == 104.9282
    assert response.radius_meters == 3000
    assert response.items[0].name == "Demo Sokha Moto Repair"
    assert response.items[0].distance_meters == 12.5
    assert repository.calls[0]["limit"] == 100


@pytest.mark.parametrize(
    ("latitude", "longitude", "radius"),
    [
        (91, 0, 3000),
        (-91, 0, 3000),
        (0, 181, 3000),
        (0, -181, 3000),
        (0, 0, 0),
        (0, 0, 50_001),
    ],
)
def test_service_rejects_invalid_coordinates_and_radius(latitude, longitude, radius):
    with pytest.raises(ValueError):
        PlaceService(FakePlaceRepository([])).find_nearby_places(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius,
        )


def test_service_forwards_type_filter():
    repository = FakePlaceRepository([REPAIR_PLACE])
    PlaceService(repository).find_nearby_places(
        latitude=11.5564,
        longitude=104.9282,
        place_type=PlaceType.REPAIR_SHOP,
    )

    assert repository.calls[0]["place_type"] == PlaceType.REPAIR_SHOP


def test_nearby_endpoint_returns_places_and_center(restore_dependency_override):
    repository = FakePlaceRepository([REPAIR_PLACE, GAS_PLACE])
    app.dependency_overrides[get_place_service] = lambda: PlaceService(repository)

    response = client.get(
        "/api/v1/places/nearby",
        params={"latitude": 11.5564, "longitude": 104.9282, "radius": 3000},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["center"] == {"latitude": 11.5564, "longitude": 104.9282}
    assert body["radius_meters"] == 3000
    assert [item["type"] for item in body["items"]] == ["repair_shop", "gas_station"]
    assert body["items"][0]["distance_meters"] == 12.5


@pytest.mark.parametrize(
    "params",
    [
        {"latitude": 91, "longitude": 0},
        {"latitude": 0, "longitude": 181},
        {"latitude": 0, "longitude": 0, "radius": 50_001},
        {"latitude": 0, "longitude": 0, "radius": 0},
        {"latitude": 0, "longitude": 0, "type": "cafe"},
        {"longitude": 0},
    ],
)
def test_nearby_endpoint_rejects_invalid_query(params, restore_dependency_override):
    app.dependency_overrides[get_place_service] = lambda: PlaceService(FakePlaceRepository([]))
    response = client.get("/api/v1/places/nearby", params=params)

    assert response.status_code == 422


def test_nearby_endpoint_forwards_type_filter(restore_dependency_override):
    repository = FakePlaceRepository([REPAIR_PLACE])
    app.dependency_overrides[get_place_service] = lambda: PlaceService(repository)

    response = client.get(
        "/api/v1/places/nearby",
        params={
            "latitude": 11.5564,
            "longitude": 104.9282,
            "type": "repair_shop",
        },
    )

    assert response.status_code == 200
    assert repository.calls[0]["place_type"] == PlaceType.REPAIR_SHOP
    assert repository.calls[0]["radius_meters"] == 3000
