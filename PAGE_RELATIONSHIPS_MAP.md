# 🗺️ PAGE RELATIONSHIPS & NAVIGATION MAP

**KMIT Clubs Hub - Complete System Architecture**

---

## 📊 **CORE PAGE STRUCTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN NAVIGATION                         │
├─────────────────────────────────────────────────────────────┤
│  🏠 Dashboard  │  🎪 Clubs  │  📅 Events  │  🖼️ Gallery   │
│  📊 Reports    │  📬 Notifications  │  👤 Profile       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **EVENT WORKFLOW & PAGE FLOW**

### **Complete Event Lifecycle:**

```
CREATE EVENT
    ↓
┌─────────────────────────┐
│  CreateEventPage        │
│  /events/create         │
│                         │
│  - Fill event form      │
│  - Upload documents     │
│  - Set budget          │
│  - Submit              │
└─────────────────────────┘
    ↓
    ↓ [Submit for Approval]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← EVENT CREATOR VIEW
│  /events/:id            │
│  Status: draft          │
│                         │
│  Actions Available:     │
│  • ✏️ Edit Event        │
│  • 🗑️ Delete Event      │
│  • Submit for Approval  │
└─────────────────────────┘
    ↓
    ↓ [Submitted]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← COORDINATOR VIEW
│  /events/:id            │
│  Status: pending_coord  │
│                         │
│  Actions Available:     │
│  • ✅ Approve           │
│  • 💰 Financial Override│
│  • ❌ Reject            │
└─────────────────────────┘
    ↓
    ↓ [Approved by Coordinator]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← ADMIN VIEW (if needed)
│  /events/:id            │
│  Status: pending_admin  │
│                         │
│  Actions Available:     │
│  • ✅ Approve as Admin  │
│  • ❌ Reject            │
└─────────────────────────┘
    ↓
    ↓ [Approved by Admin]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← PUBLIC VIEW
│  /events/:id            │
│  Status: published      │
│                         │
│  Student Actions:       │
│  • 🎫 RSVP Now          │
│                         │
│  Organizer Actions:     │
│  • ▶️ Start Event       │
└─────────────────────────┘
    ↓
    ↓ [Event Day - Manually start OR Auto-start via Cron]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← DURING EVENT
│  /events/:id            │
│  Status: ongoing        │
│                         │
│  Actions Available:     │
│  • 📸 Take Photos       │
│  • ✅ Mark Attendance   │
│  • ⏹️ Complete Event    │
└─────────────────────────┘
    ↓
    ↓ [24 hours later - Auto-transition via Cron Job 2]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← POST-EVENT (7 days to complete)
│  /events/:id            │
│  Status: pending_completion
│                         │
│  ⏰ Completion Checklist:│
│  ⏳ Days remaining: 5   │
│  [████████░░] 50%       │
│                         │
│  ✅ Photos (5) uploaded │
│  ⏳ Report pending      │
│  ⏳ Attendance pending  │
│  ✅ Bills (3) uploaded  │
│                         │
│  [📤 Upload Materials]  │
└─────────────────────────┘
    ↓
    ↓ [After uploading all materials]
    ↓
┌─────────────────────────┐
│  EventDetailPage        │ ← COMPLETED EVENT
│  /events/:id            │
│  Status: completed ✅   │
│                         │
│  [Overview] Tab:        │
│  - Event details        │
│  - Final stats          │
│                         │
│  [Gallery] Tab: ⭐ NEW  │
│  - View 5 photos        │
│  - Lightbox view        │
│  - Download photos      │
│                         │
│  [Documents] Tab: ⭐ NEW│
│  - View report (PDF)    │
│  - Download attendance  │
│  - Download bills       │
│                         │
│  Links:                 │
│  → 🖼️ View in Gallery   │
│  → 📊 Generate Report   │
└─────────────────────────┘
```

---

## 🔗 **PAGE INTERCONNECTIONS**

