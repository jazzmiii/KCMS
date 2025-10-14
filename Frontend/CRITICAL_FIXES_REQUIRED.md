# 🔴 CRITICAL FRONTEND FIXES REQUIRED

**Status:** BLOCKING PRODUCTION  
**Priority:** Fix immediately (1-2 days)  
**Impact:** Core functionality broken

---

## ❌ CRITICAL FIX #1: AuthContext clubRoles Structure

**File:** `src/context/AuthContext.jsx`  
**Line:** 44-48  
**Issue:** RBAC completely broken - club role checks will always fail

### Current Code (WRONG):
```javascript
const hasClubRole = (clubId, role) => {
  if (!user) return false;
  const clubRole = user.clubRoles?.find(cr => cr.clubId === clubId);
  return clubRole?.roles?.includes(role);
};
```

### Backend Actual Structure:
```javascript
// From Backend User model:
clubRoles: [{
  club: ObjectId,      // ❌ NOT 'clubId'
  role: String,        // ❌ NOT 'roles' array
  _id: false
}]
```

### Fixed Code (CORRECT):
```javascript
const hasClubRole = (clubId, role) => {
  if (!user) return false;
  // Fix 1: Use 'club' not 'clubId'
  // Fix 2: Use 'role' (string) not 'roles' (array)
  const clubRole = user.clubRoles?.find(cr => cr.club === clubId);
  return clubRole?.role === role;
};
```

**Testing:**
```javascript
// Test with actual user object structure
const user = {
  roles: { global: 'student' },
  clubRoles: [
    { club: '507f1f77bcf86cd799439011', role: 'president' }
  ]
};

hasClubRole('507f1f77bcf86cd799439011', 'president'); // Should return true
```

---

## ❌ CRITICAL FIX #2: Event Service Wrong Endpoints

**File:** `src/services/eventService.js`  
**Lines:** 60-70  
**Issue:** Calls non-existent Backend endpoints → 404 errors

### Problem 1: approveBudget() - Endpoint doesn't exist

**Current Code (WRONG):**
```javascript
// Lines 60-64
approveBudget: async (id, budgetId, data) => {
  const response = await api.patch(`/events/${id}/budget/${budgetId}/approve`, data);
  return response.data;
},
```

**Backend Reality:** No such endpoint exists!

**Solution:** Budget approval is done via BudgetRequest model status update, not a separate route.

**Fixed Code:**
```javascript
// OPTION 1: Remove completely (recommended)
// Delete this method - not supported by Backend

// OPTION 2: If needed, Backend team must implement:
// POST /api/budget-requests/:budgetId/approve
// Then update this to:
approveBudget: async (budgetId, data) => {
  const response = await api.post(`/budget-requests/${budgetId}/approve`, data);
  return response.data;
},
```

---

### Problem 2: submitReport() - Endpoint doesn't exist

**Current Code (WRONG):**
```javascript
// Lines 66-70
submitReport: async (id, data) => {
  const response = await api.post(`/events/${id}/report`, data);
  return response.data;
},
```

**Backend Reality:** No `/events/:id/report` endpoint!

**Solution:** Either remove or implement in Backend

**Fixed Code:**
```javascript
// OPTION 1: Remove completely if not used
// Delete this method

// OPTION 2: If needed, Backend must implement first
```

---

## ❌ CRITICAL FIX #3: ClubDetailPage Wrong Data Access

**File:** `src/pages/clubs/ClubDetailPage.jsx`  
**Lines:** 27-28  
**Issue:** Triple nested data access likely wrong

### Current Code (POTENTIALLY WRONG):
```javascript
const fetchClubDetails = async () => {
  try {
    const [clubRes, eventsRes] = await Promise.all([
      clubService.getClub(clubId),
      eventService.list({ clubId, limit: 10 }),
    ]);
    setClub(clubRes.data?.data?.club);  // ❌ Three levels?
    setEvents(eventsRes.data?.data?.events || []);  // ❌ Inconsistent
  }
}
```

### Backend Response Structure:
```javascript
// From Backend club.controller.js getClub():
res.json({
  status: 'success',
  data: {
    club: { ...clubData }  // Club object directly
  }
});

// From Backend event.controller.js listEvents():
res.json({
  status: 'success',
  data: {
    events: [...],  // Array directly
    total: number
  }
});
```

