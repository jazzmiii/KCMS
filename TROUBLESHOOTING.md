# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ Issue 1: Backend API Errors (500, 400)

**Error Messages:**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**Cause:** Backend server is not running or not configured properly.

**Solution:**

1. **Start the Backend Server:**
```bash
cd Backend
npm install
npm run dev
```

2. **Check if Backend is Running:**
- Open browser: http://localhost:5000
- You should see a response (not an error page)

3. **Verify Environment Variables:**
```bash
# Check if Backend/.env exists
# If not, copy from .env.example
cd Backend
cp .env.example .env
# Edit .env with your configuration
```

4. **Check MongoDB and Redis:**
```bash
# MongoDB should be running on port 27017
# Redis should be running on port 6379

# Windows - Check if services are running:
# MongoDB: services.msc -> MongoDB Server
# Redis: Check if redis-server.exe is running
```

5. **Check Backend Logs:**
Look at the terminal where backend is running for error messages.

---

### ❌ Issue 2: React Router Warning

**Warning Message:**
```
Relative route resolution within Splat routes is changing in v7
```

**Cause:** React Router v6 deprecation warning for future v7.

**Solution:**
This is just a warning and won't affect functionality. To fix:

**Option 1: Ignore for now** (Recommended)
- The app will work fine
- Update when React Router v7 is released

**Option 2: Update Routes** (If you want to fix now)
Update `App.jsx`:

```javascript
// Change from:
<Route path="/clubs/create" element={...} />

// To:
<Route path="clubs/create" element={...} />
// (Remove leading slash for nested routes)
```

---

### ❌ Issue 3: Favicon 404 Error

**Error Message:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
favicon.ico:1
```

**Cause:** No favicon file in the project.

**Solution:**
This is not critical. The app works fine without it.

To add a favicon:
1. Create or download a favicon.ico file
2. Place it in `Frontend/public/` folder
3. Update `index.html`:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```

---

### ❌ Issue 4: Registration Fails (400 Bad Request)

**Error Message:**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
/api/auth/register
```

**Possible Causes:**
1. Backend validation errors
2. Missing required fields
3. Invalid email format
4. Roll number format incorrect

**Solution:**

1. **Check Roll Number Format:**
   - Must be: `22BD1A0501` (2 digits + 2 letters + 2 digits + 4 digits)
   - Example: 22BD1A0501, 21CS1A0123

2. **Check Email:**
   - Must be valid email format
   - Example: student@kmit.in

3. **Check Password:**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - At least 1 special character

4. **Check Backend Logs:**
   - Look at terminal running backend
   - Will show validation error details

---

### ❌ Issue 5: Cannot Connect to Backend

**Error Message:**
```
Network Error
AxiosError
```

**Cause:** Backend not running or wrong API URL.

**Solution:**

1. **Verify Backend is Running:**
```bash
# Should see: Server running on port 5000
cd Backend
npm run dev
```

2. **Check API URL in Frontend:**
```bash
# Frontend/.env or vite.config.js
VITE_API_URL=http://localhost:5000/api
```

3. **Check CORS Configuration:**
In `Backend/src/app.js`, ensure CORS allows localhost:3000:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### ❌ Issue 6: MongoDB Connection Error

**Error Message:**
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause:** MongoDB is not running.

**Solution:**

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod manually
mongod
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
```

**Verify:**
```bash
# Connect to MongoDB
mongosh
# or
mongo
```

---

### ❌ Issue 7: Redis Connection Error

**Error Message:**
```
Error: Redis connection to localhost:6379 failed
```

**Cause:** Redis is not running.

**Solution:**

**Windows:**
```bash
# Download Redis for Windows
# Run redis-server.exe
redis-server
```

**Linux/Mac:**
```bash
sudo systemctl start redis
# or
redis-server
```

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

---

### ❌ Issue 8: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:** Another process is using port 5000 or 3000.

**Solution:**

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

**Or Change Port:**
```bash
# Backend/.env
PORT=5001

# Frontend/vite.config.js
server: { port: 3001 }
```

---

## ✅ Quick Checklist

Before starting the application, ensure:

- [ ] Node.js 16+ installed
- [ ] MongoDB running on port 27017
- [ ] Redis running on port 6379
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend `.env` file configured
- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)

---

## 🔍 Debugging Steps

### 1. Check Backend Health
```bash
# Terminal 1: Start backend
cd Backend
npm run dev

# Should see:
# ✓ MongoDB connected
# ✓ Redis connected
# ✓ Server running on port 5000
```

### 2. Check Frontend Connection
```bash
# Terminal 2: Start frontend
cd Frontend
npm run dev

# Should see:
# VITE ready in XXXms
# Local: http://localhost:3000
```

### 3. Test API Endpoints
```bash
# Open browser or use curl
curl http://localhost:5000/api/health

# Should return: { status: 'ok' }
```

### 4. Check Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### 5. Check Backend Logs
- Look at terminal running backend
- Check for error messages
- Verify all services connected

---

## 📞 Still Having Issues?

1. **Check all services are running:**
   - MongoDB: `mongosh` should connect
   - Redis: `redis-cli ping` should return PONG
   - Backend: http://localhost:5000 should respond
   - Frontend: http://localhost:3000 should load

2. **Clear cache and restart:**
   ```bash
   # Stop all servers
   # Clear node_modules
   rm -rf node_modules package-lock.json
   npm install
   # Restart
   ```

3. **Check environment variables:**
   - Backend/.env has all required variables
   - Frontend API URL is correct

4. **Review logs:**
   - Backend terminal output
   - Browser console
   - MongoDB logs
   - Redis logs

---

## 🎯 Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Backend errors | Start backend: `cd Backend && npm run dev` |
| MongoDB error | Start MongoDB service |
| Redis error | Start Redis service |
| Port in use | Kill process or change port |
| API not found | Check backend is running on port 5000 |
| CORS error | Check CORS config in backend |
| 400 errors | Check input validation (roll number, email, password) |
| 500 errors | Check backend logs for details |

---

**Remember:** Most issues are caused by backend not running or services (MongoDB/Redis) not started!