### **1. EVENT PAGES ECOSYSTEM**

```
EventsPage (List)
    │
    ├─→ CreateEventPage ──→ EventDetailPage (new draft)
    │
    └─→ EventDetailPage (existing)
            │
            ├─→ EditEventPage (if draft)
            │
            ├─→ [Gallery Tab] (internal)
            │     └─→ GalleryPage (external link)
            │
            ├─→ [Documents Tab] (internal)
            │
            └─→ ReportsPage (generate event report)
```

---

### **2. GALLERY PAGES ECOSYSTEM**

```
GalleryPage
    │
    ├─→ Filter by Club
    │     └─→ Shows all photos from club
    │
    ├─→ Filter by Album
    │     └─→ Shows photos in specific album
    │
    └─→ Filter by Event (from EventDetailPage link)
          └─→ Shows photos from specific event
          
          
EventDetailPage [Gallery Tab]
    │
    └─→ Shows ONLY photos from THIS event
    │
    └─→ Link to GalleryPage (view in full gallery)
```

**Key Difference:**
- **EventDetailPage Gallery Tab** = Event-specific photos only
- **GalleryPage** = All photos from club/album (cross-event view)

---

### **3. REPORTS PAGES ECOSYSTEM**

```
ReportsPage
    │
    ├─→ [Dashboard] Tab
    │     └─→ System-wide statistics
    │
    ├─→ [Reports] Tab
    │     ├─→ Club Activity Report
    │     ├─→ NAAC/NBA Report
    │     └─→ Annual Report
    │
    └─→ [Audit Logs] Tab
          └─→ System audit trail


EventDetailPage [Documents Tab]
    │
    └─→ Shows event-specific report (inline PDF viewer)
    │
    └─→ Link to ReportsPage (generate formatted reports)
```

**Key Difference:**
- **EventDetailPage Documents Tab** = THIS event's report (view/download)
- **ReportsPage** = Generate aggregate reports (club/annual/NAAC)

---

### **4. DOCUMENT MANAGEMENT FLOW**

```
Documents Uploaded via:
    │
    ├─→ EventDetailPage (CompletionChecklist)
    │     │
    │     ├─→ Photos → event.photos[]
    │     ├─→ Report → event.reportUrl
    │     ├─→ Attendance → event.attendanceUrl
    │     └─→ Bills → event.billsUrls[]
    │
    └─→ GalleryPage (Direct upload for albums)
          │
          └─→ Stored in: clubs/:clubId/documents
          
          
Documents Viewed via:
    │
    ├─→ EventDetailPage [Gallery Tab]
    │     └─→ View event.photos[]
    │
    ├─→ EventDetailPage [Documents Tab]
    │     ├─→ View event.reportUrl
    │     ├─→ Download event.attendanceUrl
    │     └─→ View event.billsUrls[]
    │
    └─→ GalleryPage
          └─→ View all club photos (albums/events)
```

---

## 🎯 **USER JOURNEYS**

### **Journey 1: Student Attending Event**

```
1. Login → Dashboard
2. See "Upcoming Events" widget
3. Click "Tech Talk 2024"
   ↓
4. EventDetailPage (Status: published)
   - Read event details
   - Click "RSVP Now"
   - Receive confirmation
5. Event day → Attend event
6. Scan QR code for attendance
7. Few days later → Click "Tech Talk" again
   ↓
8. EventDetailPage (Status: completed)
   - Click [Gallery] tab
   - View event photos
   - Download favorite photos
   - Share on social media
```

---

### **Journey 2: Core Team Organizing Event**

