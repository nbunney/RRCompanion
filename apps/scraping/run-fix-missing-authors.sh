#!/bin/bash

# Fix Missing Authors Script
# This script will find all fictions with missing author data and update them

echo "🚀 Starting Missing Authors Fix Script..."
echo ""

# Load environment variables if .env file exists
if [ -f .env ]; then
  echo "📝 Loading environment variables from .env file..."
  # Export variables while filtering out comments and invalid lines
  set -a
  while IFS= read -r line; do
    # Skip empty lines, comments, and lines that don't look like variable assignments
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# && "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      eval "export $line"
    fi
  done < .env
  set +a
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set up your .env file with DATABASE_URL"
  echo "Format: mysql://user:password@host:port/database"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

echo "🏃 Running fix script..."
npx ts-node fix-missing-authors.ts

