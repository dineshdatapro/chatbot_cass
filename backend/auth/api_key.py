import hashlib
import secrets


def generate_api_key() -> tuple[str, str, str]:
    """Return (full_key, prefix_for_display, sha256_hash)."""
    token = f"arag_{secrets.token_urlsafe(32)}"
    prefix = token[:12]
    key_hash = hash_api_key(token)
    return token, prefix, key_hash


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def verify_api_key(plain: str, stored_hash: str) -> bool:
    return secrets.compare_digest(hash_api_key(plain), stored_hash)
