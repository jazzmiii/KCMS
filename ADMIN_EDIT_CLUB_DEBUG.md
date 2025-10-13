# 🐛 Admin Cannot Edit Club - Debugging Guide

**Issue:** Admin user cannot edit/update club settings  
**Expected:** Admin should have full access to all clubs

---

## ✅ **Code Analysis - Permissions Are CORRECT**

### **Route Configuration** (`club.routes.js` line 46-53)
```javascript
router.patch(
  '/:clubId/settings',
  authenticate,
  requireEither(['admin'], ['president']), // ✅ Admin is allowed
  validate(v.clubId, 'params'),
  validate(v.updateSettings),
  ctrl.updateSettings
);
```

### **Permission Middleware** (`permission.js` lines 55-59)
```javascript
// Check global roles first (if specified)
if (global.length > 0) {
  const hasGlobal = checkGlobalRole(req.user, global);
  if (hasGlobal) {
    return next(); // ✅ Admin role allows immediate access
  }
}
```

**Conclusion:** The backend code is correct. Admin should pass through.

---

## 🔍 **Root Causes (Most Likely → Least Likely)**

### **1. Admin User Doesn't Have 'admin' Global Role** ⭐⭐⭐⭐⭐

**Problem:** User account in database doesn't have `roles.global = 'admin'`

**Check:**
```javascript
// In MongoDB or Mongoose console
db.users.findOne({ email: 'admin@kmit.in' })

// Should show:
{
  email: "admin@kmit.in",
  roles: {
    global: "admin",  // ← Must be exactly "admin"
    scoped: []
  }
}
```

**Fix:**
```javascript
// Update user to have admin role
db.users.updateOne(
  { email: 'admin@kmit.in' },
  { $set: { 'roles.global': 'admin' } }
)
```

---

### **2. JWT Token Doesn't Include Role** ⭐⭐⭐⭐

**Problem:** When user logs in, JWT token doesn't include role information

**Check:**
1. Open browser DevTools → Application → Local Storage
2. Find `token` key
3. Copy token value
4. Go to https://jwt.io
5. Paste token
6. Check payload for:
```json
{
  "id": "userId",
  "email": "admin@kmit.in",
  "roles": {
    "global": "admin"  // ← This must be present
  }
}
```

**Fix:** Check auth service token generation:
```javascript
// Backend/src/modules/auth/auth.service.js
// Should include:
const payload = {
  id: user._id,
  email: user.email,
  roles: user.roles  // ← Must include roles
};
```

---

### **3. Case Sensitivity Issue** ⭐⭐⭐

**Problem:** Role is stored as 'Admin' but checked as 'admin'

**Check:**
```javascript
// In permission.js line 14-17
function checkGlobalRole(user, allowed = []) {
  if (!user || !user.roles || !user.roles.global) return false;
  const role = normalizeRole(user.roles.global);
  return allowed.some(a => a === role);  // ← Exact match required
}
```

**Fix:** Ensure role is lowercase:
```javascript
db.users.updateOne(
  { email: 'admin@kmit.in' },
  { $set: { 'roles.global': 'admin' } }  // lowercase 'admin'
)
```

---

### **4. Token Expired or Invalid** ⭐⭐

**Problem:** Old token doesn't have updated role information

**Fix:**
1. Logout completely
2. Clear browser localStorage
3. Login again
4. Try editing club

---

### **5. Frontend Not Sending Token** ⭐⭐

**Problem:** Authorization header missing in API request

**Check:**
```javascript
// Browser DevTools → Network tab
// Click on PATCH request to /clubs/:id/settings
// Check Headers:
Authorization: Bearer <token>  // ← Must be present
```

**Fix:** Check `api.js` interceptor:
```javascript
// Frontend/src/services/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🛠️ **Step-by-Step Debugging**

### **Step 1: Verify Database**
```javascript
// MongoDB Shell or Compass
db.users.findOne({ email: 'admin@kmit.in' })

// Expected output:
{
  _id: ObjectId("..."),
  email: "admin@kmit.in",
  password: "$2a$10$...",
  roles: {
    global: "admin",  // ✅ MUST BE HERE
    scoped: []
  },
  profile: { ... },
  verified: true
}
```

**If `roles.global` is missing or wrong:**
```javascript
db.users.updateOne(
  { email: 'admin@kmit.in' },
  { $set: { 'roles.global': 'admin' } }
)
```

---

### **Step 2: Verify JWT Token**
```javascript
// 1. Login as admin
// 2. Open DevTools Console
console.log(localStorage.getItem('token'));

