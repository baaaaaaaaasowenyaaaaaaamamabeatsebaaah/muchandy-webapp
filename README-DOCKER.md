# Docker Deployment Guide for Muchandy Webapp

This guide covers deploying the Muchandy webapp using Docker, with specific instructions for Railway deployment and SQLite database management.

## 🐳 Docker Overview

The Muchandy webapp is containerized with:

- Multi-stage build for optimal image size
- SQLite database persistence via Docker volumes
- Puppeteer/Chromium support for web scraping
- Non-root user for security
- Automatic health checks
- Railway deployment configuration

## 📁 Docker Files Structure

```
muchandy-webapp/
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Local development orchestration
├── .dockerignore          # Build exclusions
├── railway.json           # Railway deployment config
└── scripts/
    ├── docker-entrypoint.sh    # Container startup script
    └── setup-docker-env.js     # Environment setup helper
```

## 🚀 Quick Start

### Local Development with Docker

1. **Build the Docker image:**

   ```bash
   chmod +x docker-build.sh
   ./docker-build.sh
   ```

2. **Run with docker-compose:**

   ```bash
   docker-compose up -d
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f app
   ```

4. **Access the application:**

   - API Server: http://localhost:3001
   - Health Check: http://localhost:3001/health

5. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Manual Docker Commands

```bash
# Build image
docker build -t muchandy-webapp:latest .

# Run container
docker run -d \
  --name muchandy-app \
  -p 3001:3001 \
  -v muchandy_data:/app/data \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -e NODE_ENV=production \
  -e VITE_STORYBLOK_TOKEN="${VITE_STORYBLOK_TOKEN}" \
  muchandy-webapp:latest

# Stop container
docker stop muchandy-app

# Remove container
docker rm muchandy-app
```

## 🚂 Railway Deployment

### Prerequisites

- Railway account
- Railway CLI installed
- GitHub repository connected

### Environment Variables

Set these in your Railway project dashboard:

| Variable                  | Description                     | Example                |
| ------------------------- | ------------------------------- | ---------------------- |
| `VITE_STORYBLOK_TOKEN`    | Storyblok preview token         | `your-token-here`      |
| `VITE_STORYBLOK_VERSION`  | Content version                 | `published` or `draft` |
| `VITE_STORYBLOK_SPACE_ID` | Storyblok space ID              | `123456`               |
| `NODE_ENV`                | Environment                     | `production`           |
| `PORT`                    | Server port (Railway sets this) | `3001`                 |

### Deployment Steps

1. **Connect your GitHub repository to Railway**

2. **Railway will auto-detect the Dockerfile**

3. **Set environment variables in Railway dashboard**

4. **Deploy:**

   ```bash
   railway up
   ```

5. **The SQLite database persists in Railway's volume** at `/app/data`

### Railway Configuration

The `railway.json` file configures:

- Dockerfile-based builds
- Health check endpoint
- Restart policies
- Single replica deployment

## 💾 Database Management

### SQLite in Docker

The SQLite database is stored in a Docker volume for persistence:

- **Location in container:** `/app/data/prod.db`
- **Volume name:** `sqlite_data` (docker-compose) or Railway's persistent storage

### Database Operations

**Access SQLite shell in container:**

```bash
docker exec -it muchandy-app sqlite3 /app/data/prod.db
```

**Run Prisma migrations:**

```bash
docker exec -it muchandy-app npx prisma migrate deploy
```

**View Prisma Studio (development only):**

```bash
# Not available in production for security
docker exec -it muchandy-app npx prisma studio
```

### Backup & Restore

**Backup database:**

```bash
# From running container
docker cp muchandy-app:/app/data/prod.db ./backup-$(date +%Y%m%d-%H%M%S).db

# Using docker-compose
docker-compose exec app sqlite3 /app/data/prod.db ".backup '/tmp/backup.db'"
docker cp $(docker-compose ps -q app):/tmp/backup.db ./backup.db
```

**Restore database:**

```bash
# Stop the app first
docker-compose stop app

# Copy backup to container
docker cp ./backup.db muchandy-app:/app/data/prod.db

# Restart
docker-compose start app
```

**Export data as SQL:**

```bash
docker exec muchandy-app sqlite3 /app/data/prod.db .dump > backup.sql
```

