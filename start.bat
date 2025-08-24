@echo off
echo 🚀 Starting PayHub Fullstack Application...

REM Check if MongoDB is running (Windows)
echo 📊 Checking MongoDB connection...
netstat -an | find "27017" >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running on localhost:27017
    echo Please start MongoDB first:
    echo   - Start MongoDB service from Windows Services
    echo   - Or run mongod.exe from MongoDB installation directory
    pause
    exit /b 1
)

echo ✅ MongoDB is running

REM Check if .env file exists in server directory
if not exist "server\.env" (
    echo ⚠️  No .env file found in server directory
    echo Creating server\.env with default values...
    (
        echo # Database
        echo DATABASE_URL="mongodb://localhost:27017/payhub"
        echo.
        echo # JWT
        echo JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
        echo JWT_EXPIRES_IN="7d"
        echo.
        echo # Server
        echo PORT=5000
        echo NODE_ENV="development"
        echo.
        echo # CORS
        echo ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:8080"
    ) > server\.env
    echo ✅ Created server\.env file
)

REM Install dependencies if node_modules don't exist
if not exist "node_modules" (
    echo 📦 Installing root dependencies...
    npm install
)

if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server && npm install && cd ..
)

if not exist "pay-flow-automation\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd pay-flow-automation && npm install && cd ..
)

echo ✅ All dependencies installed

REM Start the application
echo 🚀 Starting PayHub...
npm run dev

pause 