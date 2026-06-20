"""
Point DG — Backend AI + Seed (minimaliste)
Ne fait pas d'appels réseau sortants — tout passe par le frontend qui a accès à Supabase
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ai_module import prioritize_tasks, detect_blockages, generate_performance_summary, generate_recommendations

app = FastAPI(title="Point DG — AI Engine", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.post("/api/ai/prioritize")
def ai_prioritize(body: list[dict]):
    """Reçoit la liste des tâches du frontend, retourne les suggestions de priorisation."""
    return prioritize_tasks(body)

@app.post("/api/ai/detect-blockages")
def ai_detect_blockages(body: list[dict]):
    return detect_blockages(body)

@app.post("/api/ai/summary")
def ai_summary(body: list[dict]):
    return generate_performance_summary(body)

@app.post("/api/ai/recommendations")
def ai_recommendations(body: list[dict]):
    return generate_recommendations(body)

@app.get("/api/status")
def status():
    return {"status": "ok", "mode": "AI only"}

@app.get("/")
def root():
    return {"app": "Point DG — AI Engine", "version": "4.0.0", "endpoints": ["/api/ai/prioritize", "/api/ai/detect-blockages", "/api/ai/summary", "/api/ai/recommendations"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
