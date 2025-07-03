# DINE+ Restaurant Management System - PowerShell Setup Script
# For Windows users

Write-Host "🚀 Welcome to DINE+ Restaurant Management System Setup!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
if (npm install) {
    Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
Set-Location ../dine-plus-frontend
if (npm install) {
    Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Create environment files
Write-Host ""
Write-Host "⚙️ Setting up environment files..." -ForegroundColor Blue
Set-Location ..

# Backend environment
if (-not (Test-Path "backend\.env")) {
    $backendEnv = @"
# DINE+ Backend Environment Configuration

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (if needed later)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
"@
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Created backend/.env from template" -ForegroundColor Green
} else {
    Write-Host "⚠️ backend/.env already exists, skipping..." -ForegroundColor Yellow
}

# Frontend environment
if (-not (Test-Path "dine-plus-frontend\.env")) {
    $frontendEnv = @"
# DINE+ Frontend Environment Configuration

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
REACT_APP_API_URL=http://localhost:4000/api

# App Configuration
REACT_APP_APP_NAME=DINE+
REACT_APP_VERSION=1.0.0
"@
    $frontendEnv | Out-File -FilePath "dine-plus-frontend\.env" -Encoding UTF8
    Write-Host "✅ Created dine-plus-frontend/.env from template" -ForegroundColor Green
} else {
    Write-Host "⚠️ dine-plus-frontend/.env already exists, skipping..." -ForegroundColor Yellow
}

# Build backend
Write-Host ""
Write-Host "🔨 Building backend..." -ForegroundColor Blue
Set-Location backend
try {
    npm run build
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend build failed, but continuing..." -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up your Supabase project:" -ForegroundColor White
Write-Host "   - Create account at https://supabase.com" -ForegroundColor Gray
Write-Host "   - Create a new project" -ForegroundColor Gray
Write-Host "   - Copy your project URL and keys" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure environment variables:" -ForegroundColor White
Write-Host "   - Edit backend/.env with your Supabase credentials" -ForegroundColor Gray
Write-Host "   - Edit dine-plus-frontend/.env with your Supabase credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Set up the database:" -ForegroundColor White
Write-Host "   - In Supabase dashboard, go to SQL Editor" -ForegroundColor Gray
Write-Host "   - Copy and paste contents of backend/src/db/schema.sql" -ForegroundColor Gray
Write-Host "   - Execute the script" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the development servers:" -ForegroundColor White
Write-Host "   Terminal 1: cd backend; npm run dev" -ForegroundColor Yellow
Write-Host "   Terminal 2: cd dine-plus-frontend; npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Access the application:" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "   - Backend API: http://localhost:4000" -ForegroundColor Green
Write-Host "   - Kitchen: http://localhost:3000/kitchen" -ForegroundColor Green
Write-Host "   - Admin: http://localhost:3000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For detailed setup instructions, see setup.md" -ForegroundColor Cyan
Write-Host "🆘 For troubleshooting, check the README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding! 🍽️✨" -ForegroundColor Magenta 