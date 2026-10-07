from collections.abc import Mapping, Sequence
from typing import Optional, Protocol
from uuid import UUID

import psycopg
from psycopg.rows import dict_row

from app.schemas.place import PlaceType

NEARBY_PLACES_SQL = """
WITH search_point AS (
    SELECT ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography AS location
)
SELECT
    places.id,
    places.name,
    places.type,
    places.description,
    places.phone,
    places.address,
    ST_Y(places.location::geometry) AS latitude,
    ST_X(places.location::geometry) AS longitude,
    ST_Distance(places.location, search_point.location) AS distance_meters,
    places.is_verified
FROM public.places AS places
CROSS JOIN search_point
WHERE places.is_active = TRUE
  AND ST_DWithin(places.location, search_point.location, %s)
  AND (%s::public.place_type IS NULL OR places.type = %s::public.place_type)
ORDER BY distance_meters ASC
LIMIT %s
"""

CREATE_PLACE_SQL = """
INSERT INTO public.places (
    name, type, description, phone, address, location, created_by, is_active, is_verified
) VALUES (
    %s, %s::public.place_type, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s, TRUE, FALSE
)
RETURNING
    id,
    name,
    type,
    description,
    phone,
    address,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude,
    is_verified,
    is_active,
    created_by,
    created_at
"""

CREATE_REPORT_SQL = """
INSERT INTO public.reports (
    place_id, reported_by, reason, description, status
) VALUES (
    %s, %s, %s, %s, 'pending'
)
RETURNING id, place_id, reported_by, reason, description, status, created_at
"""


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


class DatabaseQueryError(Exception):
    pass


class PostgresPlaceRepository:
    def __init__(self, database_url: str):
        self._database_url = database_url

    def find_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float,
        place_type: Optional[PlaceType],
        limit: int,
    ) -> Sequence[Mapping[str, object]]:
        place_type_value = place_type.value if place_type else None
        try:
            with psycopg.connect(self._database_url, row_factory=dict_row) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        NEARBY_PLACES_SQL,
                        (
                            longitude,
                            latitude,
                            radius_meters,
                            place_type_value,
                            place_type_value,
                            limit,
                        ),
                    )
                    return cursor.fetchall()
        except psycopg.Error as error:
            raise DatabaseQueryError from error

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
    ) -> Mapping[str, object]:
        try:
            with psycopg.connect(self._database_url, row_factory=dict_row) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        CREATE_PLACE_SQL,
                        (
                            name,
                            place_type.value,
                            description,
                            phone,
                            address,
                            longitude,
                            latitude,
                            created_by,
                        ),
                    )
                    return cursor.fetchone()
        except psycopg.Error as error:
            raise DatabaseQueryError from error

    def create_report(
        self,
        place_id: UUID,
        reported_by: str,
        reason: str,
        description: Optional[str] = None,
    ) -> Mapping[str, object]:
        try:
            with psycopg.connect(self._database_url, row_factory=dict_row) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        CREATE_REPORT_SQL,
                        (
                            place_id,
                            reported_by,
                            reason,
                            description,
                        ),
                    )
                    return cursor.fetchone()
        except psycopg.Error as error:
            raise DatabaseQueryError from error
