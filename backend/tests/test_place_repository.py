from unittest.mock import MagicMock, patch

from app.repositories.place_repository import NEARBY_PLACES_SQL, PostgresPlaceRepository
from app.schemas.place import PlaceType


def test_postgis_query_uses_spatial_filter_order_and_active_filter():
    normalized = " ".join(NEARBY_PLACES_SQL.split()).lower()

    assert "st_setsrid(st_makepoint(%s, %s), 4326)::geography" in normalized
    assert "st_dwithin(places.location, search_point.location, %s)" in normalized
    assert "st_distance(places.location, search_point.location)" in normalized
    assert "places.is_active = true" in normalized
    assert "order by distance_meters asc" in normalized
    assert "limit %s" in normalized
    assert "places.type = %s::public.place_type" in normalized


def test_repository_binds_coordinates_radius_type_and_result_limit():
    cursor = MagicMock()
    cursor.fetchall.return_value = [{"id": "example"}]
    cursor_context = MagicMock()
    cursor_context.__enter__.return_value = cursor
    connection = MagicMock()
    connection.cursor.return_value = cursor_context
    connection_context = MagicMock()
    connection_context.__enter__.return_value = connection

    with patch("app.repositories.place_repository.psycopg.connect", return_value=connection_context):
        rows = PostgresPlaceRepository("postgresql://test").find_nearby_places(
            latitude=11.5,
            longitude=104.9,
            radius_meters=3000,
            place_type=PlaceType.REPAIR_SHOP,
            limit=100,
        )

    assert rows == [{"id": "example"}]
    params = cursor.execute.call_args.args[1]
    assert params == (104.9, 11.5, 3000, "repair_shop", "repair_shop", 100)
