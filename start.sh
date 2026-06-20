#!/bin/bash
echo "============================================"
echo "  Point DG - Démarrage de l'application"
echo "  M&N Expertise — Natitingou, Bénin"
echo "============================================"
echo ""

echo "[1/3] Installation des dépendances backend..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERREUR : Échec de l'installation des dépendances Python."
    exit 1
fi

echo "[2/3] Installation des dépendances frontend..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR : Échec de l'installation des dépendances Node.js."
    exit 1
fi

echo "[3/3] Démarrage des serveurs..."
echo ""
echo "Démarrage du backend sur http://localhost:8000..."
cd ../backend
python run.py &
BACKEND_PID=$!

echo "Démarrage du frontend sur http://localhost:5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  Application démarrée !"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  API Docs : http://localhost:8000/docs"
echo "============================================"
echo ""
echo "Comptes de démonstration :"
echo "  admin / admin123 (Administrateur)"
echo "  dg / dg123456     (Manager)"
echo "  consultant / consult123 (Viewer)"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
