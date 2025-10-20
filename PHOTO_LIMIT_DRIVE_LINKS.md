# 🔒 10 PHOTO LIMIT + GOOGLE DRIVE LINKS

**Date:** October 19, 2025  
**Reason:** Cloudinary free tier = 25GB total  
**Solution:** 10 Cloudinary photos + unlimited Drive links per club

---

## 🎯 **THE PROBLEM**

**Cloudinary Free Tier:**
- Total storage: 25GB
- Shared across ALL clubs
- Need sustainable solution

**Our Solution:**
- Each club: **10 photos max on Cloudinary**
- Additional photos: **Google Drive links**
- Unlimited photos via Drive

---

## ✅ **WHAT'S IMPLEMENTED**

### **1. Upload Limit Check** ✅

**Before Upload:**
```javascript
// Checks current Cloudinary photo count
const currentCount = await Document.countDocuments({
  club: clubId,
  type: 'photo',
  storageType: 'cloudinary'
});

if (currentCount + newPhotos > 10) {
  throw Error('Cloudinary limit reached! Use Drive links.');
}
```

**Error Response:**
```json
{
  "message": "Cloudinary photo limit reached! You can only upload 3 more photo(s). Use Google Drive links for additional photos. Current: 7/10",
  "code": "PHOTO_LIMIT_EXCEEDED",
  "details": {
    "limit": 10,
    "current": 7,
    "attempting": 5,
    "remaining": 3
  }
}
```

---

### **2. Google Drive Link Support** ✅

