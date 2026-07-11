"""In-memory mock dataset.

Single source of truth for the API while PostgreSQL is not wired. Values are
consistent with the frontend mock data (advertisers, campaigns, dashboard) so
both layers tell the same story during the demo.

Each record is a plain ``dict`` whose keys match the corresponding ORM
model / Pydantic schema fields, which keeps the eventual swap to real database
queries straightforward.
"""
from datetime import date, datetime, timedelta, timezone

from app.core.enums import (
    CampaignObjective,
    CampaignStatus,
    CreativeFormat,
    UserRole,
    UserStatus,
)

_now = datetime.now(timezone.utc)

# --------------------------------------------------------------------------- #
#  Users                                                                       #
#  `advertiser_id` links a user to the advertiser they work for (None = SBS   #
#  internal/platform staff). `last_login` is None for a user who never signed #
#  in yet (matches an "invited" status).                                      #
# --------------------------------------------------------------------------- #
USERS = [
    {
        "id": 1,
        "name": "Aya ACHIBAN",
        "email": "aya.achiban@sbsdatafactory.ma",
        "role": UserRole.ADMIN,
        "status": UserStatus.ACTIVE,
        "advertiser_id": None,
        "last_login": _now - timedelta(hours=2),
    },
    {
        "id": 2,
        "name": "Mehdi BENNANI",
        "email": "mehdi.bennani@sbsdatafactory.ma",
        "role": UserRole.MEDIA_BUYER,
        "status": UserStatus.ACTIVE,
        "advertiser_id": 1,
        "last_login": _now - timedelta(days=1, hours=3),
    },
    {
        "id": 3,
        "name": "Salma OULDALI",
        "email": "salma.ouldali@sbsdatafactory.ma",
        "role": UserRole.READER,
        "status": UserStatus.INVITED,
        "advertiser_id": 2,
        "last_login": None,
    },
    {
        "id": 4,
        "name": "Karim ZIANI",
        "email": "karim.ziani@sbsdatafactory.ma",
        "role": UserRole.MEDIA_BUYER,
        "status": UserStatus.DISABLED,
        "advertiser_id": 3,
        "last_login": _now - timedelta(days=45),
    },
]

# --------------------------------------------------------------------------- #
#  Advertisers                                                                 #
#  `status` is a simple "active" / "inactive" string (not a strict enum) to    #
#  keep this Semaine 6 addition lightweight and mock/in-memory only.          #
# --------------------------------------------------------------------------- #
ADVERTISERS = [
    {
        "id": 1,
        "name": "Marjane",
        "sector": "Grande distribution",
        "contact_name": "Yassine El Amrani",
        "phone": "+212 522 00 11 22",
        "email": "contact@marjane.ma",
        "address": "Route de Rabat, Aïn Sebaâ",
        "city": "Casablanca",
        "website": "https://www.marjane.ma",
        "status": "active",
    },
    {
        "id": 2,
        "name": "Carrefour",
        "sector": "Grande distribution",
        "contact_name": "Salma Bennani",
        "phone": "+212 522 33 44 55",
        "email": "contact@carrefour.ma",
        "address": "Boulevard Zerktouni",
        "city": "Casablanca",
        "website": "https://www.carrefour.ma",
        "status": "active",
    },
    {
        "id": 3,
        "name": "BIM",
        "sector": "Hard discount",
        "contact_name": "Omar Idrissi",
        "phone": "+212 522 66 77 88",
        "email": "contact@bim.ma",
        "address": "Zone Industrielle, Sidi Bernoussi",
        "city": "Casablanca",
        "website": "https://www.bim.ma",
        "status": "active",
    },
    {
        "id": 4,
        "name": "CIH Bank",
        "sector": "Banque",
        "contact_name": "Nadia Tazi",
        "phone": "+212 522 99 00 11",
        "email": "contact@cihbank.ma",
        "address": "187 Avenue Hassan II",
        "city": "Rabat",
        "website": "https://www.cihbank.ma",
        "status": "active",
    },
]

