from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


# --- Enums ---
class TaskStatusEnum(str, Enum):
    A_FAIRE = "À faire"
    EN_COURS = "En cours"
    REALISE = "Réalisé"
    A_TRAITER = "À traiter"
    A_PLANIFIER = "À planifier"
    BLOQUE = "Bloqué"


class TaskPriorityEnum(str, Enum):
    HAUTE = "Haute"
    MOYENNE = "Moyenne"
    BASSE = "Basse"


class ThemeProjectEnum(str, Enum):
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


class UserRoleEnum(str, Enum):
    admin = "admin"
    manager = "manager"
    viewer = "viewer"


# --- Auth ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., max_length=200)
    password: str = Field(..., min_length=6)
    role: UserRoleEnum = UserRoleEnum.viewer


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: UserRoleEnum
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Task ---
class TaskCreate(BaseModel):
    sequence_number: int = Field(..., ge=1)
    theme_project: ThemeProjectEnum
    task_description: str = Field(..., min_length=1)
    responsible_person: str = Field(..., min_length=1)
    status: TaskStatusEnum = TaskStatusEnum.A_FAIRE
    priority: TaskPriorityEnum = TaskPriorityEnum.MOYENNE
    due_date: Optional[date] = None
    observations: Optional[str] = None

    @validator('due_date')
    def validate_due_date(cls, v):
        if v:
            if not isinstance(v, date):
                raise ValueError('La date doit être au format YYYY-MM-DD')
        return v


class TaskUpdate(BaseModel):
    sequence_number: Optional[int] = Field(None, ge=1)
    theme_project: Optional[ThemeProjectEnum] = None
    task_description: Optional[str] = None
    responsible_person: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    due_date: Optional[date] = None
    observations: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    sequence_number: int
    theme_project: str
    task_description: str
    responsible_person: str
    status: str
    priority: str
    due_date: Optional[date] = None
    observations: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class TaskHistoryOut(BaseModel):
    id: int
    task_id: int
    changed_by: Optional[str] = None
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True


# --- Synthesis / Dashboard ---
class StatusDistribution(BaseModel):
    status: str
    count: int
    percentage: float


class PriorityDistribution(BaseModel):
    priority: str
    count: int
    percentage: float


class ThemeCompletion(BaseModel):
    theme: str
    total: int
    completed: int
    completion_rate: float


class DashboardData(BaseModel):
    total_tasks: int
    completed: int
    in_progress: int
    blocked: int
    completion_rate: float
    by_status: List[StatusDistribution]
    by_priority: List[PriorityDistribution]
    recent_tasks: List[TaskOut]


# --- AI ---
class AIPrioritizationRequest(BaseModel):
    pass  # Uses all tasks from DB


class AIPrioritizationItem(BaseModel):
    task_id: int
    sequence_number: int
    task_description: str
    current_priority: str
    suggested_priority: str
    reason: str


class AIPrioritizationResponse(BaseModel):
    suggestions: List[AIPrioritizationItem]
    summary: str


class AIBlockageItem(BaseModel):
    task_id: int
    sequence_number: int
    task_description: str
    status: str
    observations: Optional[str]
    blockage_type: str
    severity: str  # Critique, Élevée, Modérée
    suggestion: str


class AIBlockageResponse(BaseModel):
    blockages: List[AIBlockageItem]
    total_blockages: int
    summary: str


class AISummaryResponse(BaseModel):
    period: str
    total_tasks: int
    completed: int
    completion_rate: float
    highlights: List[str]
    concerns: List[str]
    summary_text: str


class AIRecommendationItem(BaseModel):
    category: str  # Priorisation, Ressources, Suivi, Organisation
    recommendation: str
    priority: str  # Haute, Moyenne, Basse
    target_tasks: List[int]


class AIRecommendationsResponse(BaseModel):
    recommendations: List[AIRecommendationItem]
    summary: str
