# Mentorship Scheduling & Course Linking Implementation

## Overview

This document describes the new mentorship scheduling feature that allows tutors to pre-create mentorship offerings and link them to their courses for upselling to course completers.

## Feature Description

### What is a Mentorship Offering?

A mentorship offering is a pre-created mentorship availability that a tutor creates (similar to a product listing). Unlike actual mentorship bookings (which happen after payment), offerings are:

- **Created by tutors** to outline their availability
- **Optionally linked to courses** they teach (to upsell to course completers)
- **Marked with `isOffering: true`** in the database to distinguish from actual bookings
- **Listed in the mentorship marketplace** for students to discover and book
- **Suggested to students** who complete linked courses

### How Students Discover Mentorship

**Option 1: Marketplace Browse**
- Student visits `/mentorship` (marketplace)
- Sees available mentorship offerings from all tutors
- Can filter by course they're enrolled in/completed
- Sees course association badges/tags

**Option 2: Course Completion Upsell**
- Student completes a course
- System shows "Master this course with mentorship" card
- Suggests 3-5 mentorship offerings linked to that course
- One-click book button takes them to booking flow

## Database Schema Changes

### MentorshipSession Model Enhancements

```prisma
model MentorshipSession {
  // ... existing fields ...
  
  // NEW FIELDS
  courseId        String?                 // Links mentorship to a course
  isOffering      Boolean                 @default(false) // true = offering, false = actual booking
  
  // RELATIONS
  course          Course?                 @relation(fields: [courseId], references: [id], onDelete: SetNull)
}

// Add to Course model
model Course {
  // ... existing fields ...
  mentorshipSessions     MentorshipSession[]  // NEW relation
}
```

### Why `isOffering` Flag?

The `isOffering` boolean field distinguishes:
- **`isOffering: true`** → Pre-created tutor offering (can have studentId = tutorId as placeholder)
- **`isOffering: false`** → Actual student booking (studentId = actual student)

This avoids needing a separate `MentorshipOffering` table.

## File Structure

### New Files Created

```
app/(root)/tutor/mentorship/schedule/page.tsx
  └─ Tutors create/manage mentorship offerings
  
components/mentorship-course-suggestions.tsx
  └─ Show mentorship suggestions on course completion
  
app/api/mentorship/suggestions/route.ts
  └─ API endpoint to fetch offerings for a course
```

### Modified Files

```
prisma/schema.prisma
  └─ Added courseId & isOffering to MentorshipSession
  └─ Added mentorshipSessions relation to Course

actions/mentorship-revenue.ts
  └─ createMentorshipOffering()
  └─ getTutorMentorshipOfferings()
  └─ getTutorCourses()
  └─ deleteMentorshipOffering()

app/(root)/tutor/mentorship/page.tsx
  └─ Added "Create Offering" button linking to schedule page
```

## Implementation Details

### 1. Schedule Page (`/tutor/mentorship/schedule`)

**Purpose**: Tutors manage their mentorship offerings

**Features**:
- Dialog form to create new offerings
- Course selector (optional link to existing course)
- Standalone option (no course link)
- List of existing offerings grouped by course-linked vs standalone
- Delete button for each offering

**Form Fields**:
- Title (required): e.g., "React Mastery 1:1 Sessions"
- Course Link (optional): Dropdown of tutor's courses
- Description: What will be covered
- Duration: Session length in minutes (30, 45, 60, 90, 120, 180)
- Price: Cost per session in ₦

**UI Components**:
```typescript
// Create offering dialog
- Title input
- Course selector (dropdown)
- Duration selector (preset options)
- Price input with ₦ symbol

// Offerings list
- Grouped by course-linked and standalone
- Card per offering with:
  - Title
  - Course name (if linked)
  - Duration + Price display
  - View Details button
  - Delete button
```

### 2. Course Suggestions Component

**Purpose**: Suggest mentorship to students after course completion

**Usage**:
```tsx
import CourseMentorshipSuggestions from '@/components/mentorship-course-suggestions';

// On course completion page
<CourseMentorshipSuggestions courseId={course.id} studentId={student.id} />
```

**Features**:
- Fetches up to 5 mentorship offerings for the course
- Shows tutor name, duration, price
- "Book" button for quick action
- "View All Mentors" button for more options
- Dismiss option (localStorage tracking planned)

**API Response**:
```json
{
  "suggestions": [
    {
      "id": "cuid",
      "title": "React Mastery 1:1",
      "description": "Deep dive into advanced React patterns",
      "duration": 60,
      "price": 5000,
      "tutor": {
        "name": "John Doe",
        "avatar": "url"
      }
    }
  ],
  "total": 1
}
```

### 3. Action Functions

#### `createMentorshipOffering()`

**Purpose**: Create a new mentorship offering

**Authorization**: TUTOR or MENTOR role required

**Validation**:
- If courseId provided: verify tutor owns/created the course
- Reject if tutor doesn't own course

**Behavior**:
- Creates MentorshipSession with `isOffering: true`
- Sets studentId = tutorId (placeholder)
- Sets status = "SCHEDULED"
- Returns offering with course details

```typescript
// Input
{
  title: string;
  description?: string;
  duration: number;
  price: number;
  courseId?: string | null;
}

// Output
MentorshipSession {
  id, title, description, duration, price, courseId,
  isOffering: true, status: "SCHEDULED",
  course: { id, title, slug }
}
```

#### `getTutorMentorshipOfferings()`

**Purpose**: Fetch all offerings created by the logged-in tutor

**Filters**:
- `tutorId` = current user
- `isOffering` = true
- `status` = "SCHEDULED"

**Returns**: Array of offerings with course details

#### `getTutorCourses()`

**Purpose**: Fetch courses linkable to mentorship (for form select)

**Filters**: Courses where user is tutor or creator

