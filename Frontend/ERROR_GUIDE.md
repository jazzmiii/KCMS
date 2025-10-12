# 🔍 Error Messages Guide

## Understanding Backend Errors

### ✅ Registration Errors

#### 409 Conflict
**Message:** "This email or roll number is already registered"
**Meaning:** You've already created an account with this email/roll number
**Solution:** 
- Use the Login page instead
- Or use a different email/roll number

#### 400 Bad Request
**Meaning:** Form validation failed
**Common Causes:**
- Roll number format wrong (should be: 22BD1A0501)
- Password doesn't meet requirements
- Email format invalid
**Solution:** Check all fields match the requirements

---

### ✅ Login Errors

#### 403 Forbidden
**Message:** "Invalid credentials or account not verified"
**Meaning:** Either:
1. Wrong email/password, OR
2. You haven't verified your OTP yet
**Solution:**
- Check your email/password
- If you just registered, complete OTP verification first
- Check email for OTP code

#### 401 Unauthorized
**Message:** "Invalid email/roll number or password"
**Meaning:** Credentials don't match
**Solution:**
- Double-check your email or roll number
- Verify password is correct
- Use "Forgot Password" if needed

---

### ✅ Events API Errors

#### 500 Internal Server Error
**Endpoint:** `/api/events?limit=4&status=published`
**Meaning:** Backend has a bug or database issue
**Common Causes:**
1. Events collection is empty
2. Invalid data in database
3. Missing references (clubId, etc.)
4. Backend code error

**Solution:**
This is a backend issue. The frontend is working correctly.

**Temporary Fix:**
The HomePage already handles this gracefully - it will show empty events instead of crashing.

---

## 🎯 Current Status Summary

### What's Working ✅
- Frontend is running correctly
- Backend is responding
- Error messages are clear
- Registration form validation
- Login form validation

### What Needs Attention ⚠️
- **Events API 500 Error**: Backend issue, needs backend fix
- **User Registration**: If you see 409, you're already registered - just login
- **Login 403**: Make sure you completed OTP verification

---

## 📋 Step-by-Step: First Time User

### 1. Register
```
1. Go to Register page
2. Enter roll number (format: 22BD1A0501)
3. Enter email
4. Create password (8+ chars, uppercase, lowercase, number, special char)
5. Confirm password
6. Click Register
```

### 2. Verify OTP
```
1. Check your email for OTP code
2. Enter the 6-digit code
3. Click Verify
```

### 3. Complete Profile
```
1. Enter your name
2. Select department
3. Enter batch and year
4. Add phone (optional)
5. Click Complete Profile
```

### 4. Login
```
1. Enter email or roll number
2. Enter password
3. Click Login
4. You'll be redirected to your dashboard
```

---

## 🐛 If You're Stuck

### "I can't register - getting 409 error"
→ You already have an account. Go to Login page.

### "I can't login - getting 403 error"
→ Did you complete OTP verification? Check your email.

### "I don't see any events"
→ This is normal if the database is empty. The 500 error is a backend issue but won't affect your ability to use the app.

### "I forgot my password"
→ Click "Forgot Password" on login page and follow the steps.

---

## ✨ Tips

1. **Save your credentials** - Write down your email and password
2. **Check email** - OTP codes are sent to your email
3. **Use correct format** - Roll number must match pattern: 22BD1A0501
4. **Strong password** - Must have uppercase, lowercase, number, and special character
5. **Complete all steps** - Register → Verify OTP → Complete Profile → Login

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Registration redirects to OTP page
- ✅ OTP verification redirects to Complete Profile
- ✅ Profile completion redirects to Login
- ✅ Login redirects to Dashboard
- ✅ You see your name in the top-right corner

---

**The app is working! The only issue is the Events API which is a backend problem, not frontend.** 🚀
