# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

# Install build dependencies for Prisma
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

# Install ALL dependencies for building
RUN npm ci

# Copy application code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_STORYBLOK_TOKEN
ARG VITE_STORYBLOK_VERSION
ARG VITE_STORYBLOK_SPACE_ID

# Set build-time environment variables
ENV VITE_STORYBLOK_TOKEN=$VITE_STORYBLOK_TOKEN
ENV VITE_STORYBLOK_VERSION=$VITE_STORYBLOK_VERSION
ENV VITE_STORYBLOK_SPACE_ID=$VITE_STORYBLOK_SPACE_ID

# Generate Prisma client
RUN npx prisma generate

# Build the application with environment variables
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

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --force && npx prisma generate

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs src ./src

# Create directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Copy database files
COPY --chown=nodejs:nodejs prisma/dev.db /app/data/prod.db
COPY --chown=nodejs:nodejs prisma/dev.db-journal /app/data/prod.db-journal

# Copy entrypoint script
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
    CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use entrypoint script
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]