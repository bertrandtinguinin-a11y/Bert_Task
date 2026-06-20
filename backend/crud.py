from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
from datetime import datetime, timezone

from models import Task, TaskHistory, User, TaskStatus, TaskPriority
from schemas import TaskCreate, TaskUpdate, UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# --- Users ---
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: UserCreate) -> User:
    hashed = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed,
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_all_users(db: Session) -> List[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def update_user_role(db: Session, user_id: int, role: str) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False


# --- Tasks ---
VALID_STATUS_TRANSITIONS = {
    TaskStatus.A_FAIRE: [TaskStatus.EN_COURS, TaskStatus.BLOQUE, TaskStatus.A_PLANIFIER],
    TaskStatus.EN_COURS: [TaskStatus.REALISE, TaskStatus.BLOQUE, TaskStatus.A_FAIRE],
    TaskStatus.REALISE: [TaskStatus.BLOQUE],
    TaskStatus.A_TRAITER: [TaskStatus.EN_COURS, TaskStatus.BLOQUE, TaskStatus.A_FAIRE],
    TaskStatus.A_PLANIFIER: [TaskStatus.A_FAIRE, TaskStatus.EN_COURS, TaskStatus.BLOQUE],
    TaskStatus.BLOQUE: [TaskStatus.A_FAIRE, TaskStatus.EN_COURS, TaskStatus.A_TRAITER, TaskStatus.A_PLANIFIER],
}


def validate_status_transition(old_status: TaskStatus, new_status: TaskStatus) -> bool:
    if old_status == new_status:
        return True
    allowed = VALID_STATUS_TRANSITIONS.get(old_status, [])
    return new_status in allowed


def get_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    responsible: Optional[str] = None,
    theme: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
) -> List[Task]:
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if responsible:
        query = query.filter(Task.responsible_person.ilike(f"%{responsible}%"))
    if theme:
        query = query.filter(Task.theme_project.ilike(f"%{theme}%"))
    if search:
        query = query.filter(
            or_(
                Task.task_description.ilike(f"%{search}%"),
                Task.responsible_person.ilike(f"%{search}%"),
                Task.observations.ilike(f"%{search}%"),
                Task.theme_project.ilike(f"%{search}%"),
            )
        )

    sort_column = getattr(Task, sort_by, Task.sequence_number) if sort_by else Task.sequence_number
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.all()


def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def get_task_by_sequence(db: Session, sequence_number: int) -> Optional[Task]:
    return db.query(Task).filter(Task.sequence_number == sequence_number).first()


def create_task(db: Session, task: TaskCreate, user_id: Optional[int] = None) -> Task:
    existing = get_task_by_sequence(db, task.sequence_number)
    if existing:
        raise ValueError(f"Le numéro de séquence {task.sequence_number} existe déjà.")

    db_task = Task(
        sequence_number=task.sequence_number,
        theme_project=task.theme_project.value if hasattr(task.theme_project, 'value') else task.theme_project,
        task_description=task.task_description,
        responsible_person=task.responsible_person,
        status=task.status.value if hasattr(task.status, 'value') else task.status,
        priority=task.priority.value if hasattr(task.priority, 'value') else task.priority,
        due_date=task.due_date,
        observations=task.observations,
        created_by=user_id,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Log creation
    log_history(db, db_task.id, user_id, "création", None, f"Tâche créée: {task.task_description}")

    return db_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate, user_id: Optional[int] = None) -> Optional[Task]:
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)

    # Check sequence uniqueness
    if "sequence_number" in update_data and update_data["sequence_number"] != db_task.sequence_number:
        existing = get_task_by_sequence(db, update_data["sequence_number"])
        if existing and existing.id != task_id:
            raise ValueError(f"Le numéro de séquence {update_data['sequence_number']} existe déjà.")

    # Validate status transition
    if "status" in update_data:
        new_status = update_data["status"]
        if isinstance(new_status, str):
            new_status = TaskStatus(new_status)
        current_status = db_task.status
        if not validate_status_transition(current_status, new_status):
            raise ValueError(
                f"Transition de statut non autorisée: {current_status.value} → {new_status.value}"
            )

    # Track changes
    for field, new_value in update_data.items():
        old_value = getattr(db_task, field, None)
        if hasattr(old_value, 'value'):
            old_value = old_value.value
        if hasattr(new_value, 'value'):
            new_value = new_value.value

        if str(old_value) != str(new_value):
            setattr(db_task, field, new_value)
            log_history(db, task_id, user_id, field, str(old_value) if old_value else None, str(new_value) if new_value else None)

    db_task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False


def log_history(
    db: Session,
    task_id: int,
    changed_by: Optional[int] = None,
    field_changed: str = "",
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
) -> TaskHistory:
    username = None
    if changed_by:
        user = get_user_by_id(db, changed_by)
        if user:
            username = user.username

    history = TaskHistory(
        task_id=task_id,
        changed_by=username,
        field_changed=field_changed,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


def get_task_history(db: Session, task_id: int) -> List[TaskHistory]:
    return db.query(TaskHistory).filter(TaskHistory.task_id == task_id).order_by(TaskHistory.changed_at.desc()).all()


# --- Dashboard & Synthesis ---
def get_status_distribution(db: Session) -> List[dict]:
    total = db.query(func.count(Task.id)).scalar() or 1
    results = (
        db.query(Task.status, func.count(Task.id))
        .group_by(Task.status)
        .all()
    )
    return [
        {"status": s.value if hasattr(s, 'value') else s, "count": c, "percentage": round(c / total * 100, 1)}
        for s, c in results
    ]


def get_priority_distribution(db: Session) -> List[dict]:
    total = db.query(func.count(Task.id)).scalar() or 1
    results = (
        db.query(Task.priority, func.count(Task.id))
        .group_by(Task.priority)
        .all()
    )
    return [
        {"priority": p.value if hasattr(p, 'value') else p, "count": c, "percentage": round(c / total * 100, 1)}
        for p, c in results
    ]


def get_theme_completion(db: Session) -> List[dict]:
    results = (
        db.query(
            Task.theme_project,
            func.count(Task.id).label("total"),
            func.sum(func.cast(Task.status == TaskStatus.REALISE, type_=__import__('sqlalchemy').Integer)).label("completed"),
        )
        .group_by(Task.theme_project)
        .all()
    )
    return [
        {
            "theme": t,
            "total": total,
            "completed": completed or 0,
            "completion_rate": round((completed or 0) / total * 100, 1) if total > 0 else 0,
        }
        for t, total, completed in results
    ]


def get_dashboard_data(db: Session) -> dict:
    total = db.query(func.count(Task.id)).scalar() or 0
    completed = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.REALISE).scalar() or 0
    in_progress = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.EN_COURS).scalar() or 0
    blocked = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.BLOQUE).scalar() or 0

    recent = db.query(Task).order_by(Task.updated_at.desc()).limit(10).all()

    return {
        "total_tasks": total,
        "completed": completed,
        "in_progress": in_progress,
        "blocked": blocked,
        "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
        "by_status": get_status_distribution(db),
        "by_priority": get_priority_distribution(db),
        "recent_tasks": recent,
    }
