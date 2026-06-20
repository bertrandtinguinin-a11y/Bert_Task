"""
Données initiales — 17 tâches du fichier Excel Point DG au 1er Juin
M&N Expertise – Natitingou, Bénin
IMPORT EXACT depuis le fichier Excel original.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datetime import date
from database import SessionLocal, engine, Base
from models import Task, User, TaskStatus, TaskPriority, UserRole


def seed_database():
    """Importe les 17 tâches exactes du fichier Excel Point DG 1er Juin."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(Task).first()
        if existing:
            print("Base déjà initialisée. Seed ignoré.")
            return

        # --- Utilisateurs par défaut ---
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

        users = [
            User(
                username="admin",
                email="admin@mnexpertise.bj",
                password_hash=pwd_context.hash("admin123"),
                role=UserRole.admin,
            ),
            User(
                username="dg",
                email="dg@mnexpertise.bj",
                password_hash=pwd_context.hash("dg123456"),
                role=UserRole.manager,
            ),
            User(
                username="assistant",
                email="assistant@mnexpertise.bj",
                password_hash=pwd_context.hash("assist123"),
                role=UserRole.manager,
            ),
            User(
                username="consultant",
                email="consultant@mnexpertise.bj",
                password_hash=pwd_context.hash("consult123"),
                role=UserRole.viewer,
            ),
        ]

        for u in users:
            db.add(u)
        db.flush()
        admin_id = users[0].id

        # --- 17 TÂCHES — Import exact du fichier Excel original ---
        tasks_data = [
            # Cabinet – Retraite (4 tâches)
            (1, "Cabinet – Retraite", "Organiser une retraite pour faire le point du cabinet",
             "Paulin, Victorine et Arnaud", TaskStatus.A_TRAITER, TaskPriority.HAUTE,
             None, "Les TDR sont transmis au DG pour examen et validation"),
            (2, "Cabinet – Retraite", "Définir la période de la retraite",
             "Paulin, Victorine et Arnaud", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),
            (3, "Cabinet – Retraite", "Définir le lieu de la retraite",
             "Paulin, Victorine et Arnaud", TaskStatus.REALISE, TaskPriority.MOYENNE,
             None, ""),
            (4, "Cabinet – Retraite", "Faire le budget pour la retraite",
             "Paulin, Victorine et Arnaud", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),

            # Mail Professionnel (1 tâche)
            (5, "Mail Professionnel", "Création de mail projet",
             "S&E", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),

            # Communication / Multimédia (3 tâches)
            (6, "Communication / Multimédia", "Partager les photos et vidéos de Cobly",
             "Moutakilou", TaskStatus.EN_COURS, TaskPriority.MOYENNE,
             None, ""),
            (7, "Communication / Multimédia", "Manuel : voir les messages clé",
             "Moutakilou", TaskStatus.EN_COURS, TaskPriority.MOYENNE,
             None, ""),
            (8, "Communication / Multimédia", "Traduire les messages en langue locale",
             "Moutakilou", TaskStatus.A_FAIRE, TaskPriority.MOYENNE,
             None, ""),

            # Fabrice Kopore (1 tâche)
            (9, "Fabrice Kopore", "photos Helvetas – Natitingou & Toucountouna",
             "RSE", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),

            # Florentine / SNV (1 tâche)
            (10, "Florentine / SNV", "Traiter la demande envoyée par Florentine (SNV)",
             "Victorine/sup YOKOSSI", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),

            # Facilitateurs(ce) SNV / Rapports (3 tâches)
            (11, "Facilitateurs(ce) SNV / Rapports", "Que les Facilitateurs(ce) réalisent leur rapport",
             "Facilitateurs(ce)/Sup/RSE", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),
            (12, "Facilitateurs(ce) SNV / Rapports", "Inclure activités prévues et réalisées dans le rapport",
             "Facilitateurs(ce)", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),
            (13, "Facilitateurs(ce) SNV / Rapports", "Documenter les difficultés rencontrées et solutions",
             "Facilitateurs(ce)", TaskStatus.REALISE, TaskPriority.MOYENNE,
             None, ""),

            # Situation de référence Formation Microentrepreneur C2 (1 tâche)
            (14, "Situation de référence Formation Microentrepreneur C2",
             "Compiler les données du pré-test et du post-test",
             "S&E", TaskStatus.REALISE, TaskPriority.HAUTE,
             None, ""),

            # Maguerite (1 tâche)
            (15, "Maguerite", "Prendre renseignements sur le décès du parent de Marguérite",
             "Paulin", TaskStatus.REALISE, TaskPriority.HAUTE,
             date(2026, 6, 27),
             "Les obsèques auront lieu à Djougou le 27 Juin 2026. Un pagne d'une valeur de 7 500 FCFA est mis en vente comme uniforme"),

            # Formation en S&E et IA intégré (1 tâche)
            (16, "Formation en S&E et IA intégré",
             "Activer la formation en S&E au plus tard en juillet",
             "S&E", TaskStatus.EN_COURS, TaskPriority.HAUTE,
             None, ""),

            # Formation en EIES (1 tâche)
            (17, "Formation en EIES",
             "Activer la formation en EIES",
             "Arnaud/Florentine", TaskStatus.EN_COURS, TaskPriority.MOYENNE,
             None, ""),
        ]

        for td in tasks_data:
            task = Task(
                sequence_number=td[0],
                theme_project=td[1],
                task_description=td[2],
                responsible_person=td[3],
                status=td[4],
                priority=td[5],
                due_date=td[6],
                observations=td[7],
                created_by=admin_id,
            )
            db.add(task)

        db.commit()
        print(f"[OK] Seed terminé : {len(users)} utilisateurs, {len(tasks_data)} tâches importées du fichier Excel.")

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Seed : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
