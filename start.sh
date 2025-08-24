#!/bin/bash

echo "🚀 Starting PayHub Fullstack Application..."

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running on localhost:27017"
    echo "Please start MongoDB first:"
    echo "  - macOS: brew services start mongodb-community"
    echo "  - Linux: sudo systemctl start mongod"
    echo "  - Windows: Start MongoDB service"
    exit 1
fi

echo "✅ MongoDB is running"

# Check if .env file exists in server directory
if [ ! -f "server/.env" ]; then
    echo "⚠️  No .env file found in server directory"
    echo "Creating server/.env with default values..."
    cat > server/.env << EOF
# Database
DATABASE_URL="mongodb://localhost:27017/payhub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:8080"
EOF
    echo "✅ Created server/.env file"
fi

# Install dependencies if node_modules don't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "pay-flow-automation/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd pay-flow-automation && npm install && cd ..
fi

echo "✅ All dependencies installed"

# Start the application
echo "🚀 Starting PayHub..."
npm run dev 