# --------------------------------------------------------------------------- #
#  Stores                                                                      #
# --------------------------------------------------------------------------- #
STORES = [
    {
        "id": 1,
        "advertiser_id": 1,
        "name": "Marjane Californie",
        "city": "Casablanca",
        "address": "Bd Panoramique, Californie",
        "latitude": 33.5298,
        "longitude": -7.6512,
        "opening_hours": "09:00 - 22:00",
        "store_url": "https://www.marjane.ma/californie",
    },
    {
        "id": 2,
        "advertiser_id": 1,
        "name": "Marjane Hay Riad",
        "city": "Rabat",
        "address": "Avenue Annakhil, Hay Riad",
        "latitude": 33.9560,
        "longitude": -6.8670,
        "opening_hours": "09:00 - 22:00",
        "store_url": "https://www.marjane.ma/hay-riad",
    },
    {
        "id": 3,
        "advertiser_id": 2,
        "name": "Carrefour Anfa Place",
        "city": "Casablanca",
        "address": "Anfa Place, Bd de la Corniche",
        "latitude": 33.6020,
        "longitude": -7.6700,
        "opening_hours": "09:00 - 23:00",
        "store_url": "https://www.carrefour.ma/anfa-place",
    },
    {
        "id": 4,
        "advertiser_id": 3,
        "name": "BIM Maârif",
        "city": "Casablanca",
        "address": "Rue Mohamed Smiha, Maârif",
        "latitude": 33.5870,
        "longitude": -7.6330,
        "opening_hours": "08:30 - 21:00",
        "store_url": "https://www.bim.ma/maarif",
    },
    {
        "id": 5,
        "advertiser_id": 4,
        "name": "CIH Bank Agdal",
        "city": "Rabat",
        "address": "Avenue de France, Agdal",
        "latitude": 33.9920,
        "longitude": -6.8490,
        "opening_hours": "08:30 - 16:30",
        "store_url": "https://www.cihbank.ma/agdal",
    },
]

# --------------------------------------------------------------------------- #
#  Campaigns                                                                   #
# --------------------------------------------------------------------------- #
CAMPAIGNS = [
    {
        "id": 1,
        "advertiser_id": 1,
        "name": "Marjane Ramadan 2026",
        "objective": CampaignObjective.DRIVE_TO_STORE,
        "status": CampaignStatus.ACTIVE,
        "start_date": date(2026, 3, 1),
        "end_date": date(2026, 3, 30),
        "total_budget": 50000,
        "daily_budget": 1667,
    },
    {
        "id": 2,
        "advertiser_id": 2,
        "name": "Carrefour Weekend Promo",
        "objective": CampaignObjective.DRIVE_TO_STORE,
        "status": CampaignStatus.PAUSED,
        "start_date": date(2026, 2, 12),
        "end_date": date(2026, 2, 28),
        "total_budget": 30000,
        "daily_budget": 1875,
    },
    {
        "id": 3,
        "advertiser_id": 3,
        "name": "BIM Casablanca Local",
        "objective": CampaignObjective.DRIVE_TO_STORE,
        "status": CampaignStatus.DRAFT,
        "start_date": None,
        "end_date": None,
        "total_budget": 18000,
        "daily_budget": 0,
    },
    {
        "id": 4,
        "advertiser_id": 4,
        "name": "CIH Mobile Drive-to-Store",
        "objective": CampaignObjective.DRIVE_TO_STORE,
        "status": CampaignStatus.COMPLETED,
        "start_date": date(2026, 1, 5),
        "end_date": date(2026, 1, 31),
        "total_budget": 45000,
        "daily_budget": 1730,
    },
]

# --------------------------------------------------------------------------- #
#  Creatives                                                                   #
# --------------------------------------------------------------------------- #
CREATIVES = [
    {
        "id": 1,
        "campaign_id": 1,
        "format": CreativeFormat.IMAGE,
        "image_url": "https://cdn.sbsdatafactory.ma/creatives/marjane-ramadan-300x250.jpg",
        "promotion_text": "Ramadan Kareem — jusqu'à -30% en magasin",
    },
    {
        "id": 2,
        "campaign_id": 1,
        "format": CreativeFormat.HTML5,
        "image_url": "https://cdn.sbsdatafactory.ma/creatives/marjane-ramadan-html5.zip",
        "promotion_text": "Vos offres Ramadan près de chez vous",
    },
    {
        "id": 3,
        "campaign_id": 2,
        "format": CreativeFormat.IMAGE,
        "image_url": "https://cdn.sbsdatafactory.ma/creatives/carrefour-weekend-728x90.jpg",
        "promotion_text": "Promo week-end — venez en magasin",
    },
    {
        "id": 4,
        "campaign_id": 4,
        "format": CreativeFormat.VIDEO,
        "image_url": "https://cdn.sbsdatafactory.ma/creatives/cih-drive-15s.mp4",
        "promotion_text": "Ouvrez votre compte en agence",
    },
]

