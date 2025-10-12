# 🚀 Quick Start Guide

## Step-by-Step Setup (5 Minutes)

### ✅ Prerequisites Check

Before starting, verify you have:
- [ ] Node.js 16+ installed (`node --version`)
- [ ] MongoDB installed and running
- [ ] Redis installed and running
- [ ] Git (optional)

---

## 🎯 Setup Steps

### Step 1: Start MongoDB
```bash
# Windows
net start MongoDB
# or
mongod

# Linux/Mac
sudo systemctl start mongod

# Verify
mongosh
# Should connect successfully
```

### Step 2: Start Redis
```bash
# Windows
redis-server

# Linux/Mac
sudo systemctl start redis

# Verify
redis-cli ping
# Should return: PONG
```

### Step 3: Setup Backend
```bash
# Open Terminal 1
cd Backend

# Install dependencies (first time only)
npm install

# Create .env file
# Copy .env.example to .env and configure

# Start backend
npm run dev

# ✅ Should see:
# MongoDB connected
# Redis connected  
# Server running on port 5000
```

### Step 4: Setup Frontend
```bash
# Open Terminal 2 (new terminal)
cd Frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev

# ✅ Should see:
# VITE ready
# Local: http://localhost:3000
```

### Step 5: Access Application
```
Open browser: http://localhost:3000
```

---

## 🎉 You're Ready!

### First Steps:

1. **Register a New Account**
   - Click "Get Started" or "Register"
   - Enter roll number (format: 22BD1A0501)
   - Enter email and password
   - Verify OTP (check email)
   - Complete profile

2. **Explore the App**
   - Browse clubs
   - View events
   - Check recruitments

3. **Create Admin User** (Optional)
   ```javascript
   // Connect to MongoDB
   mongosh
   
   // Switch to database
   use kmit-clubs-hub
   
   // Update user to admin
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { globalRoles: ["admin"] } }
   )
   ```

---

## 🔧 If Something Goes Wrong

### Backend Not Starting?
```bash
# Check MongoDB
mongosh

# Check Redis
redis-cli ping

# Check port 5000 is free
netstat -ano | findstr :5000
```

### Frontend Not Loading?
```bash
# Check backend is running
curl http://localhost:5000

# Check port 3000 is free
netstat -ano | findstr :3000

# Clear cache and reinstall
rm -rf node_modules
npm install
```

### See Errors in Browser?
- Open DevTools (F12)
- Check Console tab
- Check Network tab
- See TROUBLESHOOTING.md for solutions

---

## 📝 Environment Variables

### Backend/.env (Required)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kmit-clubs-hub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-change-this
REFRESH_TOKEN_EXPIRY=7d
```

### Frontend/.env (Optional)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🎯 Quick Commands

### Start Everything
```bash
# Terminal 1: Backend
cd Backend && npm run dev

# Terminal 2: Frontend  
cd Frontend && npm run dev
```

### Stop Everything
```
Ctrl + C in both terminals
```

### Restart
```bash
# Stop both servers
# Then start again
```

---

## 📚 Next Steps

- Read `SETUP_GUIDE.md` for detailed setup
- Read `TROUBLESHOOTING.md` if you face issues
- Read `DASHBOARDS_GUIDE.md` to understand dashboards
- Read `README.md` for project overview

---

## ✨ Tips

1. **Keep both terminals open** - One for backend, one for frontend
2. **Check backend logs** - Most errors show here
3. **Use browser DevTools** - F12 to see frontend errors
4. **MongoDB and Redis must run** - Backend won't start without them

---

**Happy Coding! 🚀**
