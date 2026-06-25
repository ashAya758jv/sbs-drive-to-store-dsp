from sqlalchemy import Column, Enum as SAEnum, Integer, String

from app.core.enums import UserRole, UserStatus
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.READER)
    status = Column(SAEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
