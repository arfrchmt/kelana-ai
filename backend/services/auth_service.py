import bcrypt
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

from sqlalchemy.orm import Session

from models.user import User

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "kelana-ai-dev-secret")
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24
JWT_ALGORITHM = "HS256"
JWT_TYPE = "JWT"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def register_user(db: Session, name: str, email: str, password: str) -> User:
    normalized_email = email.lower().strip()
    if get_user_by_email(db, normalized_email) is not None:
        raise ValueError("Email already registered")

    user = User(
        name=name,
        email=normalized_email,
        password_hash=hash_password(password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_access_token(user_id: int) -> str:
    header = {
        "alg": JWT_ALGORITHM,
        "typ": JWT_TYPE,
    }
    payload = {
        "sub": str(user_id),
        "exp": int(time.time()) + ACCESS_TOKEN_EXPIRE_SECONDS,
    }
    encoded_header = _base64_url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded_payload = _base64_url_encode(payload_bytes)
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = _sign(signing_input)

    return f"{signing_input}.{signature}"


def get_user_id_from_token(token: str) -> Optional[int]:
    try:
        encoded_header, encoded_payload, signature = token.split(".", 2)
    except ValueError:
        return None

    signing_input = f"{encoded_header}.{encoded_payload}"
    expected_signature = _sign(signing_input)
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        header = json.loads(_base64_url_decode(encoded_header))
        payload = json.loads(_base64_url_decode(encoded_payload))
    except (json.JSONDecodeError, ValueError):
        return None

    if header.get("alg") != JWT_ALGORITHM or header.get("typ") != JWT_TYPE:
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None

    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None


def _sign(signing_input: str) -> str:
    signature = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _base64_url_encode(signature)


def _base64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64_url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)
