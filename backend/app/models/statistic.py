from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class Statistic(Base):
    __tablename__ = "statistics"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(
        Integer, ForeignKey("campaigns.id"), nullable=False, index=True
    )
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True, index=True)
    date = Column(Date, nullable=False)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    spend = Column(Numeric(12, 2), default=0)

    campaign = relationship("Campaign", back_populates="statistics")
    store = relationship("Store", back_populates="statistics")
