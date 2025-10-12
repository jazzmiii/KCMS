# 🔐 Get Your OTP - Quick Guide

## Your Account
- **Email:** chowpavithra48@gmail.com
- **Roll Number:** 22BD1A0502
- **Status:** Registered, OTP not verified

---

## Method 1: Get OTP from Redis (Fastest)

### Step 1: Open Command Prompt
```bash
redis-cli
```

### Step 2: Get OTP
```bash
GET "otp:reg:chowpavithra48@gmail.com"
```

### Step 3: Use the OTP
- If it returns a 6-digit number → Use it!
- If it returns `(nil)` → OTP expired, need to re-register

### Step 4: Exit Redis
```bash
exit
```

---

## Method 2: Delete Account and Re-register

### Step 1: Delete Your Account
```bash
# Open command prompt
mongosh

# Switch to database
use kmit-clubs-hub

# Delete your user
db.users.deleteOne({ email: "chowpavithra48@gmail.com" })

# Exit
exit
```

### Step 2: Fix Backend to Show OTP
Follow instructions in `Backend/EMAIL_FIX.md`

### Step 3: Register Again
- Go to: http://localhost:3000/register
- Use: chowpavithra48@gmail.com
- Use: 22BD1A0502
- Submit

### Step 4: Check Backend Terminal
Look for:
```
========================================
🔐 REGISTRATION OTP
========================================
Email: chowpavithra48@gmail.com
OTP Code: 123456
========================================
```

### Step 5: Verify OTP
- Go to: http://localhost:3000/verify-otp
- Enter email and OTP
- Click Verify

---

## Method 3: Register with New Email (Easiest)

### Just use a different email:
- Email: any-other-email@gmail.com
- Roll Number: 22BD1A0503 (different from before)
- Register
- Check backend terminal for OTP
- Verify and complete profile
- Login

---

## Quick Commands

### Check if OTP exists:
```bash
redis-cli GET "otp:reg:chowpavithra48@gmail.com"
```

### Delete your account:
```bash
mongosh --eval 'use kmit-clubs-hub; db.users.deleteOne({email:"chowpavithra48@gmail.com"})'
```

### Check your account status:
```bash
mongosh --eval 'use kmit-clubs-hub; db.users.findOne({email:"chowpavithra48@gmail.com"}, {status:1, email:1})'
```

---

## Recommended Approach

**For fastest results:**

1. **Try Method 1 first** (get OTP from Redis)
   - Takes 30 seconds
   - If OTP exists, use it immediately

2. **If OTP expired, use Method 2** (delete and re-register)
   - Takes 5 minutes
   - Requires editing backend code
   - Shows OTP in terminal

3. **If you want fresh start, use Method 3** (new email)
   - Takes 2 minutes
   - No code changes needed
   - Just use different email

---

## What Happens Next

After getting OTP and verifying:

1. ✅ OTP Verified
2. → Complete Profile page
3. → Fill in your details
4. → Profile Complete
5. → Login page
6. → Enter credentials
7. ✅ Dashboard!

---

**Choose the method that works best for you!** 🚀
