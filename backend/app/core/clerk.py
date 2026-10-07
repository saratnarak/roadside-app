from functools import lru_cache

from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions

from app.core.config import get_settings


@lru_cache
def get_clerk_client() -> Clerk:
    settings = get_settings()

    return Clerk(
        bearer_auth=settings.clerk_secret_key,
    )


def get_auth_options() -> AuthenticateRequestOptions:
    settings = get_settings()

    kwargs = {
        "secret_key": settings.clerk_secret_key,
    }

    if settings.clerk_jwt_key:
        kwargs["jwt_key"] = settings.clerk_jwt_key

    return AuthenticateRequestOptions(**kwargs)