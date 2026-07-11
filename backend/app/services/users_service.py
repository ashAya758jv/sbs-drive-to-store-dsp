"""User data access. In-memory today; swap for DB queries later."""
from app.core.enums import UserStatus
from app.services import mock_data

_next_id = max((u["id"] for u in mock_data.USERS), default=0) + 1


class UserNotFoundError(LookupError):
    """Raised when a user id doesn't match any mock record."""


class DuplicateEmailError(ValueError):
    """Raised when creating/renaming a user would collide with another email."""


def _find(user_id: int) -> dict | None:
    return next((u for u in mock_data.USERS if u["id"] == user_id), None)


def _advertiser_name(advertiser_id: int | None) -> str | None:
    if advertiser_id is None:
        return None
    advertiser = next(
        (a for a in mock_data.ADVERTISERS if a["id"] == advertiser_id), None
    )
    return advertiser["name"] if advertiser else None


def _enrich(user: dict) -> dict:
    return {**user, "advertiser_name": _advertiser_name(user.get("advertiser_id"))}


def _email_taken(email: str, *, exclude_user_id: int | None = None) -> bool:
    email_lower = email.lower()
    return any(
        u["email"].lower() == email_lower and u["id"] != exclude_user_id
        for u in mock_data.USERS
    )


def list_users() -> list[dict]:
    return [_enrich(u) for u in mock_data.USERS]


def get_user(user_id: int) -> dict:
    user = _find(user_id)
    if user is None:
        raise UserNotFoundError(f"Utilisateur {user_id} introuvable.")
    return _enrich(user)


def create_user(data: dict) -> dict:
    global _next_id
    if _email_taken(data["email"]):
        raise DuplicateEmailError(f"L'email {data['email']} est déjà utilisé.")

    user = {
        "id": _next_id,
        "name": data["name"],
        "email": data["email"],
        "role": data["role"],
        "status": UserStatus.ACTIVE,
        "advertiser_id": data.get("advertiser_id"),
        "last_login": None,
    }
    mock_data.USERS.append(user)
    _next_id += 1
    return _enrich(user)


def update_user(user_id: int, data: dict) -> dict:
    user = _find(user_id)
    if user is None:
        raise UserNotFoundError(f"Utilisateur {user_id} introuvable.")

    new_email = data.get("email")
    if new_email is not None and _email_taken(new_email, exclude_user_id=user_id):
        raise DuplicateEmailError(f"L'email {new_email} est déjà utilisé.")

    for key, value in data.items():
        if value is not None:
            user[key] = value
    return _enrich(user)


def set_user_status(user_id: int, status: UserStatus) -> dict:
    user = _find(user_id)
    if user is None:
        raise UserNotFoundError(f"Utilisateur {user_id} introuvable.")
    user["status"] = status
    return _enrich(user)