// 3. Copy token
// 4. Decode at https://jwt.io
// 5. Check payload has:
{
  "id": "...",
  "roles": {
    "global": "admin"  // ✅ MUST BE HERE
  }
}
```

**If roles missing from token, check auth service:**
```javascript
// Backend/src/modules/auth/auth.service.js
// Find login function, ensure:
const token = jwt.sign(
  { 
    id: user._id.toString(),
    email: user.email,
    roles: user.roles  // ✅ Include roles
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

### **Step 3: Test API Directly**

Use Postman or curl to test:

```bash
# 1. Login to get token
POST http://localhost:5000/api/auth/login
Body: {
  "email": "admin@kmit.in",
  "password": "your_password"
}

# Response will have token

# 2. Test club update
PATCH http://localhost:5000/api/clubs/<clubId>/settings
Headers:
  Authorization: Bearer <your_token>
  Content-Type: application/json
Body: {
  "description": "Updated description test"
}
```

**Expected Response:**
- ✅ Status 200 - Success
- ❌ Status 403 - Permission issue (roles not set)
- ❌ Status 401 - Auth issue (token invalid)

---

### **Step 4: Check Backend Logs**

Add debug logging to permission middleware:

```javascript
// Backend/src/middlewares/permission.js
// In checkGlobalRole function (line 14):
function checkGlobalRole(user, allowed = []) {
  console.log('🔍 Checking global role:', {
    userRole: user?.roles?.global,
    allowed: allowed,
    hasRole: allowed.some(a => a === user?.roles?.global)
  });
  
  if (!user || !user.roles || !user.roles.global) return false;
  const role = normalizeRole(user.roles.global);
  return allowed.some(a => a === role);
}
```

**Watch server console when trying to edit:**
```
🔍 Checking global role: {
  userRole: 'admin',  // Should show 'admin'
  allowed: ['admin'],
  hasRole: true       // Should be true
}
```

---

## ✅ **Quick Fix Script**

Run this in MongoDB shell to ensure admin has proper role:

```javascript
// Connect to MongoDB
use KCMS

// Update admin user
db.users.updateOne(
  { email: 'admin@kmit.in' },
  { 
    $set: { 
      'roles.global': 'admin',
      'verified': true
    } 
  }
)

// Verify
db.users.findOne(
  { email: 'admin@kmit.in' },
  { email: 1, roles: 1, verified: 1 }
)

// Should output:
// {
//   _id: ObjectId("..."),
//   email: "admin@kmit.in",
//   roles: { global: "admin", scoped: [] },
//   verified: true
// }
```

**Then:**
1. Logout from frontend
2. Clear browser localStorage
3. Login again
4. Try editing club

---

## 🧪 **Test Cases**

### **Test 1: Admin Edits Public Fields**
```javascript
// Should work immediately
PATCH /api/clubs/:clubId/settings
Body: {
  "description": "New description",
  "vision": "New vision"
}

Expected: ✅ 200 OK, changes applied immediately
```

### **Test 2: Admin Edits Protected Fields**
```javascript
// Should create pending changes
PATCH /api/clubs/:clubId/settings
Body: {
  "name": "New Club Name"
}

Expected: ✅ 200 OK, stored in pendingSettings
Then: POST /api/clubs/:clubId/settings/approve (admin can approve own changes)
```

### **Test 3: Admin Views Any Club**
```javascript
GET /api/clubs/:clubId

Expected: ✅ 200 OK, full club data
```

---

## 📊 **Expected Behavior**

| Action | Admin | President | Coordinator | Student |
|--------|-------|-----------|-------------|---------|
| Edit Public Fields | ✅ Immediate | ✅ Immediate | ❌ No | ❌ No |
| Edit Protected Fields | ✅ + Can approve | ✅ Needs approval | ❌ No | ❌ No |
| Approve Settings | ✅ All clubs | ❌ No | ✅ Assigned club | ❌ No |
| View Club | ✅ All clubs | ✅ Own club | ✅ Assigned club | ✅ Public info |
| Delete Club | ✅ All clubs | ✅ Own club | ❌ No | ❌ No |

---

## 🎯 **Most Likely Issue**

Based on typical problems:

**90% chance:** Admin user in database doesn't have `roles.global = 'admin'`

**Quick verification:**
```bash
# In mongo shell
db.users.findOne({ email: 'admin@kmit.in' }).roles
```

**If it shows:**
```javascript
null  // ← ISSUE: No roles object
```

or

```javascript
{ global: "student", scoped: [] }  // ← ISSUE: Wrong role
```

or

```javascript
{ global: "Admin", scoped: [] }  // ← ISSUE: Capital A
```

**Fix:**
```javascript
db.users.updateOne(
  { email: 'admin@kmit.in' },
  { $set: { 'roles.global': 'admin' } }
)
```

**Then logout, login, and try again.**

---

## 🆘 **If Still Not Working**

### **Nuclear Option: Create Fresh Admin User**

```javascript
// Backend - Run this script
const bcrypt = require('bcryptjs');
const { User } = require('./src/modules/auth/user.model');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const admin = await User.create({
    email: 'admin@kmit.in',
    password: hashedPassword,
    roles: {
      global: 'admin',  // ✅ Correct role
      scoped: []
    },
    profile: {
      name: 'System Admin',
      phone: '1234567890'
    },
    verified: true
  });
  
  console.log('Admin created:', admin);
}

createAdmin();
```

---

## 📝 **Summary Checklist**

Before demo, verify:

- [ ] Admin user exists in database
- [ ] `roles.global` = `'admin'` (lowercase)
- [ ] User is `verified: true`
- [ ] Login generates JWT with roles in payload
- [ ] Token stored in localStorage
- [ ] API requests include Authorization header
- [ ] Test PATCH /clubs/:id/settings works
- [ ] No 403 errors in Network tab

---

**After fixing, admin will have full access to edit any club!** 🚀