# --------------------------------------------------------------------------- #
#  Statistics                                                                  #
# --------------------------------------------------------------------------- #
STATISTICS = [
    {
        "id": 1,
        "campaign_id": 1,
        "store_id": 1,
        "date": date(2026, 3, 2),
        "impressions": 120450,
        "clicks": 980,
        "spend": 1320.50,
    },
    {
        "id": 2,
        "campaign_id": 1,
        "store_id": 2,
        "date": date(2026, 3, 2),
        "impressions": 98300,
        "clicks": 760,
        "spend": 1090.00,
    },
    {
        "id": 3,
        "campaign_id": 2,
        "store_id": 3,
        "date": date(2026, 2, 14),
        "impressions": 64030,
        "clicks": 412,
        "spend": 870.25,
    },
    {
        "id": 4,
        "campaign_id": 4,
        "store_id": 5,
        "date": date(2026, 1, 20),
        "impressions": 98020,
        "clicks": 734,
        "spend": 1500.00,
    },
]

# --------------------------------------------------------------------------- #
#  Dashboard aggregates (pre-formatted for display, mirrors the frontend)      #
# --------------------------------------------------------------------------- #
DASHBOARD_KPIS = [
    {
        "id": "impressions",
        "label": "Impressions totales",
        "value": "2,4M",
        "delta": "+12,4%",
        "trend": "up",
    },
    {
        "id": "clics",
        "label": "Clics totaux",
        "value": "18 420",
        "delta": "+8,1%",
        "trend": "up",
    },
    {
        "id": "budget",
        "label": "Budget dépensé",
        "value": "126 500 MAD",
        "delta": "+5,3%",
        "trend": "up",
    },
    {
        "id": "actives",
        "label": "Campagnes actives",
        "value": "8",
        "delta": "-1,0%",
        "trend": "down",
    },
]

DASHBOARD_RECENT_CAMPAIGNS = [
    {
        "id": 1,
        "name": "Marjane Ramadan 2026",
        "status": "Active",
        "period": "01 mars → 30 mars 2026",
        "budget": "50 000 MAD",
        "spent": "38 400 MAD",
        "impressions": "1 245 900",
        "clics": "9 850",
    },
    {
        "id": 2,
        "name": "Carrefour Weekend Promo",
        "status": "En pause",
        "period": "12 fév → 28 fév 2026",
        "budget": "30 000 MAD",
        "spent": "21 200 MAD",
        "impressions": "640 300",
        "clics": "4 120",
    },
    {
        "id": 3,
        "name": "BIM Casablanca Local",
        "status": "Brouillon",
        "period": "—",
        "budget": "18 000 MAD",
        "spent": "0 MAD",
        "impressions": "0",
        "clics": "0",
    },
    {
        "id": 4,
        "name": "CIH Mobile Drive-to-Store",
        "status": "Terminée",
        "period": "05 jan → 31 jan 2026",
        "budget": "45 000 MAD",
        "spent": "45 000 MAD",
        "impressions": "980 200",
        "clics": "7 340",
    },
]

DASHBOARD_PERFORMANCE = [
    {"period": "Jan", "impressions": 820000, "clics": 5400},
    {"period": "Fév", "impressions": 932000, "clics": 6120},
    {"period": "Mar", "impressions": 1245000, "clics": 9850},
    {"period": "Avr", "impressions": 1080000, "clics": 8430},
    {"period": "Mai", "impressions": 1390000, "clics": 10240},
    {"period": "Jun", "impressions": 1510000, "clics": 11680},
]