**New Storage Types:**
- `cloudinary` - Uploaded to Cloudinary (counts toward limit)
- `drive` - Google Drive folder link (doesn't count)
- `external` - Other external links

**Drive Metadata:**
```javascript
driveMetadata: {
  folderId: String,      // Extracted from URL
  folderName: String,    // Display name
  photoCount: Number,    // Estimated count
  description: String    // Optional description
}
```

---

### **3. Photo Quota API** ✅

**Endpoint:** `GET /api/clubs/:clubId/documents/quota`

**Response:**
```json
{
  "cloudinary": {
    "used": 7,
    "limit": 10,
    "remaining": 3,
    "percentage": 70
  },
  "drive": {
    "linkCount": 2,
    "estimatedPhotos": 45
  },
  "total": {
    "photos": 52
  }
}
```

**Use Case:** Show quota in UI before upload

---

## 📋 **API ENDPOINTS**

### **1. Add Google Drive Link**

```http
POST /api/clubs/:clubId/documents/drive-link
Authorization: Bearer <token>
Content-Type: application/json

{
  "album": "Navaraas - 2025",
  "driveUrl": "https://drive.google.com/drive/folders/1ABC-xyz123",
  "folderName": "Navaraas Event Photos",
  "photoCount": 35,
  "description": "Additional event photos on Google Drive"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Drive link added successfully",
  "data": {
    "document": {
      "_id": "...",
      "album": "Navaraas - 2025",
      "type": "photo",
      "storageType": "drive",
      "url": "https://drive.google.com/drive/folders/1ABC-xyz123",
      "driveMetadata": {
        "folderId": "1ABC-xyz123",
        "folderName": "Navaraas Event Photos",
        "photoCount": 35,
        "description": "..."
      }
    }
  }
}
```

---

### **2. Check Photo Quota**

```http
GET /api/clubs/:clubId/documents/quota
Authorization: Bearer <token>
```

**Response:** (See above example)

---

### **3. Regular Upload (with limit)**

```http
POST /api/clubs/:clubId/documents/bulk-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: [file1, file2, ...]
album: "Navaraas - 2025"
```

**Success:** Uploads if under limit  
**Error:** Returns PHOTO_LIMIT_EXCEEDED if over limit

---

## 🔄 **USER WORKFLOW**

### **Scenario 1: First Upload (Under Limit)**

```
1. User uploads 5 photos
   ↓
2. System checks: 0 existing photos
   ↓
3. 0 + 5 = 5 ≤ 10 ✅
   ↓
4. Upload succeeds
   ↓
5. Cloudinary count: 5/10
```

---

### **Scenario 2: Hit the Limit**

```
1. User has 7 photos on Cloudinary
   ↓
2. User tries to upload 5 more photos
   ↓
3. System checks: 7 + 5 = 12 > 10 ❌
   ↓
4. Error: "Can only upload 3 more photos"
   ↓
5. Shows: Use Drive links for additional photos
```

---

### **Scenario 3: Use Drive Link**

```
1. User hits 10 photo limit
   ↓
2. User uploads remaining photos to Google Drive
   ↓
3. User creates shareable folder link
   ↓
4. User adds Drive link via API/UI:
   - Album: "Navaraas - 2025"
   - URL: https://drive.google.com/...
   - Count: 35 photos
   ↓
5. Drive link added successfully
   ↓
6. Total photos: 10 (Cloudinary) + 35 (Drive) = 45
```

---

## 🎨 **FRONTEND INTEGRATION**

### **1. Show Quota Before Upload**

```javascript
// Check quota first
const quota = await documentService.getPhotoQuota(clubId);

if (quota.cloudinary.remaining === 0) {
  alert(
    'Cloudinary limit reached! ' +
    'You have ' + quota.cloudinary.used + '/10 photos uploaded. ' +
    'Please use Google Drive links for additional photos.'
  );
  showDriveLinkForm();
} else {
  alert(`You can upload ${quota.cloudinary.remaining} more photos`);
  showUploadForm();
}
```

---

### **2. Handle Upload Error**

```javascript
try {
  await documentService.bulkUpload(clubId, files, { album });
} catch (error) {
  if (error.response?.data?.code === 'PHOTO_LIMIT_EXCEEDED') {
    const details = error.response.data.details;
    
    alert(
      `Limit reached! You can only upload ${details.remaining} more photos.\n` +
      `Current: ${details.current}/${details.limit}\n\n` +
      `Please use Google Drive links for additional photos.`
    );
    
    // Show Drive link form
    setShowDriveForm(true);
  }
}
```

---

### **3. Add Drive Link Form**

```javascript
const handleDriveLink = async () => {
  try {
    await documentService.addDriveLink(clubId, {
      album: selectedAlbum,
      driveUrl: driveUrl,
      folderName: folderName,
      photoCount: parseInt(photoCount),
      description: description
    });
    
    alert(`Drive link added! ${photoCount} photos linked to ${album}`);
    refreshGallery();
  } catch (error) {
    alert('Failed to add Drive link: ' + error.message);
  }
};
```

---

### **4. Display in Gallery**

```javascript
// In gallery list
{documents.map(doc => (
  doc.storageType === 'cloudinary' ? (
    // Show normal image
    <img src={doc.url} alt={doc.metadata.filename} />
  ) : doc.storageType === 'drive' ? (
    // Show Drive link card
    <div className="drive-link-card">
      <FaGoogleDrive />
      <h4>{doc.driveMetadata.folderName}</h4>
      <p>{doc.driveMetadata.photoCount} photos</p>
      <a href={doc.url} target="_blank">Open in Drive</a>
    </div>
  ) : null
))}
```

---

## 📊 **STORAGE BREAKDOWN**

### **Per Club:**
```
Cloudinary Photos: 10 max
└─ High quality
└─ Fast CDN delivery
└─ Counts toward 25GB limit

Drive Links: Unlimited
└─ Unlimited storage (user's Drive)
└─ No cost to system
└─ Opens in Google Drive
```

### **System-Wide:**
```
Total clubs: 50
Max Cloudinary photos: 50 × 10 = 500 photos
Avg photo size: 500KB (optimized WebP)
Total usage: 500 × 0.5MB = 250MB

Result: Well within 25GB limit! ✅
```

---

## 🧪 **TESTING**

### **Test 1: Upload Under Limit**

```bash
# Upload 5 photos (club has 0)
POST /api/clubs/68ea.../documents/bulk-upload
files: [5 photos]
album: "Test Album"

Expected: ✅ Success
```

---

### **Test 2: Hit Limit**

```bash
# Upload 5 photos (club has 8)
POST /api/clubs/68ea.../documents/bulk-upload
files: [5 photos]

Expected: ❌ Error
{
  "code": "PHOTO_LIMIT_EXCEEDED",
  "details": {
    "current": 8,
    "remaining": 2
  }
}
```

---

### **Test 3: Add Drive Link**

```bash
POST /api/clubs/68ea.../documents/drive-link
{
  "album": "Test Album",
  "driveUrl": "https://drive.google.com/drive/folders/1ABC",
  "folderName": "More Photos",
  "photoCount": 25
}

Expected: ✅ Success
```

---

### **Test 4: Check Quota**

```bash
GET /api/clubs/68ea.../documents/quota

Expected:
{
  "cloudinary": {
    "used": 10,
    "remaining": 0
  },
  "drive": {
    "linkCount": 1,
    "estimatedPhotos": 25
  }
}
```

---

## 📁 **FILES MODIFIED**

1. **`Backend/src/modules/document/document.model.js`**
   - Added `storageType` field
   - Added `driveMetadata` object
   - Lines: 13-31 (modified/added)

2. **`Backend/src/modules/document/document.service.js`**
   - Added upload limit check in `bulkUpload()`
   - Added `addDriveLink()` method
   - Added `getPhotoQuota()` method
   - Lines: ~150 added

3. **`Backend/src/modules/document/document.controller.js`**
   - Added `addDriveLink` controller
   - Added `getPhotoQuota` controller
   - Lines: ~25 added

4. **`Backend/src/modules/document/document.routes.js`**
   - Added POST `/drive-link` route
   - Added GET `/quota` route
   - Lines: 2 routes added

**Total:** 4 files modified, ~200 lines added

---

## ✅ **BENEFITS**

### **Cost Savings:**
- ✅ Stay within Cloudinary free tier
- ✅ No storage costs
- ✅ Scalable to unlimited clubs

### **User Experience:**
- ✅ First 10 photos: Fast CDN delivery
- ✅ Additional photos: Google Drive
- ✅ Clear limit messaging
- ✅ Easy Drive link addition

### **Flexibility:**
- ✅ High-quality photos on Cloudinary
- ✅ Bulk photos on Drive
- ✅ Best of both worlds

---

## 🎯 **NEXT STEPS**

### **Immediate:**
1. ✅ Backend implemented
2. ⚠️ Test all 3 endpoints
3. ⚠️ Update frontend UI

### **Frontend Tasks:**
1. Add quota check before upload
2. Show remaining photo count
3. Add Drive link form
4. Display Drive links in gallery
5. Add Drive icon/badge
6. Update upload error handling

### **Optional Enhancements:**
1. Auto-detect Drive folder photo count
2. Preview Drive folder thumbnails
3. Batch Drive link import
4. Export gallery to Drive

---

## 📞 **SUPPORT**

**When Limit Reached:**
```
"You've reached the 10 photo limit for Cloudinary storage.

To add more photos:
1. Upload your photos to Google Drive
2. Create a shareable folder link
3. Add the Drive link here with photo count

Your photos will be accessible to viewers via the Drive link!"
```

---

**Status:** ✅ IMPLEMENTED & READY TO TEST

**Backend auto-reloaded with all changes!** 🎉
