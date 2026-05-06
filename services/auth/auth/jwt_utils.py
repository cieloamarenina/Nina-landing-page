import time
import uuid

import jwt


class JWTError(Exception):
    """Base for JWT errors."""


class JWTInvalid(JWTError):
    """Signature, structure, or claim validation failed."""


class JWTExpired(JWTError):
    """Token's exp claim is in the past."""


def issue_jwt(email: str, secret: str, expires_hours: int = 24) -> tuple[str, int]:
    now = int(time.time())
    exp = now + expires_hours * 3600
    payload = {
        "sub": email.lower().strip(),
        "iat": now,
        "exp": exp,
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, exp


def verify_jwt(token: str, secret: str) -> dict:
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as e:
        raise JWTExpired(str(e)) from e
    except jwt.InvalidTokenError as e:
        raise JWTInvalid(str(e)) from e
