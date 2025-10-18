# 🔒 ACCESS CONTROL & SCOPE GUIDE

**Date:** October 16, 2025, 4:12 AM  
**Purpose:** Define access scope for all user roles  
**Status:** ✅ Implemented  

---

## 🎯 ACCESS SCOPE BY ROLE

### **1. ADMIN (System-wide Access)**
```javascript
✅ Can access ALL clubs
✅ Can manage ALL users
✅ Can approve ALL content
✅ Can view ALL audit logs
✅ Can modify system settings
```

**Usage:**
```javascript
import { isAdmin } from '@shared/utils/helpers/permissions';

if (isAdmin(user)) {
  // Show all clubs
  // Allow all operations
}
```

---

### **2. COORDINATOR (Assigned Clubs Only)**
```javascript
✅ Can view ONLY assigned clubs
✅ Can approve events for assigned clubs
✅ Can approve documents for assigned clubs
✅ Can approve budgets for assigned clubs
✅ Can approve club settings for assigned clubs
❌ CANNOT access non-assigned clubs
❌ CANNOT access system settings
```

**Backend Requirements:**
```javascript
// User object must include assignedClubs array
user = {
  _id: '...',
  roles: { global: 'coordinator' },
  assignedClubs: ['clubId1', 'clubId2', 'clubId3'], // Array of club IDs
  // ...
}
```

**Usage:**
```javascript
import { coordinatorHasClubAccess } from '@shared/utils/helpers/permissions';

// Check if coordinator can access specific club
if (coordinatorHasClubAccess(user, clubId)) {
  // Show club management options
  // Show approval buttons
}

// Or use the general access check
import { hasClubAccess } from '@shared/utils/helpers/permissions';

if (hasClubAccess(user, clubId)) {
  // Coordinator can access this club
}
```

**Example Scenarios:**
```javascript
Coordinator assigned to: ['tech-club-id', 'music-club-id']

// ✅ Can approve event for Tech Club
canApproveContent(user, 'tech-club-id') → true

// ✅ Can view Music Club dashboard
hasClubAccess(user, 'music-club-id') → true

// ❌ Cannot access Sports Club (not assigned)
hasClubAccess(user, 'sports-club-id') → false

// ❌ Cannot view all clubs list
// Must filter to show only assigned clubs
```

---

### **3. CLUB TEAM MEMBERS (Their Club Only)**
```javascript
✅ Can access ONLY their specific club
✅ Permissions based on their role in club
❌ CANNOT access other clubs
❌ CANNOT view other clubs' dashboards
```

**Roles & Access:**
```javascript
Member:
  ✅ View club page
  ✅ Register for events
  ❌ Cannot manage anything

Core Team (core, secretary, treasurer, leadPR, leadTech):
  ✅ All member permissions
  ✅ Create & manage events
  ✅ Create & manage recruitments
  ✅ Manage documents
  ✅ View members
  ✅ View analytics
  ❌ Cannot manage club settings
  ❌ Cannot add/remove members

Leadership (Sr Club Head, Jr Club Head):
  ✅ All core team permissions
  ✅ Manage club settings
  ✅ Add/remove members
  ✅ Approve budgets
  ✅ Archive club
```

**Backend Data Structure:**
```javascript
// User object with club roles
user = {
  _id: '...',
  roles: {
    global: 'student',
    scoped: [
      { club: 'tech-club-id', role: 'president' },
      { club: 'music-club-id', role: 'core' },
    ]
  }
}
```

**Usage:**
```javascript
import { 
  hasClubAccess, 
  getUserClubRole,
  isCoreTeam,
  isLeadership 
} from '@shared/utils/helpers/permissions';

// Check if user has any access to club
if (hasClubAccess(user, clubId)) {
  // User is a member of this club
  
  // Get their specific role
  const role = getUserClubRole(user, clubId);
  // Returns: 'member', 'core', 'president', etc. or null
  
  // Check permissions
  if (isLeadership(user, clubId)) {
    // Show club management options
  } else if (isCoreTeam(user, clubId)) {
    // Show event/recruitment management
  }
}
```

**Example Scenarios:**
```javascript
User is:
- President of Tech Club
- Core Team of Music Club

// ✅ Can manage Tech Club
canManageClub(user, 'tech-club-id') → true

// ✅ Can create events for Music Club
canCreateEvents(user, 'music-club-id') → true

// ❌ Cannot access Sports Club (not a member)
hasClubAccess(user, 'sports-club-id') → false

// ❌ Cannot manage Music Club settings (only core, not leadership)
canManageClub(user, 'music-club-id') → false
```

---

### **4. STUDENT (Public View Only)**
```javascript
✅ Can view public club pages
✅ Can view public events
✅ Can register for events
✅ Can apply to recruitments
❌ CANNOT access club dashboards
❌ CANNOT manage anything
```

