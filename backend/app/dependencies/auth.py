import logging
from typing import Annotated, Optional
import httpx
import jwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.schemas.user import ClerkUser

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# Cached JWKS client
_jwk_client: Optional[PyJWKClient] = None


def get_jwk_client() -> Optional[PyJWKClient]:
    global _jwk_client
    if _jwk_client is not None:
        return _jwk_client

    settings = get_settings()
    jwks_url = settings.clerk_jwks_url
    if not jwks_url and settings.clerk_issuer:
        jwks_url = f"{settings.clerk_issuer.rstrip('/')}/.well-known/jwks.json"

    if jwks_url:
        _jwk_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwk_client


def verify_clerk_token(token: str) -> dict:
    settings = get_settings()

    # 1. Verification with static PEM public key if provided
    if settings.clerk_jwt_key:
        pem_key = settings.clerk_jwt_key.strip()
        if not pem_key.startswith("-----BEGIN"):
            pem_key = f"-----BEGIN PUBLIC KEY-----\n{pem_key}\n-----END PUBLIC KEY-----"
        decode_kwargs = {
            "jwt": token,
            "key": pem_key,
            "algorithms": ["RS256"],
            "options": {"verify_signature": True, "verify_exp": True},
        }
        if settings.clerk_issuer:
            decode_kwargs["issuer"] = settings.clerk_issuer
        return jwt.decode(**decode_kwargs)

    # 2. Verification using Clerk JWKS endpoint
    jwk_client = get_jwk_client()
    if jwk_client:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            decode_kwargs = {
                "jwt": token,
                "key": signing_key.key,
                "algorithms": ["RS256"],
                "options": {"verify_signature": True, "verify_exp": True},
            }
            if settings.clerk_issuer:
                decode_kwargs["issuer"] = settings.clerk_issuer
            return jwt.decode(**decode_kwargs)
        except PyJWKClientError as err:
            logger.error(f"JWKS key resolution failed: {err}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to verify token signature with authentication authority.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 3. Verification using Clerk Secret Key API (/v1/tokens/verify or /v1/jwks)
    if settings.clerk_secret_key:
        # Fallback to Clerk API JWKS endpoint
        clerk_jwks_url = "https://api.clerk.com/v1/jwks"
        try:
            client = PyJWKClient(
                clerk_jwks_url,
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                cache_jwk_set=True,
                lifespan=3600,
            )
            signing_key = client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_signature": True, "verify_exp": True},
            )
        except Exception as exc:
            logger.error(f"Clerk API verification error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # If no verification method is configured
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Clerk authentication verification is not configured on this server.",
    )


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Security(security)],
) -> ClerkUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = verify_clerk_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"The token has expired\""},
        )
    except jwt.InvalidTokenError as err:
        logger.warning(f"Invalid token supplied: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )

    # Clerk user ID is the JWT 'sub' claim
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email") or payload.get("primary_email_address")
    session_id = payload.get("sid")

    return ClerkUser(
        user_id=user_id,
        email=email,
        session_id=session_id,
        claims=payload,
    )
