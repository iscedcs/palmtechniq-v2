# Mentorship System Restructure - Setup & Implementation Guide

**Last Updated:** February 19, 2026  
**Version:** 1.0

## Overview

This guide covers the complete restructured mentorship system with REQUEST/INSTANT booking modes, mentor approvals, Zoom integration, and virtual session management.

---

## 1. Environment Configuration

### Zoom API Setup

Add these credentials to your `.env.local` file:

```env
# Zoom Server-to-Server OAuth Credentials
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_app_client_id
ZOOM_CLIENT_SECRET=your_zoom_app_client_secret

# Public URL for payment callbacks
NEXT_PUBLIC_URL=http://localhost:3000  # or production URL
```

#### Getting Zoom Credentials:

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us)
2. Create a new "Server-to-Server OAuth" app
3. Copy the `Account ID`, `Client ID`, and `Client Secret`
4. Set redirect URIs: `http://localhost:3000/api/mentorship/* ` (and production URLs)
5. Enable these scopes:
   - `meeting:write`
   - `meeting:read`
   - `user:read`

---

## 2. Database Schema Changes

### New Enum Values Added

**SessionStatus** enum now includes:
- `PENDING_MENTOR_REVIEW` - REQUEST mode initial state (awaiting mentor approval)
- `REJECTED` - Mentor rejected the REQUEST

**MentorshipSession** model new fields:
- `approvalNotes: String?` - Why mentor rejected (optional)
- `rejectedAt: DateTime?` - When session was rejected
- `approvalDeadline: DateTime?` - Auto-reject deadline for REQUEST mode (72 hours, future feature)

### Run Migration

```bash
# Prisma migration already created
pnpm prisma migrate deploy

# Regenerate Prisma client
pnpm prisma generate
```

---

## 3. Booking Flow & Payment

### Mode: INSTANT

```
1. Student clicks "Book Now"
2. Fills booking details (Date, Time, Duration, Topic)
3. Selects INSTANT mode
4. Redirects to Paystack payment
5. Payment confirmed:
   → Session created with status: SCHEDULED
   → Zoom meeting auto-generated
   → Tutor wallet updated (+70% of payment)
   → Student & Tutor notified
6. Student can view meeting & join when live
```

### Mode: REQUEST

```
1. Student clicks "Request Mentorship"
2. Fills booking details
3. Selects REQUEST mode
4. Session created with status: PENDING_MENTOR_REVIEW
5. Student sees "Awaiting Mentor Approval" tab
6. Mentor receives notification
7. Mentor logs in → /tutor/mentorship → "Approvals" tab
8. Mentor reviews request:
   a) APPROVE → Student gets "Proceed to Payment" prompt
   b) REJECT → Session marked REJECTED with reason
9. If approved, student initiates payment (same as INSTANT flow)
10. Once paid → Zoom meeting created → Session ready
```

---

## 4. Component Changes

### New Components Created

#### `components/pages/tutor/mentorship-pending-approvals.tsx`

Displays pending REQUEST mode bookings for mentors to approve/reject.

**Props:**
- `initialSessions: PendingSession[]` - List of pending requests
- `onSessionUpdated?: () => void` - Callback to refresh data

**Features:**
- Approve button → Updates session status, notifies student
- Reject dialog → Requires rejection reason
- Displays student info, session details, pricing

#### New API Routes

**`app/api/mentorship/session/[sessionId]/route.ts`**
- GET: Fetch session details with full participant info
- Protected: Only student/tutor/admin can view

**`app/api/mentorship/proceed-payment/route.ts`**
- POST: Process payment for approved REQUEST sessions
- Required: `sessionId` in request body
- Returns: Paystack authorization URL

### Updated Pages

#### `app/(root)/tutor/mentorship/page.tsx`

Changes:
- Added "Pending Approvals" tab with yellow notification dot
- Integrated `MentorshipPendingApprovals` component
- Loads both sessions and pending approvals on mount
- Stat cards updated: +1 for pending approvals count

#### `app/(root)/student/mentorship/page.tsx`

Changes:
- Added "Awaiting Approval" tab (sorted first)
- Added "Rejected" tab for declined requests
- Filters sessions by REQUEST/PENDING_MENTOR_REVIEW status
- "Request Again" button on rejected sessions
- Updated tab structure: Approvals → Upcoming → History → Rejected → Book

#### `app/(root)/mentorship/session/[sessionId]/page.tsx` (NEW)

