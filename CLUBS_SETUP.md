# KMIT Clubs Setup Guide

## Quick Start: Populate All 13 Clubs

### Step 1: Navigate to Backend
```bash
cd Backend
```

### Step 2: Run the Seed Script
```bash
npm run seed:clubs
```

This will create all 13 KMIT clubs in your database:

1. ✅ **Organising Committee** (Social)
2. ✅ **Public Relations** (Social)
3. ✅ **Aakarshan Art Club** (Arts)
4. ✅ **AALP Music Club** (Cultural)
5. ✅ **Abhinaya Drama Club** (Cultural)
6. ✅ **Riti Fashion Club** (Arts)
7. ✅ **KMITRA - E-Magazine & Blog** (Cultural)
8. ✅ **Mudra Dance Club** (Cultural)
9. ✅ **Recurse Coding Club** (Technical)
10. ✅ **Traces of Lenses Photography Club** (Arts)
11. ✅ **Vachan Speakers Club** (Social)
12. ✅ **Kreeda Sports Club** (Sports)
13. ✅ **Rotaract Club** (Social)

---

## How It Works

### Public Access (HomePage)
- **No login required**
- Shows basic club information (name, description, logo, category)
- Hardcoded in `HomePage.jsx` for fast loading
- Great for visitors and prospective students

### Student Access (After Login)
- **Login required** (KMIT students only)
- Full club details with vision, mission, events
- Can apply to clubs through recruitment
- Can view club-specific events and activities
- Access via `/clubs` route

### Architecture
```
Public HomePage (No Auth)
    ↓
    Shows 13 clubs (static data)
    ↓
    "Register" button → Student signup
    
Student Dashboard (Auth Required)
    ↓
    Fetches clubs from database
    ↓
    View details, apply, join events
```

---

## Logo Files Location

Make sure logo files exist at:
```
Frontend/public/logos/
```

Or update the `logoUrl` in the seed script to match your actual logo paths.

---

## Verification

After running the seed script:

1. **Check Database**
   ```bash
   # In MongoDB shell or Compass
   db.clubs.find().count()  // Should return 13
   ```

2. **Test API**
   ```bash
   # Start backend server
   npm run dev
   
   # Test endpoint (in another terminal)
   curl http://localhost:5000/api/clubs
   ```

3. **Test Frontend**
   - Start frontend: `cd Frontend && npm run dev`
   - Login as student
   - Navigate to `/clubs`
   - All 13 clubs should be visible

---

## Benefits of This Approach

✅ **Separation of Concerns**
- Public page: Fast, static, no auth needed
- Student pages: Dynamic, full features, authenticated

✅ **Security**
- Non-KMIT visitors can't access detailed club info
- Only registered students can apply to clubs

✅ **Performance**
- HomePage loads instantly (no API calls)
- Student dashboard fetches real-time data

✅ **Maintainability**
- Single source of truth (database)
- Easy to update club information
- Coordinators can manage their clubs

---

## Need Help?

See detailed documentation in:
- `Backend/scripts/README.md` - Full seeding documentation
- `Backend/scripts/seedClubs.js` - The actual seed script

---

**Created by:** KMIT Clubs Hub Team  
**Last Updated:** October 2025
