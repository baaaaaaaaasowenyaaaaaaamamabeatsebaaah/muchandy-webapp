# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

# Install build dependencies for Prisma and Puppeteer
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) for building
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs src ./src

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Make entrypoint script executable
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh

COPY --chown=nodejs:nodejs prisma/dev.db /app/data/prod.db

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001

# Add health check with more time
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
    CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Direct startup with detailed logging
CMD ["sh", "-c", "echo '🚀 Starting container...' && \
     echo '📁 Current directory:' && pwd && \
     echo '📋 Files in directory:' && ls -la && \
     echo '🗄️ Database URL: '${DATABASE_URL} && \
     echo '🔧 Running Prisma migrations...' && \
     npx prisma migrate deploy --skip-generate || \
     (echo '⚠️ Migrations failed, trying db push...' && npx prisma db push --skip-generate) && \
     echo '✅ Database ready' && \
     echo '🌐 Starting server on port '${PORT:-3001} && \
     node server.js"]