### Fixed Code:
```javascript
const fetchClubDetails = async () => {
  try {
    const [clubRes, eventsRes] = await Promise.all([
      clubService.getClub(clubId),
      eventService.list({ clubId, limit: 10 }),
    ]);
    // Fix 1: data.data.club → data.data
    setClub(clubRes.data?.data);
    // Fix 2: data.data.events → data.data
    setEvents(eventsRes.data?.data || []);
  } catch (error) {
    console.error('Error fetching club details:', error);
  } finally {
    setLoading(false);
  }
};
```

**⚠️ IMPORTANT:** Verify actual Backend response structure by:
1. Checking `Backend/src/modules/club/club.controller.js` line ~60
2. Or test the API endpoint directly: `GET /api/clubs/:id`
3. Adjust Frontend code to match exact structure

---

## ❌ CRITICAL FIX #4: ProtectedRoute No Club Role Support

**File:** `src/components/ProtectedRoute.jsx`  
**Issue:** Cannot enforce club-specific role requirements

### Current Code (INCOMPLETE):
```javascript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Only checks global role
  if (requiredRole && user.roles?.global !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
```

### Fixed Code (WITH CLUB ROLE SUPPORT):
```javascript
const ProtectedRoute = ({ 
  children, 
  requiredRole,        // Global role (admin, coordinator, student)
  requiredClubRole,    // Club role (president, core, member)
  clubId               // Required if requiredClubRole is specified
}) => {
  const { user, loading, hasClubRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check global role
  if (requiredRole && user.roles?.global !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check club-specific role
  if (requiredClubRole && clubId) {
    if (!hasClubRole(clubId, requiredClubRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
```

### Usage Examples:
```jsx
// Admin only
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRole="admin">
      <UsersManagementPage />
    </ProtectedRoute>
  }
/>

// Club President only (for specific club)
<Route
  path="/clubs/:clubId/settings"
  element={
    <ProtectedRoute requiredClubRole="president" clubId={clubId}>
      <ClubSettingsPage />
    </ProtectedRoute>
  }
/>

// Club Core+ (president or core)
// Note: Requires multiple role support - see enhancement below
```

### Enhancement: Support Multiple Club Roles
```javascript
// In ProtectedRoute.jsx:
const ProtectedRoute = ({ 
  children, 
  requiredRole,
  requiredClubRoles,    // Array: ['president', 'core']
  clubId
}) => {
  // ... existing code ...

  // Check if user has any of the required club roles
  if (requiredClubRoles && clubId) {
    const hasAnyRole = requiredClubRoles.some(role => 
      hasClubRole(clubId, role)
    );
    
    if (!hasAnyRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
```

---

## 🧪 TESTING CHECKLIST

After implementing fixes, test:

### Test 1: AuthContext clubRoles
```javascript
// In browser console:
localStorage.getItem('user');
// Check structure matches Backend

// Test hasClubRole function
import { useAuth } from './context/AuthContext';
const { hasClubRole } = useAuth();
hasClubRole('clubId123', 'president'); // Should work
```

### Test 2: Event Service
```javascript
// Remove calls to:
eventService.approveBudget()
eventService.submitReport()

// Ensure no 404 errors in console
```

### Test 3: ClubDetailPage
```bash
# Test loading club pages
http://localhost:3000/clubs/[valid-club-id]

# Should load without errors
# Check browser console for correct data structure
```

### Test 4: ProtectedRoute
```jsx
// Test club role protection
// Try accessing club dashboard without club role
// Should redirect to /dashboard
```

---

## 📋 VERIFICATION STEPS

1. **Fix AuthContext**
   - [ ] Update `hasClubRole` function
   - [ ] Test with actual user data
   - [ ] Verify club role checks work

2. **Fix Event Service**
   - [ ] Remove `approveBudget` method
   - [ ] Remove `submitReport` method
   - [ ] Search codebase for usage: `eventService.approveBudget`
   - [ ] Remove any UI components calling these

3. **Fix ClubDetailPage**
   - [ ] Update data access to `data?.data`
   - [ ] Test club page loads
   - [ ] Verify events list displays

4. **Fix ProtectedRoute**
   - [ ] Add `requiredClubRole` and `clubId` props
   - [ ] Implement club role checking
   - [ ] Test role-based restrictions

---

## 🚀 DEPLOYMENT READINESS

**Before Production:**
- [ ] All 4 critical fixes implemented
- [ ] All tests passing
- [ ] No console errors
- [ ] RBAC working correctly
- [ ] Club pages loading
- [ ] No 404 API errors

**After Fixes:**
- Frontend integration: 70% → 85%
- Production ready: ❌ → ⚠️ (needs Phase 2)

---

**Created:** October 13, 2025  
**Priority:** CRITICAL  
**ETA:** 1-2 days  
**Blocking:** Production deployment
