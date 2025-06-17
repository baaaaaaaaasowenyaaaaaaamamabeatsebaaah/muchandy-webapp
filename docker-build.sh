#!/bin/bash
# Docker build script with proper error handling

set -e

echo "🐳 Building Muchandy Docker image..."

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Build the Docker image
docker build -t muchandy-webapp:latest .

echo "✅ Docker image built successfully"

# Optional: Run locally for testing
if [ "$1" = "--run" ]; then
    echo "🚀 Starting container..."
    docker run -d \
        --name muchandy-app \
        -p 3001:3001 \
        -v muchandy_data:/app/data \
        -e DATABASE_URL="file:/app/data/prod.db" \
        -e NODE_ENV=production \
        -e VITE_STORYBLOK_TOKEN="${VITE_STORYBLOK_TOKEN}" \
        -e VITE_STORYBLOK_VERSION="${VITE_STORYBLOK_VERSION:-published}" \
        -e VITE_STORYBLOK_SPACE_ID="${VITE_STORYBLOK_SPACE_ID}" \
        muchandy-webapp:latest
    
    echo "✅ Container started"
    echo "🌐 Access the app at http://localhost:3001"
    echo "📊 View logs: docker logs -f muchandy-app"
fi