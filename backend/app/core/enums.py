"""Canonical enumerations shared by the ORM models and the Pydantic schemas.

Values are stable, English, machine-friendly slugs. French display labels are a
presentation concern handled by the frontend.
"""
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MEDIA_BUYER = "media_buyer"
    READER = "lecteur"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INVITED = "invited"
    DISABLED = "disabled"


class CampaignObjective(str, Enum):
    DRIVE_TO_STORE = "drive_to_store"
    AWARENESS = "awareness"
    TRAFFIC = "traffic"
    CONVERSIONS = "conversions"


class CampaignStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DRAFT = "draft"
    COMPLETED = "completed"


class CreativeFormat(str, Enum):
    IMAGE = "image"
    HTML5 = "html5"
    VIDEO = "video"