## 🕷️ Web Scraping with Puppeteer

The Docker image includes Chromium for Puppeteer-based web scraping:

- **Chromium path:** `/usr/bin/chromium-browser`
- **Environment variable:** `PUPPETEER_EXECUTABLE_PATH` (set automatically)
- **No additional setup required**

### Running the Crawler

```bash
# Execute crawler in container
docker exec -it muchandy-app npm run crawl

# Schedule with cron (add to Dockerfile)
RUN echo "0 2 * * * cd /app && npm run crawl" | crontab -
```

## 🔍 Troubleshooting

### Common Issues

**1. Database locked error:**

- Ensure only one app instance is running
- Check for zombie processes: `docker exec muchandy-app ps aux`

**2. Puppeteer fails to start:**

- Check Chromium installation: `docker exec muchandy-app chromium-browser --version`
- Verify environment variable: `docker exec muchandy-app env | grep PUPPETEER`

**3. Permission errors:**

- Ensure proper ownership: `docker exec muchandy-app ls -la /app/data`
- The app runs as user `nodejs` (UID 1001)

**4. Health check failing:**

```bash
# Check health endpoint
curl http://localhost:3001/health

# View detailed logs
docker logs muchandy-app --tail 100

# Check database connection
docker exec muchandy-app node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect().then(() => console.log('DB connected')).catch(console.error);
"
```

### Debug Commands

```bash
# Enter container shell
docker exec -it muchandy-app sh

# Check environment
docker exec muchandy-app env

# View running processes
docker exec muchandy-app ps aux

# Check disk usage
docker exec muchandy-app df -h

# Test database
docker exec muchandy-app sqlite3 /app/data/prod.db "SELECT COUNT(*) FROM manufacturer;"
```

## 📊 Monitoring

### Health Checks

The container includes automatic health checks:

- **Endpoint:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Retries:** 3

### Logs

```bash
# All logs
docker logs muchandy-app

# Follow logs
docker logs -f muchandy-app

# Last 100 lines
docker logs --tail 100 muchandy-app

# With timestamps
docker logs -t muchandy-app
```

### Resource Usage

```bash
# Container stats
docker stats muchandy-app

# Detailed inspection
docker inspect muchandy-app
```

## 🔒 Security Best Practices

1. **Non-root user:** The app runs as `nodejs` user (UID 1001)
2. **Read-only filesystem:** Consider adding `readOnlyRootFilesystem: true` for extra security
3. **Environment variables:** Never commit `.env` files
4. **Network isolation:** Use Docker networks for multi-container setups
5. **Resource limits:** Set memory and CPU limits in production

### Production Hardening

Add to `docker-compose.yml`:

```yaml
services:
  app:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
```

## 🔄 Updates & Maintenance

### Updating the Application

1. **Pull latest code:**

   ```bash
   git pull origin main
   ```

2. **Rebuild image:**

   ```bash
   docker-compose build --no-cache
   ```

3. **Update container:**
   ```bash
   docker-compose up -d
   ```

### Updating Dependencies

```bash
# Update Node dependencies
docker exec muchandy-app npm update

# Update Prisma
docker exec muchandy-app npm update @prisma/client prisma
docker exec muchandy-app npx prisma generate
```

## 📝 Environment Variables Reference

| Variable                    | Default         | Description                        |
| --------------------------- | --------------- | ---------------------------------- |
| `NODE_ENV`                  | `development`   | Environment mode                   |
| `PORT`                      | `3001`          | Express server port                |
| `DATABASE_URL`              | `file:./dev.db` | SQLite database path               |
| `VITE_STORYBLOK_TOKEN`      | -               | Storyblok API token (required)     |
| `VITE_STORYBLOK_VERSION`    | `published`     | Content version                    |
| `VITE_STORYBLOK_SPACE_ID`   | -               | Storyblok space ID                 |
| `PUPPETEER_EXECUTABLE_PATH` | -               | Chromium path (auto-set in Docker) |

## 🤝 Support

For issues specific to Docker deployment:

1. Check container logs first
2. Verify environment variables
3. Test database connectivity
4. Ensure volume permissions

For Railway-specific issues:

- Check Railway dashboard logs
- Verify environment variables in Railway
- Ensure build completes successfully
- Check persistent volume status