New page with:
- **Zoom Meeting Embed** - Live video conference when session is active
- **Meeting Link Display** - Copy/share button for meeting URL
- **Session Details** - Time, duration, price, participants
- **Join Button** - Only visible when session is live (current time within session window)
- **Status Badge** - Shows SCHEDULED, IN_PROGRESS, COMPLETED states
- **Participant Cards** - Student & Tutor info with avatars

---

## 5. Zoom Integration

### Implementation Details

**File:** `lib/zoom-integration.ts`

**Key Functions:**

```typescript
// Create Zoom meeting for a session
createZoomMeeting(input: ZoomMeetingInput): Promise<ZoomMeetingResponse>

// Get existing meeting details
getZoomMeeting(meetingId: string): Promise<ZoomMeetingResponse>

// Update meeting (topic, time, duration)
updateZoomMeeting(meetingId: string, updates: Partial<ZoomMeetingInput>): void

// Cancel meeting
deleteZoomMeeting(meetingId: string): void

// Get recording(s) from completed session
getZoomMeetingRecordings(meetingId: string): Promise<Recording[]>
```

**Error Handling:**

All Zoom errors are caught and logged. If meeting creation fails during payment finalization:
- Payment still succeeds ✓
- Session marked as SCHEDULED
- Tutor notified to add meeting URL manually
- Error logged: `[Zoom Meeting Creation Failed] Session: {id}, Error: {error}`

### Zoom Meeting Settings

Auto-configured for each meeting:
- Host camera: ON
- Participant video: ON
- Join before host: OFF
- Mute on entry: OFF
- Waiting room: OFF
- Cloud recording: ON (auto-records all sessions)
- Authentication: OFF (link-based access)

---

## 6. Action Functions

### New Server Actions

#### `approveMentorshipRequest(sessionId: string)`
- Mentor approves REQUEST mode booking
- Changes status: PENDING_MENTOR_REVIEW → SCHEDULED
- Notifies student: "Request Approved - Proceed to Payment"
- Returns: Updated session

#### `rejectMentorshipRequest(sessionId: string, reason: string)`
- Mentor rejects with optional reason
- Changes status: PENDING_MENTOR_REVIEW → REJECTED
- Stores rejection reason in `approvalNotes`
- Notifies student with feedback
- Sets `rejectedAt` timestamp
- Returns: Updated session

#### `proceedWithApprovedBookingPayment(sessionId: string)`
- Called after mentor approval, before student pays
- Validates: Status is SCHEDULED + Request mode
- Creates Transaction record
- Initializes Paystack payment
- Returns: Paystack authorization URL
- NEW: Sets `mentorshipKind: "REQUEST_APPROVED"` in transaction metadata

#### `getTutorPendingApprovals()`
- Fetches all REQUEST mode sessions awaiting mentor approval
- Ordered by creation date (newest first)
- Includes student details, session info
- Used by `/tutor/mentorship` "Approvals" tab

#### `getApprovedSessionsReadyForPayment()`
- Fetches student's REQUEST sessions that mentor approved
- Status: SCHEDULED + BookingMode: REQUEST + PaymentStatus: PENDING
- Used by student dashboard to show "Proceed to Payment" button

---

## 7. Payment Flow & Notifications

### Payment Finalization (`lib/payments/finalizePaystack.ts`)

When mentorship payment is verified:

```
1. Check: Is this mentorship payment? (metadata.productType === "MENTORSHIP")
2. Fetch: MentorshipSession with student/tutor data
3. Create Zoom Meeting:
   - topic: session.title
   - startTime: session.scheduledAt (ISO 8601)
   - duration: session.duration (minutes)
   - emails: student.email, tutor.email
   - If fails: Log error, proceed without URL (manual fallback)
4. Update Session:
   - status: SCHEDULED
   - meetingUrl: Zoom join URL (or null)
   - paymentStatus: PAID ← NEW
   - notes: PAYMENT_CONFIRMED | {timestamp}
5. Increment Tutor Wallet: walletBalance += tutorShare (70%)
6. Emit Socket Notifications:
   - Student: "Mentorship Booking Confirmed" → Link to session page
   - Tutor: "Mentorship Payment Received" → Link to mentorship dashboard
```

### Notification Types

**To Student (after payment):**
- Type: `payment`
- Title: "Mentorship Booking Confirmed"
- CTA: "View Session" → `/mentorship/session/{sessionId}`

**To Tutor (after approval):**
- Type: `success`
- Title: "Mentorship Request Approved"
- Body: "Your request was approved! Proceed to payment..."
- CTA: "View Session" → `/student/mentorship?approved={sessionId}`

