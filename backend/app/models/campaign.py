from sqlalchemy import (
    Column,
    Date,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship

from app.core.enums import CampaignObjective, CampaignStatus
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    advertiser_id = Column(
        Integer, ForeignKey("advertisers.id"), nullable=False, index=True
    )
    name = Column(String(160), nullable=False)
    objective = Column(
        SAEnum(CampaignObjective),
        nullable=False,
        default=CampaignObjective.DRIVE_TO_STORE,
    )
    status = Column(
        SAEnum(CampaignStatus), nullable=False, default=CampaignStatus.DRAFT
    )
    start_date = Column(Date)
    end_date = Column(Date)
    total_budget = Column(Numeric(12, 2), default=0)
    daily_budget = Column(Numeric(12, 2), default=0)

    advertiser = relationship("Advertiser", back_populates="campaigns")
    creatives = relationship(
        "Creative", back_populates="campaign", cascade="all, delete-orphan"
    )
    statistics = relationship(
        "Statistic", back_populates="campaign", cascade="all, delete-orphan"
    )
