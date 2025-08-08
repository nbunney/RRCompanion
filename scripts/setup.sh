#!/bin/bash

# RRCompanion Monorepo Setup Script

set -e

echo "🚀 Setting up RRCompanion Monorepo..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Installing Deno..."
    curl -fsSL https://deno.land/install.sh | sh
    echo "✅ Deno installed. Please restart your terminal or run: source ~/.bashrc"
    exit 1
fi

# Check if MariaDB is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MariaDB is not installed. Please install MariaDB first:"
    echo "   macOS: brew install mariadb"
    echo "   Ubuntu: sudo apt-get install mariadb-server"
    echo "   Then start MariaDB and create a database: mysql -u root -p -e 'CREATE DATABASE rrcompanion;'"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared package
echo "🔨 Building shared package..."
cd packages/shared
npm run build
cd ../..

# Create environment file for API
echo "⚙️  Setting up environment variables..."
if [ ! -f apps/api/.env ]; then
    cp apps/api/env.example apps/api/.env
    echo "✅ Created apps/api/.env file. Please update it with your database credentials."
else
    echo "✅ apps/api/.env already exists."
fi

# Create database (if MariaDB is available)
if command -v mysql &> /dev/null; then
    echo "🗄️  Creating database..."
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rrcompanion;" 2>/dev/null || echo "Database 'rrcompanion' already exists or could not be created."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update apps/api/.env with your database credentials"
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "Or start individual services:"
echo "  API: npm run dev:api"
echo "  Web: npm run dev:web"
echo ""
echo "API will be available at: http://localhost:8000"
echo "Web app will be available at: http://localhost:3000"
echo ""
echo "Happy coding! 🎉" 