**To Tutor (payment received):**
- Type: `payment`
- Title: "Mentorship Payment Received"
- Body: "You've earned ₦{amount}"
- CTA: "View Sessions" → `/tutor/mentorship`

**To Student (rejection):**
- Type: `warning`
- Title: "Mentorship Request Declined"
- Body: Shows mentor's reason if provided
- CTA: "Browse Mentors" → `/student/mentorship`

---

## 8. Session Join Experience

### Timeline for Session

```
Before Session:
- Page shows: "Session starts in Xh Ym"
- Button disabled: "Join Meeting Now" (greyed out)
- URL visible for sharing/copying

At Session Time (within ±window):
- Page detects: now >= scheduledAt AND now <= scheduledAt + duration
- Button enabled: "Join Meeting Now" (green, clickable)
- Opens: session.meetingUrl in new tab
- Zoom window loads with participant

After Session:
- Page shows: "Session completed"
- Button disabled again
- Recording available (if Zoom captured it)
```

### Required ENV Variable

```env
NEXT_PUBLIC_URL=http://localhost:3000
# Used for Paystack redirect: {NEXT_PUBLIC_URL}/mentorship/verify-payment?reference={ref}
```

---

## 9. Testing Checklist

### Tutor Setup

- [ ] Tutor account created with role `MENTOR` or `TUTOR`
- [ ] Tutor has hourly rate set
- [ ] Zoom credentials configured in `.env.local`

### REQUEST Mode Flow

- [ ] Student creates REQUEST booking
- [ ] Session appears in tutor's "Approvals" tab
- [ ] Tutor can view request details
- [ ] Tutor clicks "Approve":
  - [ ] Session status changes to SCHEDULED
  - [ ] Student gets notification
  - [ ] Student sees session in "Awaiting Approval" tab
- [ ] Tutor can click "Reject":
  - [ ] Dialog opens for rejection reason
  - [ ] Student notified with reason
  - [ ] Session moved to "Rejected" tab

### Payment & Zoom Integration

- [ ] Student clicks "Proceed to Payment"
- [ ] Redirected to Paystack
- [ ] Payment processed successfully
- [ ] Session status: SCHEDULED → (payment verified)
- [ ] Zoom meeting created automatically
- [ ] Session URL populated with Zoom join link
- [ ] Session page loads with Zoom iframe
- [ ] Student sees "Join Meeting Now" button when session is live

### INSTANT Mode (Existing, Unchanged)

- [ ] Student books with INSTANT mode
- [ ] Immediately redirected to Paystack (no tutor approval needed)
- [ ] Payment → Zoom meeting created
- [ ] Session page displays meeting link

### Notifications

- [ ] All socket events emission working
- [ ] Student sees approval notification after tutor approves
- [ ] Tutor sees payment notification after student pays
- [ ] Rejected students see reason in notification
- [ ] Links in notifications redirect correctly

### Wallet Settlement

- [ ] Tutor wallet increments by 70% of payment
- [ ] Platform records 30% in `platformShareAmount`
- [ ] Transaction marked as COMPLETED
- [ ] Status correctly shows in admin dashboard

---

## 10. Fallback & Error Handling

### Zoom API Fails During Payment

**Scenario:** Payment success, but Zoom meeting creation fails

**Behavior:**
```typescript
try {
  const zoomMeeting = await createZoomMeeting({...});
  meetingUrl = zoomMeeting.joinUrl;  // Success path
} catch (error) {
  console.error(`[Zoom Meeting Creation Failed] Session: ${id}, Error: ${error}`);
  meetingUrl = null;  // Fallback: no URL
}
```

**Result:**
- Payment still confirmed ✓
- Session scheduled ✓
- Student notified ✓
- Tutor wallet updated ✓
- Meeting URL: **EMPTY** → Tutor alerted to add manually
- Banner on session page: "Meeting link is being prepared..."

**Tutor Action:**
- Can manually add meeting URL via session edit
- Email notification to tutor: "Please add meeting URL"

### Student Tries to Pay for Non-Approved Session

**Validation:**
```typescript
if (session.status !== "SCHEDULED" || session.bookingMode !== "REQUEST") {
  return { error: "This session is not ready for payment" };
}
```

**User sees:** "This session is not ready for payment" error toast

### Rejected Request - Student Wants to Rebook

