#!/bin/bash

# RRCompanion API Startup Script
# This script is used by systemd to start the Deno API service

# Set the working directory
cd /var/www/rrcompanion/apps/api

# Set environment variables
export HOME=/home/ubuntu
export PATH=/home/ubuntu/.deno/bin:$PATH
export NODE_ENV=production

# Start the Deno API server
exec /home/ubuntu/.deno/bin/deno run --allow-net --allow-env --allow-read --allow-write ./src/main.ts
