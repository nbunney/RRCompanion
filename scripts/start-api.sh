#!/bin/bash

# RRCompanion API Startup Script
# This script is used by systemd to start the Deno API service

set -e  # Exit on any error

# Set the working directory
cd /var/www/rrcompanion/apps/api

# Set environment variables
export HOME=/home/ubuntu
export PATH=/home/ubuntu/.deno/bin:$PATH
export NODE_ENV=production

# Debug: Print current state
echo "Starting RRCompanion API..."
echo "Working directory: $(pwd)"
echo "Deno path: $(which deno)"
echo "Deno version: $(deno --version)"

# Start the Deno API server with absolute paths
exec /home/ubuntu/.deno/bin/deno run --allow-net --allow-env --allow-read --allow-write /var/www/rrcompanion/apps/api/src/main.ts