```
1. Login → Dashboard
2. Click "Create Event"
   ↓
3. CreateEventPage
   - Fill event details
   - Upload proposal/budget
   - Click "Submit for Approval"
   ↓
4. EventDetailPage (Status: pending_coordinator)
   - Wait for coordinator approval
   - Check status daily
   ↓
5. Coordinator approves
   ↓
6. EventDetailPage (Status: published)
   - Share event link with students
   - Monitor RSVP count
   ↓
7. Event day
   - Click "Start Event"
   - Conduct event
   - Take photos
   - Mark attendance via QR
   - Click "Complete Event"
   ↓
8. EventDetailPage (Status: pending_completion)
   - See completion checklist
   - Upload 5 photos
   - Upload event report
   - Upload attendance sheet
   - Upload bills
   ↓
9. All uploaded → Status: completed ✅
   ↓
10. EventDetailPage (Status: completed)
    - Click [Gallery] tab → See uploaded photos
    - Click [Documents] tab → View report
    - Click "Generate Report" → Go to ReportsPage
    - Download final event report
```

---

### **Journey 3: Coordinator Reviewing Event**

```
1. Login → Dashboard
2. See "Pending Approvals" widget
3. Click "Tech Talk 2024"
   ↓
4. EventDetailPage (Status: pending_coordinator)
   - Review event details
   - Check budget breakdown
   - Download proposal PDF
   - Click "✅ Approve"
   ↓
5. After event completion
   ↓
6. EventDetailPage (Status: completed)
   - Click [Gallery] tab → View photos
   - Click [Documents] tab:
     • View event report
     • Download attendance (verify count)
     • Check bills (verify budget usage)
   - Click "Generate Report"
     ↓
7. ReportsPage
   - Select "Club Activity Report"
   - Choose club + year
   - Include this event in report
   - Download PDF for records
```

---

### **Journey 4: Admin Generating Annual Report**

```
1. Login → Dashboard
2. Click "Reports" in navigation
   ↓
3. ReportsPage
   - Click [Reports] tab
   - Select "Annual Report"
   - Choose year: 2024
   - System fetches:
     • All completed events
     • All club activities
     • Budget utilization
     • Member statistics
   - Click "Generate PDF"
   ↓
4. Download annual_report_2024.pdf
5. Use for:
   - NAAC/NBA accreditation
   - College annual day
   - Management review
```

---

## 📂 **COMPLETE SITE MAP**

```
KMIT Clubs Hub
│
├── Public Routes
│   ├── / (Home/Landing)
│   ├── /login
│   ├── /register
│   └── /forgot-password
│
├── Student Routes
│   ├── /dashboard
│   │   └── Shows: Upcoming events, Clubs joined, Notifications
│   │
│   ├── /clubs
│   │   ├── /clubs (list all)
│   │   └── /clubs/:id (club detail)
│   │
│   ├── /events
│   │   ├── /events (list all)
│   │   ├── /events/:id (detail) ⭐ MAIN PAGE
│   │   │   ├── [Overview] tab
│   │   │   ├── [Gallery] tab ⭐ NEW
│   │   │   └── [Documents] tab ⭐ NEW
│   │   └── /events/:id/rsvp
│   │
│   ├── /recruitments
│   │   ├── /recruitments (list open)
│   │   ├── /recruitments/:id (detail)
│   │   └── /recruitments/:id/apply
│   │
│   └── /profile
│       ├── /profile (view own)
│       ├── /profile/edit
│       └── /profile/applications
│
├── Club Member Routes
│   ├── (All student routes +)
│   │
│   ├── /clubs/:clubId/members
│   ├── /clubs/:clubId/announcements
│   └── /clubs/:clubId/resources
│
├── Core Team Routes
│   ├── (All member routes +)
│   │
│   ├── /events/create ⭐
│   ├── /events/:id/edit
│   │
│   ├── /gallery ⭐
│   │   └── View/upload club photos
│   │
│   ├── /recruitments/create
│   └── /recruitments/:id/applications
│
├── Coordinator Routes
│   ├── (All core team routes +)
│   │
│   ├── /reports ⭐
│   │   ├── [Dashboard] tab
│   │   ├── [Reports] tab
│   │   └── [Audit Logs] tab
│   │
│   ├── /events/:id (approval view)
│   └── /clubs/:clubId/settings
│
└── Admin Routes
    ├── (All coordinator routes +)
    │
    ├── /admin/dashboard
    ├── /admin/users
    ├── /admin/clubs
    ├── /admin/settings
    └── /admin/audit-logs
```

