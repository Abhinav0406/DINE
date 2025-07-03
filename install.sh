#!/bin/bash

# DINE+ Restaurant Management System - Installation Script
# This script will set up the complete development environment

echo "🚀 Welcome to DINE+ Restaurant Management System Setup!"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to v16 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../dine-plus-frontend
if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Create environment files
echo ""
echo "⚙️  Setting up environment files..."
cd ..

# Backend environment
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "⚠️  backend/.env already exists, skipping..."
fi

# Frontend environment
if [ ! -f "dine-plus-frontend/.env" ]; then
    cp dine-plus-frontend/.env.example dine-plus-frontend/.env
    echo "✅ Created dine-plus-frontend/.env from template"
else
    echo "⚠️  dine-plus-frontend/.env already exists, skipping..."
fi

# Build backend
echo ""
echo "🔨 Building backend..."
cd backend
if npm run build; then
    echo "✅ Backend build successful"
else
    echo "⚠️  Backend build failed, but continuing..."
fi

echo ""
echo "🎉 Installation completed successfully!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Set up your Supabase project:"
echo "   - Create account at https://supabase.com"
echo "   - Create a new project"
echo "   - Copy your project URL and keys"
echo ""
echo "2. Configure environment variables:"
echo "   - Edit backend/.env with your Supabase credentials"
echo "   - Edit dine-plus-frontend/.env with your Supabase credentials"
echo ""
echo "3. Set up the database:"
echo "   - In Supabase dashboard, go to SQL Editor"
echo "   - Copy and paste contents of backend/src/db/schema.sql"
echo "   - Execute the script"
echo ""
echo "4. Start the development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd dine-plus-frontend && npm start"
echo ""
echo "5. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:4000"
echo "   - Kitchen: http://localhost:3000/kitchen"
echo "   - Admin: http://localhost:3000/admin"
echo ""
echo "📖 For detailed setup instructions, see setup.md"
echo "🆘 For troubleshooting, check the README.md"
echo ""
echo "Happy coding! 🍽️✨" 