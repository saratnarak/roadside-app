import time
from uuid import UUID, uuid4
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi.testclient import TestClient
import pytest

from app.api.v1.routes.places import get_place_service
from app.core.config import get_settings
from app.main import app
from app.schemas.place import PlaceType
from app.services.place_service import PlaceService

client = TestClient(app)

# Generate an RSA key pair for testing Clerk JWT signing and verification
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")

public_key = private_key.public_key()
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode("utf-8")


def create_token(
    user_id: str = "user_clerk_test_123",
    email: str = "rider@example.com",
    expired: bool = False,
    issuer: str = "https://clerk.test.accounts.dev",
) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "name": "Sokha Rider",
        "iss": issuer,
        "iat": now - 3600 if expired else now,
        "exp": now - 60 if expired else now + 3600,
        "sid": "sess_123",
    }
    return jwt.encode(payload, private_pem, algorithm="RS256")


class MockPlaceRepository:
    def __init__(self):
        self.created_places = []
        self.reports = []

    def find_nearby_places(self, latitude, longitude, radius_meters, place_type, limit):
        return []

    def create_place(self, name, place_type, latitude, longitude, created_by, description=None, phone=None, address=None):
        place = {
            "id": uuid4(),
            "name": name,
            "type": place_type,
            "latitude": latitude,
            "longitude": longitude,
            "created_by": created_by,
            "description": description,
            "phone": phone,
            "address": address,
            "is_verified": False,
            "is_active": True,
            "created_at": None,
        }
        self.created_places.append(place)
        return place

    def create_report(self, place_id, reported_by, reason, description=None):
        report = {
            "id": uuid4(),
            "place_id": place_id,
            "reported_by": reported_by,
            "reason": reason,
            "description": description,
            "status": "pending",
            "created_at": None,
        }
        self.reports.append(report)
        return report


@pytest.fixture(autouse=True)
def configure_clerk_settings(monkeypatch):
    """Configures test settings with the generated RSA public key and test issuer."""
    settings = get_settings()
    monkeypatch.setattr(settings, "clerk_jwt_key", public_pem)
    monkeypatch.setattr(settings, "clerk_issuer", "https://clerk.test.accounts.dev")


@pytest.fixture
def mock_service():
    repo = MockPlaceRepository()
    service = PlaceService(repo)
    app.dependency_overrides[get_place_service] = lambda: service
    yield service
    app.dependency_overrides.pop(get_place_service, None)


# 1. Missing Authorization header -> 401
def test_missing_authorization_header():
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


# 2. Invalid token -> 401
def test_invalid_token():
    headers = {"Authorization": "Bearer invalid.token.value"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]


# 3. Expired token -> 401
def test_expired_token():
    token = create_token(expired=True)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
    assert "Session has expired" in response.json()["detail"]


# 4. Valid Clerk token -> authenticated user
def test_valid_clerk_token_returns_user():
    token = create_token(user_id="user_2valid_clerk", email="moto@rescue.kh")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["clerk_user_id"] == "user_2valid_clerk"
    assert data["email"] == "moto@rescue.kh"


# 5. POST /places without authentication -> 401
def test_create_place_unauthenticated_fails(mock_service):
    payload = {
        "name": "New Moto Workshop",
        "type": "repair_shop",
        "latitude": 11.5564,
        "longitude": 104.9282,
    }
    response = client.post("/api/v1/places", json=payload)
    assert response.status_code == 401


# 6. POST /places with valid authentication -> allowed
def test_create_place_authenticated_succeeds(mock_service):
    token = create_token(user_id="user_mechanic_owner_999")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Angkor Moto Repairs",
        "type": "repair_shop",
        "latitude": 11.5600,
        "longitude": 104.9200,
        "phone": "+855 12 345 678",
        "address": "Street 271, Phnom Penh",
    }
    response = client.post("/api/v1/places", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Angkor Moto Repairs"
    assert data["created_by"] == "user_mechanic_owner_999"


# 7. created_by comes from Clerk identity
def test_created_by_derived_from_clerk_identity(mock_service):
    token = create_token(user_id="user_clerk_real_author_456")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Riverside Fuel Station",
        "type": "gas_station",
        "latitude": 11.5700,
        "longitude": 104.9300,
    }
    response = client.post("/api/v1/places", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["created_by"] == "user_clerk_real_author_456"


# 8. Client cannot impersonate another user (arbitrary user_id in payload is ignored)
def test_client_cannot_impersonate_another_user(mock_service):
    token = create_token(user_id="user_victim_111")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Hacked Place",
        "type": "repair_shop",
        "latitude": 11.55,
        "longitude": 104.92,
        # Malicious client tries to impersonate another user_id or created_by
        "created_by": "user_innocent_target_999",
        "user_id": "user_admin_000",
    }
    response = client.post("/api/v1/places", json=payload, headers=headers)
    assert response.status_code == 201
    # Backend MUST ignore the injected user_id and use token identity
    assert response.json()["created_by"] == "user_victim_111"


# 9. GET /users/me requires authentication
def test_users_me_requires_authentication():
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


# 10. GET /places/nearby remains publicly accessible
def test_places_nearby_remains_public(mock_service):
    # Public request with no Authorization header
    response = client.get("/api/v1/places/nearby?latitude=11.55&longitude=104.92")
    assert response.status_code == 200
    assert "items" in response.json()
