from sqlalchemy import Column, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.enums import CreativeFormat
from app.database import Base


class Creative(Base):
    __tablename__ = "creatives"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(
        Integer, ForeignKey("campaigns.id"), nullable=False, index=True
    )
    format = Column(SAEnum(CreativeFormat), nullable=False, default=CreativeFormat.IMAGE)
    image_url = Column(String(255))
    promotion_text = Column(Text)

    campaign = relationship("Campaign", back_populates="creatives")
