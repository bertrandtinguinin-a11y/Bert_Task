"""
Point DG — API Backend
M&N Expertise – Natitingou, Bénin
FastAPI + SQLAlchemy + SQLite
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import io
import csv
import openpyxl
from jose import JWTError, jwt

from database import engine, get_db, Base
from models import Task, User, TaskStatus, TaskPriority
from schemas import (
    TaskCreate, TaskUpdate, TaskOut, TaskHistoryOut,
    StatusDistribution, PriorityDistribution, ThemeCompletion,
    DashboardData, UserCreate, UserLogin, UserOut, Token,
    AIPrioritizationResponse, AIBlockageResponse,
    AISummaryResponse, AIRecommendationsResponse,
)
import crud
from ai_module import (
    prioritize_tasks, detect_blockages,
    generate_performance_summary, generate_recommendations,
)

# --- Config ---
SECRET_KEY = "point-dg-mn-expertise-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 heures

app = FastAPI(
    title="Point DG — API",
    description="API de gestion de tâches Point DG pour M&N Expertise, Natitingou, Bénin",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth Helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Query(None), db: Session = Depends(get_db)):
    """Récupère l'utilisateur courant depuis le token (optionnel)."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return crud.get_user_by_id(db, int(user_id))
    except JWTError:
        return None
    return None


def require_auth(token: str = Query(None), db: Session = Depends(get_db)):
    """Middleware qui exige une authentification."""
    if not token:
        raise HTTPException(status_code=401, detail="Authentification requise")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = crud.get_user_by_id(db, int(user_id))
        if user is None:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=UserOut, tags=["Authentification"])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, user_data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris.")
    return crud.create_user(db, user_data)


@app.post("/api/auth/login", response_model=Token, tags=["Authentification"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, credentials.username)
    if not user or not crud.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants invalides.")

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        user=UserOut.model_validate(user),
    )


