from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PlaceType(str, Enum):
    REPAIR_SHOP = "repair_shop"
    GAS_STATION = "gas_station"


class NearbyPlace(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: PlaceType
    description: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    distance_meters: float = Field(ge=0)
    is_verified: bool


class NearbyCenter(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class NearbyPlacesResponse(BaseModel):
    items: list[NearbyPlace]
    center: NearbyCenter
    radius_meters: float = Field(gt=0, le=50_000)


class CreatePlaceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: PlaceType
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: Optional[str] = Field(default=None, max_length=1000)
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=500)


class PlaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: PlaceType
    description: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float
    is_verified: bool = False
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None


class CreateReportRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    place_id: UUID
    reported_by: str
    reason: str
    description: Optional[str] = None
    status: str = "pending"
    created_at: Optional[datetime] = None
