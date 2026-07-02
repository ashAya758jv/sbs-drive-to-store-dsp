"""ORM model for campaign drafts created by the multi-step wizard.

A draft stores the core campaign fields as real columns (so drafts stay
queryable and can later be promoted to a real ``campaigns`` row) plus the rich,
step-specific selections (devices, OS, time ranges, formats, app categories…)
in a single ``payload`` JSON column. JSON keeps the schema stable while the
wizard evolves, and is supported by both PostgreSQL and the local SQLite
development fallback.

The advertiser link is kept as a plain integer here (no ORM ``ForeignKey``) so
this single table can be created on its own by the SQLite fallback without
requiring the rest of the schema. The PostgreSQL foreign key is declared in
``database/migrations/002_campaign_drafts.sql``.
"""
from sqlalchemy import JSON, Column, Date, DateTime, Integer, Numeric, String
from sqlalchemy.sql import func

from app.database import Base


class CampaignDraft(Base):
    __tablename__ = "campaign_drafts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    advertiser_id = Column(Integer, index=True)
    objective = Column(String(30))
    status = Column(String(20), nullable=False, default="draft")
    start_date = Column(Date)
    end_date = Column(Date)
    total_budget = Column(Numeric(12, 2), default=0)
    daily_budget = Column(Numeric(12, 2), default=0)

    # Step 2/3/4 selections (targeting, formats, categories, estimate).
    payload = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