**Usage:**
```javascript
import { isStudent } from '@shared/utils/helpers/permissions';

// Students see only public content
if (isStudent(user)) {
  // Show public clubs list
  // Show public events
  // Show "Apply" buttons for recruitments
}
```

---

## 📊 ACCESS CONTROL MATRIX

| Resource | Admin | Coordinator (Assigned) | Leadership | Core Team | Member | Student |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **View All Clubs** | ✅ | ❌ (Only assigned) | ❌ (Only their club) | ❌ (Only their club) | ❌ (Only their club) | ✅ (Public) |
| **Manage Club Settings** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Create Events** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Approve Events** | ✅ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| **Manage Members** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **View Analytics** | ✅ | ✅ (Assigned) | ✅ | ✅ | ❌ | ❌ |
| **Approve Documents** | ✅ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| **Archive Club** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 IMPLEMENTATION GUIDE

### **1. Component-Level Access Control**

```javascript
import { hasClubAccess, canManageClub } from '@shared/utils/helpers/permissions';

const ClubDashboard = () => {
  const { user } = useAuth();
  const { clubId } = useParams();
  
  // First: Check if user has ANY access to this club
  const hasAccess = hasClubAccess(user, clubId);
  
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  // Then: Check specific permissions
  const canManage = canManageClub(user, clubId);
  
  return (
    <div>
      <ClubInfo />
      {canManage && <ClubSettingsButton />}
    </div>
  );
};
```

### **2. Route-Level Access Control**

```javascript
// Use ProtectedRoute with club access check
<Route 
  path="/clubs/:clubId/dashboard" 
  element={
    <ProtectedRoute 
      clubId={clubId}
      requireClubAccess={true}
    >
      <ClubDashboard />
    </ProtectedRoute>
  } 
/>
```

### **3. API Call Access Control**

```javascript
import { hasClubAccess } from '@shared/utils/helpers/permissions';

const fetchClubData = async (clubId) => {
  // Check access before making API call
  if (!hasClubAccess(user, clubId)) {
    throw new Error('Access denied');
  }
  
  const data = await clubService.getClub(clubId);
  return data;
};
```

### **4. List Filtering**

```javascript
// For Coordinators: Show only assigned clubs
import { isCoordinator } from '@shared/utils/helpers/permissions';

const ClubsList = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  
  useEffect(() => {
    const fetchClubs = async () => {
      const allClubs = await clubService.listClubs();
      
      // Filter based on role
      if (isCoordinator(user)) {
        // Show only assigned clubs
        const filteredClubs = allClubs.filter(club =>
          user.assignedClubs?.includes(club._id)
        );
        setClubs(filteredClubs);
      } else if (isAdmin(user)) {
        // Show all clubs
        setClubs(allClubs);
      } else {
        // Show only clubs user is member of
        const userClubIds = user.roles.scoped.map(m => m.club);
        const filteredClubs = allClubs.filter(club =>
          userClubIds.includes(club._id)
        );
        setClubs(filteredClubs);
      }
    };
    
    fetchClubs();
  }, [user]);
  
  return <ClubsGrid clubs={clubs} />;
};
```

---

## 🎯 COMMON USE CASES

### **Use Case 1: Club Dashboard Access**
```javascript
import { hasClubAccess } from '@shared/utils/helpers/permissions';

// Problem: Anyone can access /clubs/:clubId/dashboard
// Solution: Check access first

if (!hasClubAccess(user, clubId)) {
  navigate('/access-denied');
  return;
}

// User has access - proceed
```

### **Use Case 2: Show Approval Buttons**
```javascript
import { canApproveContent } from '@shared/utils/helpers/permissions';

// Show approve button only if user can approve for this club
const canApprove = canApproveContent(user, clubId);

return (
  <div>
    <EventDetails />
    {canApprove && (
      <div>
        <button onClick={handleApprove}>Approve</button>
        <button onClick={handleReject}>Reject</button>
      </div>
    )}
  </div>
);
```

### **Use Case 3: Coordinator Dashboard**
```javascript
import { isCoordinator, coordinatorHasClubAccess } from '@shared/utils/helpers/permissions';

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [assignedClubs, setAssignedClubs] = useState([]);
  
  useEffect(() => {
    if (isCoordinator(user)) {
      // Fetch only assigned clubs
      const fetchAssignedClubs = async () => {
        const clubs = await Promise.all(
          user.assignedClubs.map(clubId => 
            clubService.getClub(clubId)
          )
        );
        setAssignedClubs(clubs);
      };
      
      fetchAssignedClubs();
    }
  }, [user]);
  
  return (
    <div>
      <h1>My Assigned Clubs</h1>
      {assignedClubs.map(club => (
        <ClubCard key={club._id} club={club} />
      ))}
    </div>
  );
};
```