**Feature:**
- Rejected session appears in "Rejected" tab
- "Request Again" button present
- Clicking routes back to booking form (with same tutor pre-selected)
- Creates **new session** (doesn't update rejected one)

---

## 11. Future Enhancements

### Auto-Reject Deadline

```typescript
// Set when REQUEST created
approvalDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000)  // 72 hours

// Could implement cron job to:
// - Check for expired REQUEST sessions
// - Auto-reject with reason: "Mentor did not respond within 72 hours"
// - Refund student (if prepaid)
// - Notify both parties
```

### Session Recordings

```typescript
export async function getSessionRecordings(sessionId: string) {
  const zoomMeetingId = await getZoomMeetingIdFromSession(sessionId);
  return getZoomMeetingRecordings(zoomMeetingId);
}

// Available in session details after completion
```

### Session Rescheduling

```typescript
export async function rescheduleMentorshipSession(
  sessionId: string,
  newScheduledAt: Date
) {
  // Update session.scheduledAt
  // Notify both parties
  // Update Zoom meeting time
}
```

### Mentor Availability Calendar

```typescript
// Display interactive calendar showing mentor's availability
// In User profile: timezone, availability windows (JSON)
// Students can only book available time slots
```

---

## 12. Admin Insights

### Admin Mentorship Dashboard

**Location:** `/admin/mentorship`

**Features Added:**
- Approval Status column (PENDING, APPROVED, REJECTED)
- Approval rate metric: % of approved vs total requests
- Filter by status: All, Pending Approvals, Paid, Completed
- Revenue breakdown: Pending, Completed, Failed

**Sample Metrics:**
```
Total Sessions: 42
Pending Approvals: 3 ⚠️
Approved: 38
Completed: 34
Gross Revenue: ₦1,250,000
Platform Share: ₦375,000 (30%)
Tutor Payouts: ₦875,000 (70%)
```

---

## 13. Database Queries Reference

### Find Pending REQUEST Sessions (for Tutor)

```typescript
db.mentorshipSession.findMany({
  where: {
    tutorId: tutorId,
    status: "PENDING_MENTOR_REVIEW"
  },
  include: { student: true }
})
```

### Find Approved But Unpaid Sessions (for Student)

```typescript
db.mentorshipSession.findMany({
  where: {
    studentId: studentId,
    status: "SCHEDULED",
    bookingMode: "REQUEST",
    paymentStatus: "PENDING"
  }
})
```

### Get Completed Mentorship Sessions

```typescript
db.mentorshipSession.findMany({
  where: { status: "COMPLETED" },
  orderBy: { endedAt: "desc" }
})
```

---

## 14. Troubleshooting

### Issue: "Session not found" when viewing mentorship session page

**Cause:** Wrong sessionId in URL or user not authorized

**Fix:**
- Check URL parameter: `/mentorship/session/{sessionId}`
- Verify: User is student OR tutor OR admin
- Check database: Session exists with correct IDs

### Issue: Zoom meeting URL not generating

**Cause:** Zoom API credentials missing or invalid

**Debug:**
1. Check `.env.local`: All three Zoom variables set
2. Verify: Account ID matches in Zoom dashboard
3. Test: Call `createZoomMeeting()` manually
4. Check logs: `[Zoom Meeting Creation Failed]` message

**Workaround:** Tutor manually adds meeting URL in session edit

### Issue: Student can't see "Proceed to Payment"

**Cause:** Session status not SCHEDULED or booking mode not REQUEST

**Check:**
```sql
SELECT id, status, bookingMode, paymentStatus 
FROM mentorship_sessions 
WHERE id = '{sessionId}';
```

Expected: `SCHEDULED`, `REQUEST`, `PENDING`

### Issue: Tutor wallet not incrementing after payment

**Cause:** Missing tutorUserId in transaction metadata

**Check:**
```sql
SELECT metadata 
FROM transactions 
WHERE id = '{transactionId}';
```

Expected: `"tutorUserId": "{userId}"`

---

## 15. Deployment Checklist

- [ ] Run all migrations: `pnpm prisma migrate deploy`
- [ ] Add Zoom credentials to production `.env`
- [ ] Update `NEXT_PUBLIC_URL` to production domain
- [ ] Test REQUEST → Approve → Pay flow in staging
- [ ] Test Zoom meeting creation with test account
- [ ] Verify socket notifications work (check logs)
- [ ] Update user docs/FAQs with new REQUEST mode
- [ ] Train mentors on approval dashboard
- [ ] Monitor logs for Zoom API errors first week
- [ ] Set up alerts for payment processing failures

---

**End of Implementation Guide**
