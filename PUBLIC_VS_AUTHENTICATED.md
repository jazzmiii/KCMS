# 🔐 Public vs Authenticated User Experience

## **Design Philosophy**

### **Public Homepage (Non-KMIT Visitors)**
**Goal:** Showcase KMIT clubs to attract interest and encourage registration

### **Student Dashboard (KMIT Students)**
**Goal:** Personalized hub for active participation and management

---

## **📊 Feature Comparison**

| Feature | Public Homepage (/) | Student Dashboard (/dashboard) |
|---------|-------------------|-------------------------------|
| **Authentication** | ❌ Not required | ✅ Required |
| **View Clubs** | ✅ All active clubs (basic info) | ✅ All clubs + MY clubs highlighted |
| **Club Details** | ❌ Limited (name, description, logo) | ✅ Full details + member list |
| **Events** | ✅ PUBLIC events only | ✅ All events + MY events + RSVP status |
| **Recruitments** | ❌ Not visible | ✅ Can view and apply |
| **Apply to Clubs** | ❌ Must register first | ✅ Can apply immediately |
| **Notifications** | ❌ None | ✅ Personalized notifications |
| **Profile** | ❌ N/A | ✅ Own profile management |
| **Dashboard Stats** | ✅ Generic (X clubs, Y events) | ✅ Personalized (MY clubs, MY events) |
| **Create Content** | ❌ No | ✅ Yes (if authorized) |

---

## **🎯 Data Visibility Rules**

### **1. Clubs**

#### **Public View (Homepage)**
```javascript
✅ SHOW:
- Club name
- Club logo
- Club category (technical, cultural, etc.)
- Short description (50 words max)
- Total member count (e.g., "120 members")

❌ HIDE:
- Member names/profiles
- Club president/core team details
- Internal meeting schedules
- Budget information
- Pending/draft clubs
```

#### **Authenticated View (Dashboard/Clubs Page)**
```javascript
✅ SHOW ALL OF ABOVE PLUS:
- Full member list with roles
- Club leadership details
- Upcoming club meetings
- My role in the club (if member)
- "Join" or "Apply" button
- Club contact details
- Event history
- Active recruitments
```

---

### **2. Events**

#### **Public View (Homepage)**
```javascript
✅ SHOW (if event.isPublic === true):
- Event name
- Event date/time
- Event venue
- Short description
- Organizing club
- Event poster/image

❌ HIDE:
- Internal events (club meetings, etc.)
- Attendance lists
- RSVP status
- Event budget
- Coordinator contact details
```

#### **Authenticated View (Dashboard)**
```javascript
✅ SHOW ALL OF ABOVE PLUS:
- ALL events (public + internal)
- My RSVP status
- "RSVP" button
- Attendance check-in option
- QR code (if attending)
- Event updates/announcements
- Related club details
```

---

### **3. Recruitments**

#### **Public View (Homepage)**
```javascript
❌ COMPLETELY HIDDEN
- Recruitments are internal
- Must be registered student to view
```

#### **Authenticated View (Dashboard)**
```javascript
✅ SHOW:
- All open recruitments
- Recruitment deadlines
- Application status
- "Apply Now" button
- Number of applicants (if coordinator)
- My submitted applications
```

---

### **4. Statistics**

#### **Public View (Homepage)**
```javascript
✅ SHOW (aggregated, generic):
{
  activeClubs: 13,      // Total active clubs
  totalEvents: 25,      // Public events count
  students: "1200+"     // Approximate, not exact
}
```

#### **Authenticated View (Dashboard)**
```javascript
✅ SHOW (personalized, specific):
{
  myClubs: 3,              // Clubs I'm member of
  myEvents: 5,             // Events I've RSVPd
  myApplications: 2,       // Pending applications
  upcomingEvents: 8,       // Events I can attend
  notifications: 12        // Unread notifications
}
```

---

## **🔒 Security Considerations**

### **Why Limit Public Data?**

1. **Privacy Protection**
   - Student personal info shouldn't be public
   - Member lists are internal
   - Applications contain sensitive data

2. **Competitive Advantage**
   - Club strategies remain internal
   - Budget details not exposed
   - Internal planning not visible

3. **GDPR/Data Protection**
   - Only show what users consented to share
   - Respect data minimization principle

4. **Spam Prevention**
   - Email addresses not exposed
   - Phone numbers not public
   - Prevents scraping

