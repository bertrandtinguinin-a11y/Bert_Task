import sys; sys.path.insert(0, '.')
from main_supabase import init_database, get_db_cursor

print("Connecting to Supabase...")
init_database()
print("Tables created/verified.")

conn, cur = get_db_cursor()
cur.execute("SELECT COUNT(*) as n FROM tasks")
n = cur.fetchone()["n"]
print(f"Tasks in Supabase: {n}")
cur.close()
conn.close()

if n == 0:
    print("Empty - seeding 17 tasks...")
    from main_supabase import seed_database
    # We need to call the seeded endpoint logic directly
    from passlib.context import CryptContext
    import psycopg2.extras
    pwd = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    
    conn, cur = get_db_cursor()
    # Create admin
    cur.execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (username) DO NOTHING RETURNING id",
        ("admin", "admin@mnexpertise.bj", pwd.hash("admin123"), "admin")
    )
    admin = cur.fetchone()
    admin_id = admin["id"] if admin else 1
    
    for u in [("dg", "dg@mnexpertise.bj", "dg123456", "manager"),
              ("assistant", "assistant@mnexpertise.bj", "assist123", "manager"),
              ("consultant", "consultant@mnexpertise.bj", "consult123", "viewer")]:
        cur.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) ON CONFLICT (username) DO NOTHING",
            (u[0], u[1], pwd.hash(u[2]), u[3])
        )
    
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
            "INSERT INTO tasks (sequence_number, theme_project, task_description, responsible_person, status, priority, due_date, observations, created_by) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], admin_id)
        )
    
    conn.commit()
    print("17 tasks seeded!")
    
    cur.execute("SELECT COUNT(*) as n FROM tasks")
    print(f"Tasks in Supabase: {cur.fetchone()['n']}")
    cur.close()
    conn.close()

print("\nConnected to Supabase cloud database!")
