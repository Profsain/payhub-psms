#!/bin/bash

echo "🔧 Setting up PayHub environment configuration..."

# Create server .env file
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server/.env file..."
    cat > server/.env << EOF
# Database
DATABASE_URL="mongodb://localhost:27017/payhub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS - Updated to include frontend port 8080
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:8080"
EOF
    echo "✅ Created server/.env file"
else
    echo "⚠️  server/.env already exists"
    echo "Please ensure it contains the correct CORS configuration:"
    echo "ALLOWED_ORIGINS=\"http://localhost:3000,http://localhost:5173,http://localhost:8080\""
fi

# Create frontend .env file
if [ ! -f "pay-flow-automation/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cat > pay-flow-automation/.env << EOF
VITE_API_URL=http://localhost:5000/api
EOF
    echo "✅ Created frontend .env file"
else
    echo "⚠️  pay-flow-automation/.env already exists"
    echo "Please ensure it contains: VITE_API_URL=http://localhost:5000/api"
fi

echo ""
echo "🎯 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start MongoDB: brew services start mongodb-community (macOS) or sudo systemctl start mongod (Linux)"
echo "2. Start the application: npm run dev"
echo "3. Access frontend at: http://localhost:8080"
echo "4. Backend API at: http://localhost:5000"
echo ""
echo "If you still get CORS errors, ensure:"
echo "- The server is running on port 5000"
echo "- The frontend is running on port 8080"
echo "- MongoDB is running on port 27017" 