### **Use Case 4: Navigation Menu**
```javascript
import { isAdmin, isCoordinator, isCoreTeam } from '@shared/utils/helpers/permissions';

const Navigation = () => {
  const { user } = useAuth();
  const { clubId } = useCurrentClub(); // Custom hook
  
  return (
    <nav>
      <NavLink to="/">Home</NavLink>
      
      {/* Show for club members only */}
      {clubId && isCoreTeam(user, clubId) && (
        <>
          <NavLink to={`/clubs/${clubId}/dashboard`}>Dashboard</NavLink>
          <NavLink to={`/events/create`}>Create Event</NavLink>
        </>
      )}
      
      {/* Show for coordinators */}
      {isCoordinator(user) && (
        <NavLink to="/coordinator/dashboard">My Assigned Clubs</NavLink>
      )}
      
      {/* Show for admins only */}
      {isAdmin(user) && (
        <>
          <NavLink to="/admin/users">User Management</NavLink>
          <NavLink to="/admin/settings">System Settings</NavLink>
        </>
      )}
    </nav>
  );
};
```

---

## 📋 BACKEND REQUIREMENTS

### **User Object Structure:**
```javascript
{
  _id: 'user-id',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  
  roles: {
    // Global role (required)
    global: 'student' | 'coordinator' | 'admin',
    
    // Club-specific roles (optional, for club members)
    scoped: [
      {
        club: 'club-id-1',
        role: 'president' | 'vicePresident' | 'core' | 'secretary' | 
              'treasurer' | 'leadPR' | 'leadTech' | 'member'
      },
      // ... more club memberships
    ]
  },
  
  // For coordinators only (required if global role is 'coordinator')
  assignedClubs: ['club-id-1', 'club-id-2', 'club-id-3'],
  
  // ... other user fields
}
```

### **API Endpoints Required:**

```javascript
// Get user's assigned clubs (for coordinators)
GET /api/users/me/assigned-clubs
Response: {
  status: 'success',
  data: {
    clubs: [/* club objects */]
  }
}

// Check if coordinator has access to club
GET /api/users/me/has-club-access/:clubId
Response: {
  status: 'success',
  data: {
    hasAccess: true/false
  }
}
```

---

## ✅ TESTING CHECKLIST

### Access Control Tests:
- [ ] Admin can access all clubs
- [ ] Coordinator can access assigned clubs only
- [ ] Coordinator cannot access non-assigned clubs
- [ ] Club members can access only their club
- [ ] Club members cannot access other clubs
- [ ] Students cannot access club dashboards
- [ ] Approval buttons show only for authorized users
- [ ] Navigation items filtered by permissions
- [ ] API calls blocked for unauthorized users

### Edge Cases:
- [ ] User with no roles (shouldn't happen, but handle gracefully)
- [ ] Coordinator with empty assignedClubs array
- [ ] User trying to access club they just left
- [ ] Multiple tabs with different clubs
- [ ] Coordinator reassigned to different clubs mid-session

---

## 🚨 SECURITY BEST PRACTICES

### ✅ DO:
1. **Always check access server-side** - Frontend checks are for UX only
2. **Use helper functions** - Don't duplicate permission logic
3. **Check before API calls** - Prevent unauthorized requests
4. **Filter lists** - Show only accessible items
5. **Hide UI elements** - Don't show buttons user can't use
6. **Log access attempts** - Track who accessed what

### ❌ DON'T:
1. **Don't rely only on frontend checks** - Can be bypassed
2. **Don't hardcode role names** - Use constants
3. **Don't assume coordinator has all clubs** - Check assignedClubs
4. **Don't show error details** - Just say "Access Denied"
5. **Don't skip clubId parameter** - Always pass it for coordinators
6. **Don't cache permission checks too long** - Roles may change

---

## 📝 SUMMARY

### **Key Functions to Use:**

```javascript
// General access check (use this most)
hasClubAccess(user, clubId) 
  → Returns true if user can view/access this club

// Coordinator-specific check
coordinatorHasClubAccess(user, clubId)
  → Returns true if coordinator has this club assigned

// Approval check
canApproveContent(user, clubId)
  → Returns true if user can approve content for this club

// Management check
canManageClub(user, clubId)
  → Returns true if user can manage club settings
```

### **Remember:**
- ✅ Admin → ALL clubs
- ✅ Coordinator → ASSIGNED clubs only
- ✅ Club Members → THEIR club only
- ✅ Always pass `clubId` for club-specific checks
- ✅ Use `hasClubAccess()` as the main gatekeeper

---

**Status:** ✅ Implemented and documented  
**Next:** Test with real user flows