---

## **💡 Best Practices Implemented**

### **Public Homepage**
```javascript
// ✅ GOOD: Fetch public data without authentication
fetch('/api/clubs?status=active&limit=12')

// ❌ BAD: Don't expose sensitive endpoints
// fetch('/api/clubs?includeBudget=true')
```

### **Student Dashboard**
```javascript
// ✅ GOOD: Authenticated requests with personalization
fetch('/api/users/me/clubs', {
  headers: { Authorization: `Bearer ${token}` }
})

// ✅ GOOD: Show different data based on role
if (user.role === 'president') {
  showManagementOptions()
}
```

---

## **🎨 UX Differences**

### **Public Homepage Flow**
```
1. Visitor lands on homepage
2. Sees list of clubs (names + logos)
3. Reads about KMIT clubs
4. Sees "Join Now" / "Register" CTA
5. Clicks → Goes to /register
6. Completes registration
7. Now becomes authenticated student
```

### **Student Dashboard Flow**
```
1. Student logs in
2. Lands on personalized dashboard
3. Sees "Welcome back, [Name]!"
4. Views MY clubs, MY events
5. Sees notifications badge
6. Can immediately:
   - Apply to recruitments
   - RSVP to events
   - Join new clubs
   - Manage profile
```

---

## **🔄 Recommended Implementation**

### **Backend API Design**

#### **Public Endpoint (No Auth)**
```javascript
// GET /api/clubs/public
// Returns: Basic club info for marketing
exports.getPublicClubs = async (req, res) => {
  const clubs = await Club.find({ status: 'active' })
    .select('name logo category description')
    .limit(20);
  res.json({ clubs });
};
```

#### **Authenticated Endpoint (With Auth)**
```javascript
// GET /api/clubs
// Returns: Full club info + user-specific data
exports.getClubs = async (req, res) => {
  const clubs = await Club.find({ status: 'active' })
    .select('name logo category description members budget events')
    .populate('members', 'name profilePhoto');
  
  // Add user-specific data
  const myClubs = clubs.map(club => ({
    ...club.toObject(),
    isMember: club.members.includes(req.user.id),
    myRole: getUserRoleInClub(req.user.id, club)
  }));
  
  res.json({ clubs: myClubs });
};
```

---

## **✅ Summary**

### **Public Homepage Should:**
- ✅ Show enough to attract interest
- ✅ Be fast and lightweight
- ✅ Not require authentication
- ✅ Have clear "Register" CTA
- ✅ Show only public/marketing info
- ✅ Be SEO-friendly

### **Student Dashboard Should:**
- ✅ Be personalized and dynamic
- ✅ Require authentication
- ✅ Show user-specific data
- ✅ Enable actions (apply, RSVP, manage)
- ✅ Display notifications
- ✅ Reflect user's role/permissions

---

## **🎯 Answer to Your Question**

**"Is it a good idea to have dynamic data on homepage?"**

**YES**, but with these rules:

1. **Keep it PUBLIC and GENERIC**
   - Show club names, logos, categories
   - Show aggregate stats
   - Show public events

2. **Don't expose sensitive data**
   - No member lists
   - No budget info
   - No internal content

3. **Make it fast**
   - Cache the results
   - Limit to 12-20 clubs
   - Don't load heavy data

4. **Have a clear CTA**
   - "Register to join" button
   - "Login for full access"

**"What's the difference between student and non-KMIT visitor?"**

| Visitor | Student |
|---------|---------|
| Sees marketing page | Sees personalized dashboard |
| Basic club info | Full club details + membership |
| Can't apply/RSVP | Can apply/RSVP immediately |
| Generic stats | Personalized stats |
| Static content | Dynamic, real-time content |
| No notifications | Gets notifications |
| No profile | Has profile |

---

**Your current implementation is GOOD!** ✅

The public homepage now shows real clubs from database, which is excellent for:
- SEO (search engines see real content)
- Marketing (visitors see actual clubs)
- Transparency (shows KMIT's active clubs)
- Attracting registrations

Just make sure:
- ✅ Backend `/api/clubs` endpoint doesn't require auth for basic listing
- ✅ It only returns `status: 'active'` clubs
- ✅ It doesn't return sensitive fields (budget, member emails, etc.)
- ✅ Dashboard shows different, personalized data when logged in
