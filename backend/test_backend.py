import sys, os, json
sys.path.insert(0, '.')

from database import engine, Base, SessionLocal
from models import Task, User
import crud

# Recreate DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Seed
from seed_data import seed_database
seed_database()

# Test
db = SessionLocal()
tasks = crud.get_tasks(db)
print(f'Tasks count: {len(tasks)}')
for t in tasks:
    status_str = t.status.value if hasattr(t.status, 'value') else str(t.status)
    print(f'  #{t.sequence_number} [{status_str}] {t.task_description[:60]}')

dash = crud.get_dashboard_data(db)
print(f"\nDashboard: total={dash['total_tasks']}, completed={dash['completed']}, rate={dash['completion_rate']}%")

status_dist = crud.get_status_distribution(db)
print('Status distribution:', json.dumps(status_dist, ensure_ascii=False))

# Test AI
from ai_module import detect_blockages, prioritize_tasks, generate_performance_summary, generate_recommendations
task_dicts = [{
    "id": t.id, "sequence_number": t.sequence_number,
    "theme_project": t.theme_project, "task_description": t.task_description,
    "responsible_person": t.responsible_person,
    "status": t.status.value if hasattr(t.status, 'value') else str(t.status),
    "priority": t.priority.value if hasattr(t.priority, 'value') else str(t.priority),
    "due_date": t.due_date.isoformat() if t.due_date else None,
    "observations": t.observations,
    "created_at": t.created_at.isoformat() if t.created_at else None,
    "updated_at": t.updated_at.isoformat() if t.updated_at else None,
} for t in tasks]

print("\n--- AI: Blockage Detection ---")
result = detect_blockages(task_dicts)
for b in result["blockages"]:
    print(f"  #{b['sequence_number']} [{b['severity']}] {b['blockage_type']}")

print("\n--- AI: Prioritization ---")
result = prioritize_tasks(task_dicts)
for s in result["suggestions"]:
    print(f"  #{s['sequence_number']} {s['current_priority']} -> {s['suggested_priority']}: {s['reason'][:80]}")

print("\n--- AI: Performance Summary ---")
result = generate_performance_summary(task_dicts)
print(f"  Rate: {result['completion_rate']}%")
print(f"  Highlights: {result['highlights']}")
print(f"  Concerns: {result['concerns']}")

print("\n--- AI: Recommendations ---")
result = generate_recommendations(task_dicts)
for r in result["recommendations"]:
    print(f"  [{r['priority']}] {r['category']}: {r['recommendation'][:80]}")

db.close()
print("\n=== ALL TESTS PASSED ===")
