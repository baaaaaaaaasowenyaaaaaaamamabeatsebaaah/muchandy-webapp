#!/bin/sh
set -e

echo "🚀 Starting Muchandy webapp..."

# Check if database exists
if [ ! -f "/app/data/prod.db" ]; then
    echo "📦 Creating new database..."
    npx prisma migrate deploy
    echo "✅ Database created"
else
    echo "📊 Database exists, running migrations..."
    npx prisma migrate deploy
    echo "✅ Migrations complete"
fi

# Start the server
echo "🌐 Starting Express server on port ${PORT:-3001}..."
exec node server.js