# Club Dashboard System Guide

## Overview
Each of the 13 clubs now has its own dedicated dashboard for club management. Core members (president, vice president, core team, etc.) can access their club's dashboard to manage all club activities.

## Club Dashboard Features

### 1. **Dashboard Access**
- **URL Pattern**: `/clubs/:clubId/dashboard`
- **Access Control**: 
  - Admin (global)
  - Coordinator (global)
  - Club core members (president, vicePresident, core)

### 2. **Dashboard Sections**

#### **Overview Tab**
- Club information and description
- Club category and status
- Coordinator details
- Recent activity feed
- Quick stats summary

#### **Events Tab**
- List all club events
- Filter by status (draft, published, approved, ongoing, completed)
- Create new events
- Edit existing events
- View event details
- Track attendance and RSVPs

#### **Recruitments Tab**
- Active recruitment drives
- Application statistics
- Review applications
- Start new recruitment
- Close/manage recruitment status

#### **Members Tab**
- Total member count
- Member list (coming soon)
- Add/remove members (coming soon)
- Member role management (coming soon)

#### **Documents Tab**
- Upload club documents (coming soon)
- Meeting minutes
- Event reports
- Budget documents
- Certificates

### 3. **Quick Actions**
From the dashboard, core members can quickly:
- ➕ Create Event
- 📝 Start Recruitment
- 👥 Manage Members
- 📄 Upload Documents

### 4. **Statistics Displayed**
- 👥 Total Members
- 📅 Upcoming Events
- 📝 Active Recruitments
- 📋 Pending Applications

## Navigation Flow

```
Core Member Dashboard
    ↓
My Clubs Section
    ↓
Click "Manage Club"
    ↓
Club Dashboard (/clubs/:clubId/dashboard)
    ↓
[Overview | Events | Recruitments | Members | Documents]
```

## File Structure

```
Frontend/
├── src/
│   ├── pages/
│   │   ├── clubs/
│   │   │   ├── ClubsPage.jsx          # Browse all clubs
│   │   │   ├── ClubDetailPage.jsx     # Public club page
│   │   │   ├── ClubDashboard.jsx      # Club management dashboard ✨ NEW
│   │   │   └── CreateClubPage.jsx     # Admin: create club
│   │   └── dashboards/
│   │       ├── CoreDashboard.jsx      # Core member main dashboard
│   │       ├── AdminDashboard.jsx
│   │       ├── CoordinatorDashboard.jsx
│   │       └── StudentDashboard.jsx
│   └── styles/
│       └── ClubDashboard.css          # Dashboard styles ✨ NEW
```

## The 13 Clubs

Each club has its own dashboard accessible via their club ID:

1. **Organising Committee** (Administrative)
2. **Public Relations** (Communication)
3. **Aakarshan Art Club** (Cultural)
4. **AALP Music Club** (Cultural)
5. **Abhinaya Drama Club** (Cultural)
6. **Riti Fashion Club** (Cultural)
7. **KMITRA - E-Magazine & Blog** (Media)
8. **Mudra Dance Club** (Cultural)
9. **Recurse Coding Club** (Technical)
10. **Traces of Lenses Photography Club** (Creative)
11. **Vachan Speakers Club** (Development)
12. **Kreeda Sports Club** (Sports)
13. **Rotaract Club** (Social Service)

## Permission System

### Role Hierarchy
```
Admin (Global)
    ↓
Coordinator (Global)
    ↓
President (Club-specific)
    ↓
Vice President (Club-specific)
    ↓
Core Team (Club-specific)
    ↓
Members (Club-specific)
```

### Dashboard Access Matrix

| Feature | Admin | Coordinator | President | Vice President | Core | Member |
|---------|-------|-------------|-----------|----------------|------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create Event | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Club Info | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Start Recruitment | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Review Applications | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

## Backend API Endpoints Used

```javascript
// Club endpoints
GET    /api/clubs/:id              // Get club details
PATCH  /api/clubs/:id              // Update club
GET    /api/clubs/:id/members      // Get club members

// Event endpoints
GET    /api/events?club=:clubId    // List club events
POST   /api/events                 // Create event
PATCH  /api/events/:id             // Update event

// Recruitment endpoints
GET    /api/recruitments?club=:clubId  // List recruitments
POST   /api/recruitments               // Create recruitment
GET    /api/recruitments/:id/applications  // Get applications

// Document endpoints (coming soon)
POST   /api/documents              // Upload document
GET    /api/documents?club=:clubId // List club documents
```

## Next Steps / Future Enhancements

### Phase 1 (Immediate)
- ✅ Club Dashboard UI
- ✅ Basic navigation
- ✅ Stats display
- ✅ Events integration
- ✅ Recruitments integration

### Phase 2 (Coming Soon)
- [ ] Member management interface
- [ ] Document upload system
- [ ] Budget tracking
- [ ] Analytics and reports
- [ ] Activity timeline

### Phase 3 (Future)
- [ ] Real-time notifications
- [ ] Chat/messaging within club
- [ ] Calendar integration
- [ ] Social media integration
- [ ] Mobile app support

## Usage Example

### For a Core Member:

1. **Login** to the system
2. Navigate to **Core Dashboard** (`/core/dashboard`)
3. See **"My Clubs"** section
4. Click **"Manage Club"** on any club card
5. Redirected to **Club Dashboard** (`/clubs/:clubId/dashboard`)
6. Access all club management features from tabs

### For Creating an Event:

1. From Club Dashboard
2. Click **"Create Event"** quick action
3. Redirected to event creation form with club pre-selected
4. Fill event details
5. Submit for approval
6. Track event status from Events tab

## Styling Notes

The dashboard uses:
- **Gradient backgrounds** for headers
- **Card-based layout** for content
- **Responsive grid system**
- **Smooth animations** on interactions
- **Color-coded badges** for status
- **Icon-based navigation**

## Troubleshooting

### Dashboard not loading?
- Check if user has proper club role
- Verify clubId in URL is valid
- Check browser console for API errors

### Can't create events?
- Ensure user has core/president role
- Check if club status is "active"
- Verify backend permissions

### Stats showing 0?
- Check if API is returning data
- Verify club has events/members
- Check date filters on queries

## Support

For issues or questions:
- Check backend logs for API errors
- Verify user roles in database
- Test with admin account first
- Review permission middleware
