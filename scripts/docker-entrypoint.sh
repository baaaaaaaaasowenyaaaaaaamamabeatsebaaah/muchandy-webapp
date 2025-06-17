#!/bin/sh
set -e

echo "🚀 Starting Muchandy webapp..."
echo "📍 Environment: ${NODE_ENV:-development}"
echo "🗄️ Database URL: ${DATABASE_URL:-file:./dev.db}"

# Check critical environment variables
if [ -z "$VITE_STORYBLOK_TOKEN" ]; then
    echo "⚠️ WARNING: VITE_STORYBLOK_TOKEN not set - Storyblok content will not load!"
fi

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy || {
    echo "⚠️ Migration failed, creating new database..."
    npx prisma db push
}

# Start the server with environment variables
echo "🌐 Starting Express server..."
exec node server.js