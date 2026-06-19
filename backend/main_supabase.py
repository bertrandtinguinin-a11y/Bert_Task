"""
Point DG — Backend Supabase (PostgreSQL Cloud)
M&N Expertise – Natitingou, Bénin
Remplace SQLite par Supabase PostgreSQL + temps réel
"""
import os
import sys
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import io
import csv
import openpyxl
from jose import JWTError, jwt
import psycopg2
import psycopg2.extras
from contextlib import contextmanager

# ============================================================
# CONFIG SUPABASE — Modifier ici avec tes vraies clés
# ============================================================
SUPABASE_URL = "https://icwnwahtrasxobebqvcr.supabase.co"
SUPABASE_DB_URL = os.getenv(
    "SUPABASE_DB_URL",
    "postgresql://postgres:Hxc55JkWYfvI6oRU@db.icwnwahtrasxobebqvcr.supabase.co:6543/postgres"
)
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    ""
)

# JWT Secret pour l'auth locale
SECRET_KEY = os.getenv("SECRET_KEY", "point-dg-mn-expertise-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

app = FastAPI(title="Point DG — API Supabase", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE CONNECTION POOL
# ============================================================
@contextmanager
def get_db():
    """Connexion à Supabase PostgreSQL."""
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_DB_URL non configuré. Mets à jour la variable d'environnement.")
    conn = psycopg2.connect(SUPABASE_DB_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db_cursor():
    conn = psycopg2.connect(SUPABASE_DB_URL)
    return conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ============================================================
# INIT DATABASE — Crée les tables si besoin
# ============================================================
def init_database():
    """Crée les tables dans Supabase si elles n'existent pas."""
    if not SUPABASE_DB_URL:
        print("⚠️  SUPABASE_DB_URL non configuré, init ignorée.")
        return
    
    sql = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        sequence_number INTEGER NOT NULL,
        theme_project VARCHAR(200) NOT NULL,
        task_description TEXT NOT NULL,
        responsible_person VARCHAR(200) NOT NULL,
        status VARCHAR(20) DEFAULT 'À faire' CHECK (status IN ('À faire', 'En cours', 'Réalisé', 'À traiter', 'À planifier', 'Bloqué')),
        priority VARCHAR(10) DEFAULT 'Moyenne' CHECK (priority IN ('Haute', 'Moyenne', 'Basse')),
        start_date DATE,
        due_date DATE,
        observations TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS task_history (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
        changed_by VARCHAR(200),
        field_changed VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Index pour les performances
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_theme ON tasks(theme_project);
    CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON tasks(responsible_person);
    CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
    """
    
    conn, cur = get_db_cursor()
    try:
        cur.execute(sql)
        conn.commit()
        print("✅ Tables créées/vérifiées dans Supabase")
    finally:
        cur.close()
        conn.close()


# ============================================================
# AUTH
# ============================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Query(None)):
    if not token or not SUPABASE_DB_URL:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        conn, cur = get_db_cursor()
        try:
            cur.execute("SELECT * FROM users WHERE id = %s", (int(user_id),))
            return cur.fetchone()
        finally:
            cur.close()
            conn.close()
    except (JWTError, Exception):
        return None


def require_auth(token: str = Query(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Authentification requise")
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide")
    return user


@app.post("/api/auth/login", tags=["Authentification"])
def login(body: dict):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM users WHERE username = %s", (body["username"],))
        user = cur.fetchone()
        if not user or not pwd_context.verify(body["password"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Identifiants invalides")
        
        token = create_access_token(data={"sub": str(user["id"]), "role": user["role"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "created_at": user["created_at"].isoformat() if user["created_at"] else None,
            }
        }
    finally:
        cur.close()
        conn.close()


@app.post("/api/auth/register", tags=["Authentification"])
def register(body: dict):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    
    conn, cur = get_db_cursor()
    try:
        hashed = pwd_context.hash(body["password"])
        cur.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING *",
            (body["username"], body["email"], hashed, body.get("role", "viewer"))
        )
        user = cur.fetchone()
        conn.commit()
        return {
            "id": user["id"], "username": user["username"],
            "email": user["email"], "role": user["role"],
            "created_at": user["created_at"].isoformat() if user["created_at"] else None,
        }
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
    finally:
        cur.close()
        conn.close()


# ============================================================
# TASKS — CRUD complet sur Supabase
# ============================================================
@app.get("/api/tasks", tags=["Tâches"])
def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    responsible: Optional[str] = Query(None),
    theme: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("sequence_number"),
    sort_order: Optional[str] = Query("asc"),
):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    
    conn, cur = get_db_cursor()
    try:
        query = "SELECT * FROM tasks WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = %s"
            params.append(status)
        if priority:
            query += " AND priority = %s"
            params.append(priority)
        if responsible:
            query += " AND responsible_person ILIKE %s"
            params.append(f"%{responsible}%")
        if theme:
            query += " AND theme_project ILIKE %s"
            params.append(f"%{theme}%")
        if search:
            query += " AND (task_description ILIKE %s OR responsible_person ILIKE %s OR observations ILIKE %s OR theme_project ILIKE %s)"
            params.extend([f"%{search}%"] * 4)
        
        # Sécuriser sort_by
        allowed_sort = ["sequence_number", "status", "priority", "due_date", "responsible_person", "theme_project", "created_at", "updated_at"]
        if sort_by not in allowed_sort:
            sort_by = "sequence_number"
        sort_dir = "DESC" if sort_order.lower() == "desc" else "ASC"
        query += f" ORDER BY {sort_by} {sort_dir}"
        
        cur.execute(query, params)
        tasks = cur.fetchall()
        
        return [
            {
                "id": t["id"], "sequence_number": t["sequence_number"],
                "theme_project": t["theme_project"], "task_description": t["task_description"],
                "responsible_person": t["responsible_person"], "status": t["status"],
                "priority": t["priority"],
                "due_date": t["due_date"].isoformat() if t["due_date"] else None,
                "observations": t["observations"],
                "created_at": t["created_at"].isoformat() if t["created_at"] else None,
                "updated_at": t["updated_at"].isoformat() if t["updated_at"] else None,
                "created_by": t["created_by"],
            }
            for t in tasks
        ]
    finally:
        cur.close()
        conn.close()


@app.get("/api/tasks/{task_id}", tags=["Tâches"])
def get_task(task_id: int):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        t = cur.fetchone()
        if not t:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        return {
            "id": t["id"], "sequence_number": t["sequence_number"],
            "theme_project": t["theme_project"], "task_description": t["task_description"],
            "responsible_person": t["responsible_person"], "status": t["status"],
            "priority": t["priority"],
            "due_date": t["due_date"].isoformat() if t["due_date"] else None,
            "observations": t["observations"],
            "created_at": t["created_at"].isoformat() if t["created_at"] else None,
            "updated_at": t["updated_at"].isoformat() if t["updated_at"] else None,
            "created_by": t["created_by"],
        }
    finally:
        cur.close()
        conn.close()


@app.post("/api/tasks", status_code=201, tags=["Tâches"])
def create_task(body: dict, current_user=Depends(get_current_user)):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    conn, cur = get_db_cursor()
    try:
        user_id = current_user["id"] if current_user else None
        
        # Vérifier doublon sequence_number
        cur.execute("SELECT id FROM tasks WHERE sequence_number = %s", (body["sequence_number"],))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Numéro de séquence {body['sequence_number']} déjà utilisé")
        
        cur.execute(
            """INSERT INTO tasks (sequence_number, theme_project, task_description, responsible_person, 
               status, priority, due_date, observations, created_by)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (body["sequence_number"], body["theme_project"], body["task_description"],
             body["responsible_person"], body.get("status", "À faire"),
             body.get("priority", "Moyenne"), body.get("due_date"),
             body.get("observations"), user_id)
        )
        t = cur.fetchone()
        conn.commit()
        
        # Log creation
        log_task_history(cur, t["id"], current_user["username"] if current_user else None, 
                         "création", None, f"Tâche créée: {body['task_description']}")
        conn.commit()
        
        return {
            "id": t["id"], "sequence_number": t["sequence_number"],
            "theme_project": t["theme_project"], "task_description": t["task_description"],
            "responsible_person": t["responsible_person"], "status": t["status"],
            "priority": t["priority"],
            "due_date": t["due_date"].isoformat() if t["due_date"] else None,
            "observations": t["observations"],
            "created_at": t["created_at"].isoformat() if t["created_at"] else None,
            "updated_at": t["updated_at"].isoformat() if t["updated_at"] else None,
            "created_by": t["created_by"],
        }
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Doublon détecté")
    finally:
        cur.close()
        conn.close()


@app.put("/api/tasks/{task_id}", tags=["Tâches"])
def update_task(task_id: int, body: dict, current_user=Depends(get_current_user)):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        username = current_user["username"] if current_user else None
        
        # Build update query dynamically
        updates = []
        params = []
        for field in ["sequence_number", "theme_project", "task_description", "responsible_person",
                       "status", "priority", "due_date", "observations"]:
            if field in body and body[field] != existing[field]:
                old_val = str(existing[field]) if existing[field] else None
                new_val = str(body[field]) if body[field] else None
                updates.append(f"{field} = %s")
                params.append(body[field])
                if str(old_val) != str(new_val):
                    log_task_history(cur, task_id, username, field, old_val, new_val)
        
        if not updates:
            return {  # No changes
                "id": existing["id"], "sequence_number": existing["sequence_number"],
                "theme_project": existing["theme_project"], "task_description": existing["task_description"],
                "responsible_person": existing["responsible_person"], "status": existing["status"],
                "priority": existing["priority"],
                "due_date": existing["due_date"].isoformat() if existing["due_date"] else None,
                "observations": existing["observations"],
                "created_at": existing["created_at"].isoformat() if existing["created_at"] else None,
                "updated_at": existing["updated_at"].isoformat() if existing["updated_at"] else None,
                "created_by": existing["created_by"],
            }
        
        params.append(task_id)
        cur.execute(
            f"UPDATE tasks SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s RETURNING *",
            params
        )
        t = cur.fetchone()
        conn.commit()
        
        return {
            "id": t["id"], "sequence_number": t["sequence_number"],
            "theme_project": t["theme_project"], "task_description": t["task_description"],
            "responsible_person": t["responsible_person"], "status": t["status"],
            "priority": t["priority"],
            "due_date": t["due_date"].isoformat() if t["due_date"] else None,
            "observations": t["observations"],
            "created_at": t["created_at"].isoformat() if t["created_at"] else None,
            "updated_at": t["updated_at"].isoformat() if t["updated_at"] else None,
            "created_by": t["created_by"],
        }
    finally:
        cur.close()
        conn.close()


@app.delete("/api/tasks/{task_id}", tags=["Tâches"])
def delete_task(task_id: int):
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="Base de données non configurée")
    conn, cur = get_db_cursor()
    try:
        cur.execute("DELETE FROM tasks WHERE id = %s RETURNING id", (task_id,))
        deleted = cur.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        conn.commit()
        return {"message": "Tâche supprimée", "id": task_id}
    finally:
        cur.close()
        conn.close()


def log_task_history(cur, task_id, username, field, old_val, new_val):
    cur.execute(
        "INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value) VALUES (%s, %s, %s, %s, %s)",
        (task_id, username, field, old_val, new_val)
    )


@app.get("/api/tasks/{task_id}/history", tags=["Tâches"])
def get_task_history(task_id: int):
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM task_history WHERE task_id = %s ORDER BY changed_at DESC", (task_id,))
        return [
            {
                "id": h["id"], "task_id": h["task_id"],
                "changed_by": h["changed_by"], "field_changed": h["field_changed"],
                "old_value": h["old_value"], "new_value": h["new_value"],
                "changed_at": h["changed_at"].isoformat() if h["changed_at"] else None,
            }
            for h in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


# ============================================================
# SYNTHESIS & DASHBOARD
# ============================================================
@app.get("/api/synthesis/status", tags=["Synthèse"])
def synthesis_status():
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT COUNT(*) as total FROM tasks")
        total = cur.fetchone()["total"] or 1
        cur.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status ORDER BY count DESC")
        return [
            {"status": r["status"], "count": r["count"],
             "percentage": round(r["count"] / total * 100, 1)}
            for r in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


@app.get("/api/synthesis/priority", tags=["Synthèse"])
def synthesis_priority():
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT COUNT(*) as total FROM tasks")
        total = cur.fetchone()["total"] or 1
        cur.execute("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY count DESC")
        return [
            {"priority": r["priority"], "count": r["count"],
             "percentage": round(r["count"] / total * 100, 1)}
            for r in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


@app.get("/api/synthesis/themes", tags=["Synthèse"])
def synthesis_themes():
    conn, cur = get_db_cursor()
    try:
        cur.execute("""
            SELECT theme_project as theme, COUNT(*) as total,
                   SUM(CASE WHEN status = 'Réalisé' THEN 1 ELSE 0 END) as completed
            FROM tasks GROUP BY theme_project ORDER BY theme_project
        """)
        return [
            {
                "theme": r["theme"], "total": r["total"],
                "completed": r["completed"] or 0,
                "completion_rate": round((r["completed"] or 0) / r["total"] * 100, 1) if r["total"] > 0 else 0,
            }
            for r in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


@app.get("/api/dashboard", tags=["Tableau de bord"])
def dashboard():
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT COUNT(*) as total FROM tasks")
        total = cur.fetchone()["total"] or 0
        cur.execute("SELECT COUNT(*) as n FROM tasks WHERE status = 'Réalisé'")
        completed = cur.fetchone()["n"] or 0
        cur.execute("SELECT COUNT(*) as n FROM tasks WHERE status = 'En cours'")
        in_progress = cur.fetchone()["n"] or 0
        cur.execute("SELECT COUNT(*) as n FROM tasks WHERE status = 'Bloqué'")
        blocked = cur.fetchone()["n"] or 0
        
        cur.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status ORDER BY count DESC")
        by_status = [
            {"status": r["status"], "count": r["count"],
             "percentage": round(r["count"] / max(total, 1) * 100, 1)}
            for r in cur.fetchall()
        ]
        
        cur.execute("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY count DESC")
        by_priority = [
            {"priority": r["priority"], "count": r["count"],
             "percentage": round(r["count"] / max(total, 1) * 100, 1)}
            for r in cur.fetchall()
        ]
        
        cur.execute("SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 10")
        recent = [
            {
                "id": t["id"], "sequence_number": t["sequence_number"],
                "theme_project": t["theme_project"], "task_description": t["task_description"],
                "responsible_person": t["responsible_person"], "status": t["status"],
                "priority": t["priority"],
                "due_date": t["due_date"].isoformat() if t["due_date"] else None,
                "observations": t["observations"],
                "created_at": t["created_at"].isoformat() if t["created_at"] else None,
                "updated_at": t["updated_at"].isoformat() if t["updated_at"] else None,
                "created_by": t["created_by"],
            }
            for t in cur.fetchall()
        ]
        
        return {
            "total_tasks": total, "completed": completed,
            "in_progress": in_progress, "blocked": blocked,
            "completion_rate": round(completed / max(total, 1) * 100, 1),
            "by_status": by_status, "by_priority": by_priority,
            "recent_tasks": recent,
        }
    finally:
        cur.close()
        conn.close()


# ============================================================
# EXPORT
# ============================================================
@app.get("/api/tasks/export", tags=["Tâches"])
def export_tasks(format: str = Query("csv", pattern="^(csv|excel)$")):
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM tasks ORDER BY sequence_number")
        tasks = cur.fetchall()
        
        if format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["#", "Thème/Projet", "Description", "Responsable", "Statut", "Priorité", "Échéance", "Observations"])
            for t in tasks:
                writer.writerow([t["sequence_number"], t["theme_project"], t["task_description"],
                                 t["responsible_person"], t["status"], t["priority"],
                                 t["due_date"].isoformat() if t["due_date"] else "",
                                 t["observations"] or ""])
            output.seek(0)
            return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
                                     headers={"Content-Disposition": "attachment; filename=point_dg_taches.csv"})
        else:
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Point DG - Tâches"
            ws.append(["#", "Thème/Projet", "Description", "Responsable", "Statut", "Priorité", "Échéance", "Observations"])
            for t in tasks:
                ws.append([t["sequence_number"], t["theme_project"], t["task_description"],
                           t["responsible_person"], t["status"], t["priority"],
                           t["due_date"].isoformat() if t["due_date"] else "",
                           t["observations"] or ""])
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            return StreamingResponse(iter([output.getvalue()]),
                                     media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                     headers={"Content-Disposition": "attachment; filename=point_dg_taches.xlsx"})
    finally:
        cur.close()
        conn.close()


# ============================================================
# AI — Les modules existants fonctionnent avec les dicts
# ============================================================
from ai_module import prioritize_tasks, detect_blockages, generate_performance_summary, generate_recommendations


def _get_tasks_as_dicts():
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM tasks ORDER BY sequence_number")
        return [
            {
                "id": t["id"], "sequence_number": t["sequence_number"],
                "theme_project": t["theme_project"], "task_description": t["task_description"],
                "responsible_person": t["responsible_person"], "status": t["status"],
                "priority": t["priority"],
                "due_date": t["due_date"].isoformat() if t["due_date"] else None,
                "observations": t["observations"],
            }
            for t in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


@app.post("/api/ai/prioritize", tags=["IA"])
def ai_prioritize():
    tasks = _get_tasks_as_dicts()
    return prioritize_tasks(tasks)


@app.post("/api/ai/detect-blockages", tags=["IA"])
def ai_detect_blockages():
    tasks = _get_tasks_as_dicts()
    return detect_blockages(tasks)


@app.post("/api/ai/summary", tags=["IA"])
def ai_summary():
    tasks = _get_tasks_as_dicts()
    return generate_performance_summary(tasks)


@app.post("/api/ai/recommendations", tags=["IA"])
def ai_recommendations():
    tasks = _get_tasks_as_dicts()
    return generate_recommendations(tasks)


# ============================================================
# USERS
# ============================================================
@app.get("/api/users", tags=["Utilisateurs"])
def list_users(current_user=Depends(require_auth)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Réservé admin")
    conn, cur = get_db_cursor()
    try:
        cur.execute("SELECT * FROM users ORDER BY created_at DESC")
        return [
            {"id": u["id"], "username": u["username"], "email": u["email"],
             "role": u["role"],
             "created_at": u["created_at"].isoformat() if u["created_at"] else None}
            for u in cur.fetchall()
        ]
    finally:
        cur.close()
        conn.close()


@app.put("/api/users/{user_id}/role", tags=["Utilisateurs"])
def change_role(user_id: int, role: str = Query(..., pattern="^(admin|manager|viewer)$"),
                current_user=Depends(require_auth)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Réservé admin")
    conn, cur = get_db_cursor()
    try:
        cur.execute("UPDATE users SET role = %s WHERE id = %s RETURNING *", (role, user_id))
        u = cur.fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        conn.commit()
        return {"id": u["id"], "username": u["username"], "email": u["email"],
                "role": u["role"],
                "created_at": u["created_at"].isoformat() if u["created_at"] else None}
    finally:
        cur.close()
        conn.close()


# ============================================================
# SEED — Import Excel initial
# ============================================================
@app.post("/api/seed", tags=["Administration"])
def seed_database(current_user=Depends(require_auth)):
    """Importe les 17 tâches originales du fichier Excel dans Supabase."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Réservé admin")
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    
    conn, cur = get_db_cursor()
    try:
        # Vérifier si déjà seedé
        cur.execute("SELECT COUNT(*) as n FROM tasks")
        if cur.fetchone()["n"] > 0:
            return {"message": "Base déjà initialisée", "task_count": cur.fetchone()["n"]}
        
        # Créer admin
        cur.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (username) DO NOTHING RETURNING id",
            ("admin", "admin@mnexpertise.bj", pwd_context.hash("admin123"), "admin")
        )
        admin = cur.fetchone()
        admin_id = admin["id"] if admin else 1
        
        # Créer autres utilisateurs
        for u in [("dg", "dg@mnexpertise.bj", "dg123456", "manager"),
                  ("assistant", "assistant@mnexpertise.bj", "assist123", "manager"),
                  ("consultant", "consultant@mnexpertise.bj", "consult123", "viewer")]:
            cur.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (username) DO NOTHING",
                (u[0], u[1], pwd_context.hash(u[2]), u[3])
            )
        
        # 17 tâches originales
        tasks = [
            (1, "Cabinet – Retraite", "Organiser une retraite pour faire le point du cabinet", "Paulin, Victorine et Arnaud", "À traiter", "Haute", None, "Les TDR sont transmis au DG pour examen et validation"),
            (2, "Cabinet – Retraite", "Définir la période de la retraite", "Paulin, Victorine et Arnaud", "Réalisé", "Haute", None, ""),
            (3, "Cabinet – Retraite", "Définir le lieu de la retraite", "Paulin, Victorine et Arnaud", "Réalisé", "Moyenne", None, ""),
            (4, "Cabinet – Retraite", "Faire le budget pour la retraite", "Paulin, Victorine et Arnaud", "Réalisé", "Haute", None, ""),
            (5, "Mail Professionnel", "Création de mail projet", "S&E", "Réalisé", "Haute", None, ""),
            (6, "Communication / Multimédia", "Partager les photos et vidéos de Cobly", "Moutakilou", "En cours", "Moyenne", None, ""),
            (7, "Communication / Multimédia", "Manuel : voir les messages clé", "Moutakilou", "En cours", "Moyenne", None, ""),
            (8, "Communication / Multimédia", "Traduire les messages en langue locale", "Moutakilou", "À faire", "Moyenne", None, ""),
            (9, "Fabrice Kopore", "photos Helvetas – Natitingou & Toucountouna", "RSE", "Réalisé", "Haute", None, ""),
            (10, "Florentine / SNV", "Traiter la demande envoyée par Florentine (SNV)", "Victorine/sup YOKOSSI", "Réalisé", "Haute", None, ""),
            (11, "Facilitateurs(ce) SNV / Rapports", "Que les Facilitateurs(ce) réalisent leur rapport", "Facilitateurs(ce)/Sup/RSE", "Réalisé", "Haute", None, ""),
            (12, "Facilitateurs(ce) SNV / Rapports", "Inclure activités prévues et réalisées dans le rapport", "Facilitateurs(ce)", "Réalisé", "Haute", None, ""),
            (13, "Facilitateurs(ce) SNV / Rapports", "Documenter les difficultés rencontrées et solutions", "Facilitateurs(ce)", "Réalisé", "Moyenne", None, ""),
            (14, "Situation de référence Formation Microentrepreneur C2", "Compiler les données du pré-test et du post-test", "S&E", "Réalisé", "Haute", None, ""),
            (15, "Maguerite", "Prendre renseignements sur le décès du parent de Marguérite", "Paulin", "Réalisé", "Haute", "2026-06-27", "Les obsèques auront lieu à Djougou le 27 Juin 2026. Un pagne d'une valeur de 7 500 FCFA est mis en vente comme uniforme"),
            (16, "Formation en S&E et IA intégré", "Activer la formation en S&E au plus tard en juillet", "S&E", "En cours", "Haute", None, ""),
            (17, "Formation en EIES", "Activer la formation en EIES", "Arnaud/Florentine", "En cours", "Moyenne", None, ""),
        ]
        
        for t in tasks:
            cur.execute(
                """INSERT INTO tasks (sequence_number, theme_project, task_description, responsible_person, 
                   status, priority, due_date, observations, created_by) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], admin_id)
            )
        
        conn.commit()
        return {"message": "Seed terminé", "tasks_created": len(tasks)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# ============================================================
# STARTUP
# ============================================================
@app.on_event("startup")
def on_startup():
    print(f"🔗 Supabase: {SUPABASE_URL}")
    if SUPABASE_DB_URL:
        init_database()
        print("✅ Prêt — base Supabase connectée")
    else:
        print("⚠️  Mode hors-ligne — configure SUPABASE_DB_URL")


@app.get("/", tags=["Racine"])
def root():
    return {
        "app": "Point DG — API Supabase",
        "version": "2.0.0",
        "supabase_connected": bool(SUPABASE_DB_URL),
        "docs": "/docs",
    }


@app.get("/api/status", tags=["Système"])
def status():
    return {
        "supabase_url": SUPABASE_URL,
        "db_connected": bool(SUPABASE_DB_URL),
        "anon_key_set": bool(SUPABASE_ANON_KEY),
    }