**Returns**: Array of { id, title, slug, price, thumbnail }

#### `deleteMentorshipOffering()`

**Purpose**: Delete an offering (not actual bookings)

**Authorization**: Only tutor who created it

**Validation**: `isOffering` must be true

## Payment & Booking Flow

### When Student Books an Offering

**Current behavior**:
1. Student sees offering in marketplace or course suggestions
2. Clicks "Book" → goes to checkout page with offering details
3. Pays via Paystack
4. `beginMentorshipCheckout()` creates NEW MentorshipSession:
   - `isOffering: false` (actual booking)
   - `studentId` = actual student
   - `tutorId` = offering's tutor
   - `courseId` = inherited from offering (if linked)
   - `bookingMode` = "INSTANT" (or "REQUEST")
5. After payment: Zoom meeting auto-generated
6. Session appears in both tutors/students' dashboards

**Key insight**: Offerings (`isOffering: true`) and bookings (`isOffering: false`) coexist in same table

## Student Experience

### 1. Course Completion → Mentorship Upsell

```
┌─ Student completes course
│
├─ Course completion page loads
│
├─ CourseMentorshipSuggestions component fetches suggestions
│
├─ Shows card: "Master this course with mentorship"
│  ├─ Lists 3-5 instructors offering mentorship
│  ├─ Shows: name, session length, price
│  └─ "Book" button or "View All" link
│
└─ Student can:
   ├─ Book directly (card close enough)
   └─ Dismiss for later
```

### 2. Marketplace Browse

```
┌─ Student visits /mentorship
│
├─ Shows all available mentorship offerings
│
└─ Can filter:
   ├─ By mentor
   ├─ By price range
   ├─ By duration
   ├─ By courses I'm enrolled in (future)
   └─ By courses I've completed (future)
```

## Tutor Experience

### Creating Offerings

```
┌─ Tutor visits /tutor/mentorship/schedule
│
├─ Clicks "Create New Offering"
│
├─ Dialog opens with form:
│  ├─ Title: "React Mastery 1:1"
│  ├─ Course: [Select React Course]
│  ├─ Duration: 60 minutes
│  ├─ Price: ₦5000
│  └─ Submit button
│
└─ Offering created and listed
   ├─ Shows on schedule page
   ├─ Available for students to book
   └─ Appears in course completion suggestions
```

### Managing Offerings

- **View offerings** grouped by course-linked vs standalone
- **Edit offering** (future: add edit button)
- **Delete offering** (if no active bookings)
- **See booking metrics** (future: add "View Bookings" button)

## Revenue Model

### Offering → Booking → Payment

1. **Offering Creation**: Free, just listing availability
2. **Student Books**: Creates booking in Paystack → payment
3. **Payment Successful**: 
   - Tutor wallet += 70% of price
   - Platform wallet += 30% of price
   - Zoom meeting auto-created
   - Notifications sent

## API Endpoints

### GET `/api/mentorship/suggestions`

**Query Params**:
- `courseId` (required): Course to get suggestions for

**Response**:
```json
{
  "suggestions": [
    {
      "id": "cuid",
      "title": "React Mastery 1:1",
      "description": "...",
      "duration": 60,
      "price": 5000,
      "tutor": {
        "name": "John Doe",
        "avatar": "url"
      }
    }
  ],
  "total": 1
}
```

## Database Queries

### Find Course's Mentorship Offerings

```sql
SELECT * FROM mentorship_sessions
WHERE courseId = 'course_id' 
  AND isOffering = true
  AND status = 'SCHEDULED'
LIMIT 5;
```

### Find Tutor's All Offerings

```sql
SELECT * FROM mentorship_sessions
WHERE tutorId = 'tutor_id'
  AND isOffering = true
  AND status = 'SCHEDULED'
ORDER BY createdAt DESC;
```

### Distinguish Offerings from Bookings

```sql
-- Only offerings (pre-created)
SELECT * FROM mentorship_sessions WHERE isOffering = true;

-- Only actual bookings
SELECT * FROM mentorship_sessions WHERE isOffering = false;
```

## Future Enhancements

1. **Offering Analytics**
   - How many times booked
   - Revenue generated per offering
   - Student feedback/ratings

2. **Edit Offerings**
   - Allow tutors to modify title, price, duration
   - Grandfathering (keep old price for paid but unstarted sessions)

3. **Bulk Offering Management**
   - Create multiple offerings at once
   - Template offerings (copy previous)

4. **Advanced Course Filtering**
   - Students filter mentorship by "courses I completed"
   - Show mentorship as course "add-on" in marketplace

5. **Drip Campaigns**
   - Send email to course completers with mentorship offer
   - Remind "don't forget mentorship" after X days

6. **Mentorship Packages**
   - Create packages: "3 sessions for ₦12,000"
   - Students buy package, schedule sessions

7. **Scheduling System**
   - Tutors set available time slots
   - Students pick slot when booking
   - Calendar integration (Google, Outlook)

## Testing Checklist

- [ ] Create mentorship offering (linked to course)
- [ ] Create standalone mentorship offering
- [ ] List offerings on schedule page
- [ ] Delete offering
- [ ] Visit course completion page (shows suggestions)
- [ ] Fetch suggestions API
- [ ] Book offering from suggestions card
- [ ] Book offering from marketplace
- [ ] Verify Zoom meeting created after payment
- [ ] Verify tutor sees booking in dashboard
- [ ] Verify student sees booked session in dashboard

## Notes

- Offerings are NOT counted as "bookings" in tutor dashboard (different filtering)
- Students can't see their own "placeholder" offerings they created as tutors
- Each offering is standalone; no "linked bookings" concept needed
- Course linkage is optional; standalone mentorship works without course
- Future: could add "published" boolean to control visibility
