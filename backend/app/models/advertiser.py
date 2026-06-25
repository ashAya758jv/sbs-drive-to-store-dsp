from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Advertiser(Base):
    __tablename__ = "advertisers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    sector = Column(String(120))
    contact_name = Column(String(120))
    phone = Column(String(40))
    email = Column(String(255))

    stores = relationship(
        "Store", back_populates="advertiser", cascade="all, delete-orphan"
    )
    campaigns = relationship(
        "Campaign", back_populates="advertiser", cascade="all, delete-orphan"
    )
