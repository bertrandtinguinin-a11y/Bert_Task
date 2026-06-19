from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    viewer = "viewer"


class TaskStatus(str, enum.Enum):
    A_FAIRE = "À faire"
    EN_COURS = "En cours"
    REALISE = "Réalisé"
    A_TRAITER = "À traiter"
    A_PLANIFIER = "À planifier"
    BLOQUE = "Bloqué"


class TaskPriority(str, enum.Enum):
    HAUTE = "Haute"
    MOYENNE = "Moyenne"
    BASSE = "Basse"


class ThemeProject(str, enum.Enum):
    CABINET_RETRAITE = "Cabinet – Retraite"
    COMMUNICATION_MULTIMEDIA = "Communication / Multimédia"
    FABRICE_KOPORE = "Fabrice Kopore"
    FLORENTINE_SNV = "Florentine / SNV"
    FACILITATEURS_SNV_RAPPORTS = "Facilitateurs(ce) SNV / Rapports"
    SITUATION_REFERENCE = "Situation de référence Formation Microentrepreneur C2"
    MAGUERITE = "Maguerite"
    FORMATION_SE_IA = "Formation en S&E et IA intégré"
    FORMATION_EIES = "Formation en EIES"
    MAIL_PROFESSIONNEL = "Mail Professionnel"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.viewer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sequence_number = Column(Integer, nullable=False)
    theme_project = Column(String(200), nullable=False)
    task_description = Column(Text, nullable=False)
    responsible_person = Column(String(200), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.A_FAIRE, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MOYENNE, nullable=False)
    due_date = Column(Date, nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", backref="tasks")
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan")


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    changed_by = Column(String(200), nullable=True)
    field_changed = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    task = relationship("Task", back_populates="history")
