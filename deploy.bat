@echo off
REM 🚀 Deploy Script for AI Interviewer System (Windows)
REM This script helps prepare files for deployment

echo 🚀 Starting deployment preparation...

REM Check if .env files exist
echo 📋 Checking environment files...

if not exist "backend\.env" (
    echo ❌ backend\.env not found!
    echo 💡 Creating from .env.example...
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env"
        echo ✅ Created backend\.env - Please edit it with your API keys!
    ) else (
        echo ❌ backend\.env.example not found!
    )
) else (
    echo ✅ backend\.env exists
)

if not exist "frontend\.env.production" (
    echo ⚠️  frontend\.env.production not found
    echo 💡 Creating from .env.production.example...
    if exist "frontend\.env.production.example" (
        copy "frontend\.env.production.example" "frontend\.env.production"
        echo ✅ Created frontend\.env.production - Please edit it with your API URL!
    ) else (
        echo ❌ frontend\.env.production.example not found!
    )
) else (
    echo ✅ frontend\.env.production exists
)

REM Build Frontend
echo.
echo 📦 Building frontend...
cd frontend

if not exist "node_modules" (
    echo 📥 Installing frontend dependencies...
    call npm install
)

call npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend build successful!
    echo 📁 Build files are in frontend\dist\
) else (
    echo ❌ Frontend build failed!
    cd ..
    exit /b 1
)

cd ..

REM Prepare Backend for deployment
echo.
echo 📦 Preparing backend...

REM Create backend-prod directory
if exist "backend-prod" (
    echo 🗑️  Removing old backend-prod...
    rmdir /s /q backend-prod
)

mkdir backend-prod
mkdir backend-prod\src
mkdir backend-prod\data

REM Copy necessary files
echo 📋 Copying backend files...
xcopy /E /I /Y backend\src\* backend-prod\src\
copy /Y backend\package.json backend-prod\
xcopy /E /I /Y backend\data\* backend-prod\data\

REM Copy .env if it exists
if exist "backend\.env" (
    copy /Y backend\.env backend-prod\.env
    echo ✅ Copied .env file
) else (
    echo ⚠️  No .env file found - you'll need to create one on the server
)

echo.
echo ✅ Deployment preparation complete!
echo.
echo 📝 Next steps:
echo 1. Upload frontend\dist\ to your web hosting (public_html)
echo 2. Upload backend-prod\ to your Node.js hosting
echo 3. Run npm install --production in backend-prod on server
echo 4. Set environment variables on your hosting platform
echo 5. Start your Node.js app
echo.
echo 📖 See DEPLOY_GUIDE.md for detailed instructions

pause

