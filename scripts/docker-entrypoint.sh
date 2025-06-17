#!/bin/sh
set -e

echo "🚀 Starting Muchandy webapp..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "🗄️ Database URL: ${DATABASE_URL:-file:./dev.db}"

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Migration failed, creating new database..."
    npx prisma db push
}

# Start the server
echo "🌐 Starting Express server..."
exec node server.js