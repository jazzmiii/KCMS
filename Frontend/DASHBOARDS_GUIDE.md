# 📊 Dashboards Guide - KMIT Clubs Hub

## Overview

The KMIT Clubs Hub features **4 distinct role-based dashboards**, each tailored to specific user responsibilities and permissions.

## 🎯 Dashboard Types

### 1. Student Dashboard (`/dashboard`)
**Access**: All authenticated users (default)

**Features**:
- View active clubs and join opportunities
- Browse upcoming events with RSVP
- Apply to open recruitments
- Track application status
- Personal activity overview
- Quick actions for common tasks

**Stats Displayed**:
- Active Clubs count
- Upcoming Events count
- Open Recruitments count

**Key Sections**:
- Quick Actions (Explore Clubs, Apply to Clubs, Browse Events, My Profile)
- Open Recruitments with application status
- Upcoming Events calendar
- Clubs directory

---

### 2. Core Member Dashboard (`/core/dashboard`)
**Access**: Users with `core` or `president` role in any club

**Features**:
- Manage assigned clubs
- Create and manage events
- Start and manage recruitments
- Review applications (bulk actions)
- Track club performance
- Member management

**Stats Displayed**:
- My Clubs count
- My Events count
- Active Recruitments count
- Pending Applications count

**Key Sections**:
- Quick Actions (Create Event, Start Recruitment, Manage Clubs, View Reports)
- My Clubs with role badges
- My Recruitments with application counts
- Upcoming Events management
- Tips for Core Members

**Responsibilities**:
- Event planning and execution
- Recruitment management
- Application review
- Member engagement
- Activity documentation

---

### 3. Coordinator Dashboard (`/coordinator/dashboard`)
**Access**: Users with `coordinator` global role

**Features**:
- View assigned clubs
- Approve/reject events
- Monitor club activities
- Review event proposals
- Budget approvals
- Generate reports

**Stats Displayed**:
- Assigned Clubs count
- Pending Approvals count
- Total Events count

**Key Sections**:
- Quick Actions (My Clubs, Pending Events, Recruitments)
- Pending Event Approvals with action buttons
- Assigned Clubs overview
- Club activity monitoring

**Responsibilities**:
- Event approval (< ₹5000 budget)
- Club oversight
- Activity monitoring
- Report generation
- Faculty coordination

---

### 4. Admin Dashboard (`/admin/dashboard`)
**Access**: Users with `admin` global role

**Features**:
- System-wide statistics
- User management (CRUD operations)
- Club creation and management
- Event approvals (high budget)
- Role assignments
- System configuration
- Audit logs access

**Stats Displayed**:
- Total Clubs count
- Total Events count
- Total Users count
- Pending Approvals count

**Key Sections**:
- Admin Actions (Create Club, Manage Users, Manage Clubs, Manage Events)
- Recent Clubs table
- Recent Events table
- User management interface

**Responsibilities**:
- System administration
- User role management
- Club creation/deletion
- High-value event approvals
- System security
- Data management

---

## 🔄 Dashboard Routing Logic

### Priority Order (Highest to Lowest)

```javascript
1. Admin (globalRoles includes 'admin') → /admin/dashboard
2. Coordinator (globalRoles includes 'coordinator') → /coordinator/dashboard
3. Core Member (clubRoles includes 'core' or 'president') → /core/dashboard
4. Student (default) → /dashboard
```

### Automatic Routing

The system automatically routes users to their appropriate dashboard based on:

**On Login**:
```javascript
// LoginPage.jsx
if (user.globalRoles?.includes('admin')) {
  navigate('/admin/dashboard');
} else if (user.globalRoles?.includes('coordinator')) {
  navigate('/coordinator/dashboard');
} else if (user.clubRoles?.some(cr => cr.roles.includes('core') || cr.roles.includes('president'))) {
  navigate('/core/dashboard');
} else {
  navigate('/dashboard');
}
```

**Dashboard Link in Navigation**:
```javascript
// Layout.jsx - getDashboardLink()
if (user?.globalRoles?.includes('admin')) return '/admin/dashboard';
if (user?.globalRoles?.includes('coordinator')) return '/coordinator/dashboard';
if (user?.clubRoles?.some(cr => cr.roles.includes('core') || cr.roles.includes('president'))) {
  return '/core/dashboard';
}
return '/dashboard';
```

---

## 📋 Backend Integration

### API Endpoints Used