---

## 🎨 **VISUAL PAGE HIERARCHY**

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              MAIN NAVIGATION BAR                   │
│  Home  Clubs  Events  Gallery  Reports  Profile   │
│                                                    │
└────────────────────────────────────────────────────┘
                      ↓
                      
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   EventsPage    │   │   GalleryPage   │   │   ReportsPage   │
│   (List View)   │   │  (Club Photos)  │   │  (Analytics)    │
│                 │   │                 │   │                 │
│  [Published]    │   │  Filter by:     │   │  [Dashboard]    │
│  [Ongoing]      │   │  • Club         │   │  [Reports]      │
│  [Completed]    │   │  • Album        │   │  [Audit Logs]   │
│  [Pending...]   │   │  • Event        │   │                 │
│                 │   │                 │   │  Generate:      │
│  [+ Create]     │   │  [+ Upload]     │   │  • Club Report  │
│                 │   │                 │   │  • NAAC Report  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         ↓                     ↓                     ↓
         
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              EventDetailPage (Main Hub)                     │
│                                                             │
│  ┌──────────┬──────────┬───────────┐                      │
│  │ Overview │ Gallery  │ Documents │                       │
│  └──────────┴──────────┴───────────┘                       │
│                                                             │
│  Overview Tab (Default):                                   │
│  • Event details                                           │
│  • RSVP button (students)                                  │
│  • Management actions (organizers)                         │
│  • Approval buttons (coordinator/admin)                    │
│  • Completion checklist (post-event)                       │
│                                                             │
│  Gallery Tab: ⭐ NEW                                        │
│  • Event photos grid                                       │
│  • Lightbox view                                           │
│  • Download buttons                                        │
│  • Upload button (if can manage)                           │
│  • Link to full GalleryPage                                │
│                                                             │
│  Documents Tab: ⭐ NEW                                      │
│  • Event report (PDF viewer)                               │
│  • Attendance sheet (download)                             │
│  • Bills/receipts (list)                                   │
│  • Upload buttons (if can manage)                          │
│  • Link to ReportsPage (generate report)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **IMPLEMENTATION PRIORITIES**

### **Priority 1: EventDetailPage Internal Structure** ⭐⭐⭐
- Add tab navigation
- Keep management actions in Overview tab
- Add empty Gallery and Documents tabs

### **Priority 2: Event Gallery Tab** ⭐⭐⭐
- Display event.photos[] in grid
- Add lightbox for fullscreen view
- Add download functionality
- Add link to GalleryPage

### **Priority 3: Event Documents Tab** ⭐⭐
- Display event report in PDF viewer
- Add download buttons for all documents
- Add upload buttons (if can manage)

### **Priority 4: Cross-Page Links** ⭐
- EventDetail → GalleryPage (with filters)
- EventDetail → ReportsPage (with event pre-selected)
- GalleryPage → EventDetail (from event photos)

---

## ✅ **SUMMARY**

**Key Relationships:**
1. **EventDetailPage is the HUB** - All event info in one place
2. **GalleryPage is for CLUB-WIDE photos** - All albums, all events
3. **ReportsPage is for ANALYTICS** - Aggregate data, statistics
4. **EventDetailPage tabs** = Event-specific viewing
5. **External links** = Cross-event/club-wide viewing

**User Benefits:**
- Students: See event photos easily
- Organizers: Upload and view materials in one place
- Coordinators: Verify completion without navigation
- Admins: Generate reports from event data

**Ready to implement? Start with Priority 1!** 🎉
