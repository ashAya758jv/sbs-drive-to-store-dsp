from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    advertiser_id = Column(
        Integer, ForeignKey("advertisers.id"), nullable=False, index=True
    )
    name = Column(String(160), nullable=False)
    city = Column(String(120))
    address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    opening_hours = Column(String(255))
    store_url = Column(String(255))

    advertiser = relationship("Advertiser", back_populates="stores")
    statistics = relationship("Statistic", back_populates="store")
