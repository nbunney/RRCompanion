#!/bin/bash

# Fix Deno permissions script
# This script fixes permission issues with the Deno binary

echo "🔧 Fixing Deno permissions..."

# Fix ownership and permissions for the entire Deno directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/.deno/
sudo chmod -R 755 /home/ubuntu/.deno/

# Make sure the Deno binary is executable
sudo chmod +x /home/ubuntu/.deno/bin/deno
sudo chown ubuntu:ubuntu /home/ubuntu/.deno/bin/deno

# Test if Deno is now accessible
echo "🧪 Testing Deno access..."
if /home/ubuntu/.deno/bin/deno --version; then
    echo "✅ Deno is now accessible!"
else
    echo "❌ Deno still has permission issues"
    ls -la /home/ubuntu/.deno/bin/deno
fi

echo "🔧 Permission fix completed!"
