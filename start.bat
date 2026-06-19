@echo off
echo ============================================
echo   Point DG - Demarrage de l'application
echo   M^&N Expertise - Natitingou, Benin
echo ============================================
echo.

echo [1/3] Installation des dependances backend...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERREUR : Echec de l'installation des dependances Python.
    pause
    exit /b 1
)

echo [2/3] Installation des dependances frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR : Echec de l'installation des dependances Node.js.
    pause
    exit /b 1
)

echo [3/3] Demarrage des serveurs...
echo.
echo Demarrage du backend sur http://localhost:8000...
start "Point DG - Backend" cmd /c "cd ..\backend && python run.py"

echo Demarrage du frontend sur http://localhost:5173...
start "Point DG - Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ============================================
echo   Application demarree !
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ============================================
echo.
echo Comptes de demonstration :
echo   admin / admin123 (Administrateur)
echo   dg / dg123456     (Manager)
echo   consultant / consult123 (Viewer)
echo.
pause