# --- User Management ---
@app.get("/api/users", response_model=List[UserOut], tags=["Utilisateurs"])
def list_users(current_user: User = Depends(require_auth), db: Session = Depends(get_db)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return crud.get_all_users(db)


@app.put("/api/users/{user_id}/role", response_model=UserOut, tags=["Utilisateurs"])
def change_role(
    user_id: int,
    role: str = Query(..., pattern="^(admin|manager|viewer)$"),
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    user = crud.update_user_role(db, user_id, role)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return user


@app.delete("/api/users/{user_id}", tags=["Utilisateurs"])
def delete_user(
    user_id: int,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
    return {"message": "Utilisateur supprimé avec succès."}


# --- Task Endpoints ---
@app.get("/api/tasks", response_model=List[TaskOut], tags=["Tâches"])
def list_tasks(
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    priority: Optional[str] = Query(None, description="Filtrer par priorité"),
    responsible: Optional[str] = Query(None, description="Filtrer par responsable"),
    theme: Optional[str] = Query(None, description="Filtrer par thème/projet"),
    search: Optional[str] = Query(None, description="Recherche texte"),
    sort_by: Optional[str] = Query(None, description="Trier par colonne"),
    sort_order: Optional[str] = Query("asc", description="Ordre de tri (asc/desc)"),
    db: Session = Depends(get_db),
):
    return crud.get_tasks(db, status, priority, responsible, theme, search, sort_by, sort_order)


@app.get("/api/tasks/export", tags=["Tâches"])
def export_tasks(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db),
):
    tasks = crud.get_tasks(db)
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["#", "Thème/Projet", "Description", "Responsable", "Statut", "Priorité", "Échéance", "Observations"])
        for t in tasks:
            writer.writerow([
                t.sequence_number, t.theme_project, t.task_description,
                t.responsible_person, t.status.value if hasattr(t.status, 'value') else t.status,
                t.priority.value if hasattr(t.priority, 'value') else t.priority,
                t.due_date.isoformat() if t.due_date else "",
                t.observations or "",
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=point_dg_taches.csv"},
        )
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Point DG - Tâches"
        headers = ["#", "Thème/Projet", "Description", "Responsable", "Statut", "Priorité", "Échéance", "Observations"]
        ws.append(headers)
        for t in tasks:
            ws.append([
                t.sequence_number, t.theme_project, t.task_description,
                t.responsible_person,
                t.status.value if hasattr(t.status, 'value') else t.status,
                t.priority.value if hasattr(t.priority, 'value') else t.priority,
                t.due_date.isoformat() if t.due_date else "",
                t.observations or "",
            ])
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=point_dg_taches.xlsx"},
        )


@app.post("/api/tasks", response_model=TaskOut, status_code=201, tags=["Tâches"])
def create_task(
    task_data: TaskCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.id if current_user else None
        return crud.create_task(db, task_data, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/tasks/{task_id}", response_model=TaskOut, tags=["Tâches"])
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée.")
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskOut, tags=["Tâches"])
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.id if current_user else None
        task = crud.update_task(db, task_id, task_data, user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Tâche non trouvée.")
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/tasks/{task_id}", tags=["Tâches"])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_task(db, task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tâche non trouvée.")
    return {"message": "Tâche supprimée avec succès."}


@app.get("/api/tasks/{task_id}/history", response_model=List[TaskHistoryOut], tags=["Tâches"])
def get_task_history(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée.")
    return crud.get_task_history(db, task_id)


# --- Synthesis ---
@app.get("/api/synthesis/status", response_model=List[StatusDistribution], tags=["Synthèse"])
def synthesis_status(db: Session = Depends(get_db)):
    return crud.get_status_distribution(db)


@app.get("/api/synthesis/priority", response_model=List[PriorityDistribution], tags=["Synthèse"])
def synthesis_priority(db: Session = Depends(get_db)):
    return crud.get_priority_distribution(db)


@app.get("/api/synthesis/themes", response_model=List[ThemeCompletion], tags=["Synthèse"])
def synthesis_themes(db: Session = Depends(get_db)):
    return crud.get_theme_completion(db)


# --- Dashboard ---
@app.get("/api/dashboard", response_model=DashboardData, tags=["Tableau de bord"])
def dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_data(db)


# --- AI Endpoints ---
def _tasks_to_dicts(db: Session) -> list:
    tasks = crud.get_tasks(db)
    return [
        {
            "id": t.id,
            "sequence_number": t.sequence_number,
            "theme_project": t.theme_project,
            "task_description": t.task_description,
            "responsible_person": t.responsible_person,
            "status": t.status.value if hasattr(t.status, 'value') else t.status,
            "priority": t.priority.value if hasattr(t.priority, 'value') else t.priority,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "observations": t.observations,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tasks
    ]


@app.post("/api/ai/prioritize", response_model=AIPrioritizationResponse, tags=["IA"])
def ai_prioritize(db: Session = Depends(get_db)):
    tasks = _tasks_to_dicts(db)
    result = prioritize_tasks(tasks)
    return result


@app.post("/api/ai/detect-blockages", response_model=AIBlockageResponse, tags=["IA"])
def ai_detect_blockages(db: Session = Depends(get_db)):
    tasks = _tasks_to_dicts(db)
    result = detect_blockages(tasks)
    return result


@app.post("/api/ai/summary", response_model=AISummaryResponse, tags=["IA"])
def ai_summary(db: Session = Depends(get_db)):
    tasks = _tasks_to_dicts(db)
    result = generate_performance_summary(tasks)
    return result


@app.post("/api/ai/recommendations", response_model=AIRecommendationsResponse, tags=["IA"])
def ai_recommendations(db: Session = Depends(get_db)):
    tasks = _tasks_to_dicts(db)
    result = generate_recommendations(tasks)
    return result


# --- Startup ---
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Auto-seed si vide
    db = next(get_db())
    try:
        from models import Task as TaskModel
        count = db.query(TaskModel).count()
        if count == 0:
            from seed_data import seed_database
            seed_database()
    finally:
        db.close()


@app.get("/", tags=["Racine"])
def root():
    return {
        "app": "Point DG — API",
        "version": "1.0.0",
        "organization": "M&N Expertise – Natitingou, Bénin",
        "docs": "/docs",
    }
