# Redis Setup Guide

## Problem
BullMQ requires Redis version 5.0.0 or higher. Windows comes with Redis 3.0.504 which is incompatible.

## Solutions

### Option 1: Docker (Recommended)

**Prerequisites:** Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**Steps:**
1. Start Redis using Docker Compose:
   ```bash
   docker-compose up -d redis
   ```

2. Verify Redis is running:
   ```bash
   docker ps
   ```

3. Your `.env` file should have:
   ```
   REDIS_URL=redis://localhost:6379
   ```

4. To stop Redis:
   ```bash
   docker-compose down
   ```

5. To view Redis logs:
   ```bash
   docker logs kmit-redis
   ```

### Option 2: Upstash (Cloud Redis - Free Tier Available)

**Steps:**
1. Sign up at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Copy the connection URL (format: `rediss://default:password@host:port`)
4. Update your `.env` file:
   ```
   REDIS_URL=rediss://default:your-password@your-host.upstash.io:6379
   ```

### Option 3: Memurai (Windows Native)

**Steps:**
1. Download [Memurai](https://www.memurai.com/get-memurai) (Redis-compatible for Windows)
2. Install and start Memurai service
3. Your `.env` file should have:
   ```
   REDIS_URL=redis://localhost:6379
   ```

### Option 4: WSL2 with Redis

**Steps:**
1. Install WSL2 and Ubuntu
2. In Ubuntu terminal:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```
3. Your `.env` file should have:
   ```
   REDIS_URL=redis://localhost:6379
   ```

## Verification

After setting up Redis, verify the version:

**For Docker:**
```bash
docker exec kmit-redis redis-cli INFO server | findstr redis_version
```

**For local Redis:**
```bash
redis-cli INFO server | findstr redis_version
```

The version should be **5.0.0 or higher** (Docker setup uses Redis 7).

## Troubleshooting

### Connection Refused
- Ensure Redis is running: `docker ps` or `redis-cli ping`
- Check if port 6379 is available: `netstat -an | findstr 6379`

### Authentication Failed
- For Upstash, ensure you're using the correct URL with password
- For local Redis, check if password is required in redis.conf

### BullMQ Still Failing
- Restart your Node.js application after changing Redis
- Clear node_modules and reinstall: `npm install`
- Check logs for specific error messages
