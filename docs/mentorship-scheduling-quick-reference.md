# Mentorship Scheduling - Quick Reference

## For Tutors

### Create Mentorship Offering

```
Navigate to: /tutor/mentorship/schedule
Click: "Create New Offering"
Fill form:
  - Title: e.g., "Advanced React 1:1 Mentoring"
  - Course: Select existing course (optional)
  - Description: What you'll cover
  - Duration: 30-180 minutes
  - Price: Cost in ₦
Click: "Create Offering"
```

**Result**: Offering goes live immediately, available for students to book

### View Your Offerings

Visit `/tutor/mentorship/schedule` to see:
- Course-linked offerings (grouped by course)
- Standalone offerings
- Delete button for each

### View Bookings

Visit `/tutor/mentorship` to see:
- "Approvals" tab: REQUEST mode approvals
- "Pending" tab: Scheduled bookings
- "Active" tab: In-progress sessions
- "Completed" tab: Finished bookings

## For Students

### Discover Mentorship from Course Completion

```
1. Complete a course
2. See "Master this course" card
3. Card shows 3-5 mentors offering mentorship
4. Click "Book" → Checkout
5. After payment → Session scheduled
6. Zoom link available in your dashboard
```

### Browse All Mentorship

```
Navigate to: /mentorship (marketplace)
Browse:
  - All available mentorship offerings
  - Filter by price, duration, mentor
  - See course associations
Click offering → Checkout → Book
```

### View Your Bookings

Visit `/student/mentorship` to see:
- "Book" tab: Browse/book offerings
- "Awaiting Approval" tab: REQUEST mode waiting
- "Approved" tab: Approved REQUEST mode (ready to pay)
- "Pending" tab: Scheduled sessions
- "History" tab: Past sessions
- "Rejected" tab: Rejected REQUEST sessions

## For Admins

### Monitor Mentorship Activity

**Database Queries**:

```sql
-- Find all offerings (not bookings)
SELECT * FROM mentorship_sessions 
WHERE isOffering = true
ORDER BY createdAt DESC;

-- Find offerings linked to a course
SELECT * FROM mentorship_sessions 
WHERE courseId = '{{courseId}}' AND isOffering = true;

-- Find actual bookings (not offerings)
SELECT * FROM mentorship_sessions 
WHERE isOffering = false
ORDER BY createdAt DESC;

-- Revenue by tutor
SELECT tutorId, COUNT(*) as bookings, SUM(price) as total_revenue
FROM mentorship_sessions 
WHERE isOffering = false AND paymentStatus = 'PAID'
GROUP BY tutorId;
```

## Key Differences

| Aspect | Offering | Booking |
|--------|----------|---------|
| `isOffering` | `true` | `false` |
| `studentId` | tutorId (placeholder) | actual student |
| Created by | Tutor | Student/System |
| Payment | No | Yes (Paystack) |
| Dashboard | Schedule page | Mentorship page |
| Visible to | All students | Only student who booked |

## Technical Details

### Database Fields

```typescript
courseId: string | null  // Optional: links to Course
isOffering: boolean      // true=offering, false=booking
```

### Action Functions

| Function | Purpose |
|----------|---------|
| `createMentorshipOffering()` | Create offering |
| `getTutorMentorshipOfferings()` | Fetch tutor's offerings |
| `getTutorCourses()` | Get linkable courses |
| `deleteMentorshipOffering()` | Delete offering |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mentorship/suggestions?courseId=X` | GET | Get offerings for a course |

### React Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Schedule Page | `/tutor/mentorship/schedule` | Create/manage offerings |
| Suggestions | `mentorship-course-suggestions.tsx` | Show on course completion |

## Revenue Flow

```
Student Books Offering
    ↓
Paystack Payment ₦5000
    ↓
✓ Payment Success
    ↓
Tutor Wallet + ₦3500 (70%)
Platform Wallet + ₦1500 (30%)
    ↓
Zoom Meeting Auto-Created
    ↓
Both Notified
    ↓
Session Ready to Join
```

## Common Tasks

### Task: Feature Flag Offering

**Not implemented yet** - all offerings auto-visible

Future: Add `isPublished: boolean` column

### Task: Set Offering as Unavailable

**Current**: Delete offering
**Better**: Add `isActive: boolean` (future enhancement)

### Task: Edit Offering Price

**Current**: Delete + recreate
**Better**: Add edit form (future enhancement)

Note: Must be careful with grandfathering existing paid sessions

### Task: Show Offering Analytics

**Not implemented yet** - need:
- Total bookings per offering
- Revenue per offering
- Completion rate per offering

## Messages & Notifications

### For Tutors

1. **New Offering Created**
   - Message: "✓ Mentorship offering created"
   - Action: View on schedule page

2. **Offering Booked**
   - Socket notification (real-time)
   - Message: "Student booked: [Offering Name]"
   - Action: Check pending bookings tab

### For Students

1. **Offering Booked**
   - Message: "✓ Mentorship session booked"
   - Action: Awaiting tutor approval (if REQUEST mode)

2. **Session Scheduled**
   - Socket notification
   - Message: "Your mentorship session is ready"
   - Action: Join session link available

3. **Session Starting Soon**
   - Notification (future): 15 min before
   - Message: "Your mentorship starts in 15 minutes"
   - Action: Click to join

## Troubleshooting

### Offering Not Appearing on Course Completion

1. Check offering exists: `isOffering = true`
2. Check course linked: `courseId = [courseId]`
3. Check status: `status = 'SCHEDULED'`
4. Check permissions: Tutor owns course

### Student Can't Book Offering

1. Ensure `isOffering = true`
2. Ensure tutor verified (future: add verification check)
3. Try refreshing page
4. Clear browser cache

### Zoom Link Missing After Payment

1. Check if Paystack payment confirmed
2. Check `paymentStatus = 'PAID'`
3. Check `meetingUrl` field populated
4. Fallback: Tutor can add URL manually

## Related Documentation

- [Mentorship System Overview](mentorship-system-overview.md)
- [Zoom Integration Guide](zoom-integration.md)
- [Payment Flow Documentation](payment-finalization.md)
