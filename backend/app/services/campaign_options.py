"""Static option catalogs for the campaign-creation wizard.

Centralized here so the API and the frontend speak the same language: every
option has a stable machine ``value`` (slug) and a French ``label`` shown in the
UI. Advertisers are pulled from the existing mock dataset for now.
"""
from app.core.enums import CampaignObjective
from app.services import mock_data

OBJECTIVE_LABELS = {
    CampaignObjective.DRIVE_TO_STORE: "Drive-to-store (visite en magasin)",
    CampaignObjective.AWARENESS: "Notoriété",
    CampaignObjective.TRAFFIC: "Trafic",
    CampaignObjective.CONVERSIONS: "Conversions",
}

DEVICES = [
    ("mobile", "Mobile"),
    ("desktop", "Desktop"),
    ("tablet", "Tablette"),
]

OPERATING_SYSTEMS = [
    ("android", "Android"),
    ("ios", "iOS"),
    ("windows", "Windows"),
    ("macos", "macOS"),
]

TIME_RANGES = [
    ("morning", "Matin (06h – 12h)"),
    ("afternoon", "Après-midi (12h – 18h)"),
    ("evening", "Soirée (18h – 00h)"),
    ("night", "Nuit (00h – 06h)"),
]

FORMATS = [
    (
        "banner",
        "Bannière",
        "Format classique affiché en haut ou en bas de l'écran (ex. 320×50).",
    ),
    (
        "rectangle",
        "Pavé",
        "Pavé rectangulaire intégré au contenu de l'application (ex. 300×250).",
    ),
    (
        "interstitial",
        "Interstitiel",
        "Publicité plein écran affichée entre deux écrans de l'application.",
    ),
]

APP_CATEGORIES = [
    ("news", "Actualités"),
    ("shopping", "Shopping & e-commerce"),
    ("food", "Food & restauration"),
    ("lifestyle", "Lifestyle & bien-être"),
    ("sports", "Sport"),
    ("travel", "Voyage"),
    ("finance", "Finance"),
    ("games", "Jeux"),
]


def get_options() -> dict:
    """Assemble the full option catalog for the wizard."""
    return {
        "objectives": [
            {"value": objective.value, "label": OBJECTIVE_LABELS[objective]}
            for objective in CampaignObjective
        ],
        "advertisers": [
            {"value": advertiser["id"], "label": advertiser["name"]}
            for advertiser in mock_data.ADVERTISERS
        ],
        "devices": [{"value": value, "label": label} for value, label in DEVICES],
        "operating_systems": [
            {"value": value, "label": label} for value, label in OPERATING_SYSTEMS
        ],
        "time_ranges": [
            {"value": value, "label": label} for value, label in TIME_RANGES
        ],
        "formats": [
            {"value": value, "label": label, "description": description}
            for value, label, description in FORMATS
        ],
        "app_categories": [
            {"value": value, "label": label} for value, label in APP_CATEGORIES
        ],
    }