#### Student Dashboard
```javascript
GET /api/clubs?limit=4&status=active
GET /api/events?limit=5&status=published
GET /api/recruitments?limit=5&status=open
```

#### Core Dashboard
```javascript
GET /api/clubs?limit=10
GET /api/events?limit=10&status=published
GET /api/recruitments?limit=10
// Filtered client-side by user's clubRoles
```

#### Coordinator Dashboard
```javascript
GET /api/clubs?coordinator={userId}
GET /api/events?status=pending_coordinator
PATCH /api/events/:id/status (for approvals)
```

#### Admin Dashboard
```javascript
GET /api/clubs?limit=5
GET /api/events?limit=5
GET /api/users?limit=10
PATCH /api/users/:id/role
DELETE /api/users/:id
```

---

## 🎨 Dashboard Components

### Common Components
- **Stats Cards**: Display key metrics with icons
- **Quick Actions**: Contextual action buttons
- **Section Headers**: With "View All" links
- **Data Cards**: Clubs, events, recruitments
- **Tables**: For admin/coordinator data views

### Unique Features

**Student Dashboard**:
- Event calendar view
- Application tracking
- Club discovery

**Core Dashboard**:
- Role badges display
- Application review interface
- Event management tools
- Tips section

**Coordinator Dashboard**:
- Approval workflow
- Club performance metrics
- Budget review

**Admin Dashboard**:
- User management table
- Role assignment dropdown
- System statistics
- Audit access

---

## 🔐 Permission Checks

### Route Protection
```javascript
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

### Component-Level Checks
```javascript
// Check if user can create events
const canCreateEvent = user?.clubRoles?.some(cr => 
  cr.roles.includes('president') || cr.roles.includes('core')
) || user?.globalRoles?.includes('admin');
```

### API-Level Authorization
- Backend validates user roles on every request
- JWT token contains user roles
- Middleware checks permissions before processing

---

## 📊 Data Flow

### 1. User Login
```
User → Login → Backend validates → Returns JWT + User data
→ Frontend stores token → Routes to appropriate dashboard
```

### 2. Dashboard Load
```
Dashboard Component → useEffect → Fetch data from APIs
→ Filter based on user roles → Display relevant data
```

### 3. Action Execution
```
User clicks action → Check permissions → Call API
→ Update UI → Show success/error message
```

---

## 🚀 Usage Examples

### For Students
1. Login → Redirected to `/dashboard`
2. View open recruitments
3. Click "Apply Now" → Fill application
4. Track status in dashboard

### For Core Members
1. Login → Redirected to `/core/dashboard`
2. Click "Create Event"
3. Fill event details
4. Submit for approval
5. Track in "My Events"

### For Coordinators
1. Login → Redirected to `/coordinator/dashboard`
2. View "Pending Approvals"
3. Click "View" on event
4. Review details
5. Click "Approve" or "Reject"

### For Admins
1. Login → Redirected to `/admin/dashboard`
2. View system statistics
3. Click "Manage Users"
4. Change user roles
5. Create new clubs

---

## 🎯 Best Practices

### For Frontend Developers
1. Always check user roles before showing actions
2. Use `useAuth()` hook for role checks
3. Handle loading and error states
4. Implement optimistic UI updates
5. Cache dashboard data appropriately

### For Backend Developers
1. Validate roles on every protected endpoint
2. Return appropriate error messages
3. Include role information in JWT
4. Log all role-based actions
5. Implement rate limiting

---

## 🐛 Troubleshooting

### Dashboard Not Loading
- Check if backend is running
- Verify JWT token is valid
- Check browser console for errors
- Ensure API endpoints are accessible

### Wrong Dashboard Displayed
- Clear localStorage and login again
- Check user roles in database
- Verify role assignment logic
- Check route protection

### Permission Denied
- Verify user has required role
- Check JWT token expiry
- Ensure role is in globalRoles or clubRoles
- Contact admin for role assignment

---

## 📝 Summary

| Dashboard | Route | Access | Primary Function |
|-----------|-------|--------|------------------|
| **Student** | `/dashboard` | All users | Browse and participate |
| **Core** | `/core/dashboard` | Club core members | Manage club activities |
| **Coordinator** | `/coordinator/dashboard` | Faculty coordinators | Approve and oversee |
| **Admin** | `/admin/dashboard` | System admins | Full system control |

Each dashboard is fully integrated with the backend and provides role-specific functionality for efficient club management! 🎉
