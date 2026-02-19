# Mentorship Restructure - Quick Reference

**Quick Setup Checklist**

```bash
# 1. Install dependencies
pnpm add jsonwebtoken @types/jsonwebtoken

# 2. Add to .env.local
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
NEXT_PUBLIC_URL=http://localhost:3000

# 3. Run migrations
pnpm prisma migrate deploy
pnpm prisma generate

# 4. Start dev server
pnpm dev
```

---

## Architecture Overview

### REQUEST Mode Flow
```
Student Request → Mentor Review → Mentor Approve/Reject → Student Payment → Zoom Meeting
```

### Key Changes
| What | Before | After |
|------|--------|-------|
| REQUEST payment | ❌ Skipped | ✅ After approval |
| Mentor approval | ❌ None | ✅ Dashboard review |
| Zoom meetings | ❌ Manual | ✅ Auto-generated |
| Session access | ❌ Dashboard only | ✅ Join page + embed |
| Notifications | ⚠️ Basic | ✅ Real-time push |

---

## File Locations

### Core Changes
```
lib/zoom-integration.ts                          [NEW] Zoom API wrapper
lib/payments/finalizePaystack.ts                 [UPDATED] Zoom meeting creation
actions/mentorship-revenue.ts                    [UPDATED] Approval actions
prisma/schema.prisma                             [UPDATED] New enum values & fields
```

### UI Components
```
components/pages/tutor/mentorship-pending-approvals.tsx    [NEW] Approval dashboard
app/(root)/mentorship/session/[sessionId]/page.tsx         [NEW] Join session page
app/(root)/tutor/mentorship/page.tsx                       [UPDATED] Approval tab
app/(root)/student/mentorship/page.tsx                     [UPDATED] New tabs
```

### APIs
```
app/api/mentorship/session/[sessionId]/route.ts            [NEW] Get session details
app/api/mentorship/proceed-payment/route.ts                [NEW] Initiate REQUEST payment
```

---

## User Flows

### For Students

**REQUEST Mode:**
```
1. Click "Request Mentorship"
2. Fill details (topic, time, duration)
3. Submit → "Awaiting Approval" tab
4. Mentor approves → Get notification
5. "Proceed to Payment" button appears
6. Pay via Paystack
7. Zoom link auto-generated
8. Join session when live
```

**INSTANT Mode (unchanged):**
```
1. Click "Book Now"
2. Fill details
3. Paystack payment
4. Session ready + Zoom link
5. Join when live
```

### For Mentors

**New Approval Workflow:**
```
1. /tutor/mentorship dashboard
2. New "Approvals" tab (yellow dot if pending)
3. Review REQUEST bookings
4. Click Approve → Student notified, ready for payment
5. OR Click Reject + reason → Student gets feedback
```

---

## API Response Examples

### POST `/api/mentorship/proceed-payment`

**Request:**
```json
{ "sessionId": "cuid123" }
```

**Success Response:**
```json
{
  "ok": true,
  "mode": "REQUEST_APPROVED_PAYMENT",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "mentorshipSessionId": "cuid123"
}
```

**Error Response:**
```json
{
  "error": "This session is not ready for payment"
}
```

### GET `/api/mentorship/session/[sessionId]`

**Response:**
```json
{
  "session": {
    "id": "cuid123",
    "title": "Advanced React Patterns",
    "status": "SCHEDULED",
    "scheduledAt": "2026-02-20T14:00:00Z",
    "duration": 60,
    "price": 50000,
    "meetingUrl": "https://zoom.us/j/...",
    "bookingMode": "REQUEST",
    "paymentStatus": "PAID",
    "student": {
      "id": "user1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tutor": {
      "id": "tutor1",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

## Notifications

### Socket.IO Events

```typescript
// Emitted to student after mentor approves
{
  type: "success",
  title: "Mentorship Request Approved",
  message: "Your request was approved! Proceed to payment...",
  actionUrl: "/student/mentorship?approved=sessionId",
  actionLabel: "View Session"
}

// Emitted to student after payment confirmed
{
  type: "payment",
  title: "Mentorship Booking Confirmed",
  message: "Your session is booked. Meeting starts at...",
  actionUrl: "/mentorship/session/sessionId",
  actionLabel: "View Session"
}

// Emitted to tutor after payment received
{
  type: "payment",
  title: "Mentorship Payment Received",
  message: "You've earned ₦50,000",
  actionUrl: "/tutor/mentorship",
  actionLabel: "View Sessions"
}

// Emitted to student if mentor rejects
{
  type: "warning",
  title: "Mentorship Request Declined",
  message: "Reason: Time slot not available",
  actionUrl: "/student/mentorship",
  actionLabel: "Browse Mentors"
}
```

---

## Database Queries

### Find Pending Requests (Mentor)

```sql
SELECT * FROM mentorship_sessions
WHERE "tutorId" = ? AND status = 'PENDING_MENTOR_REVIEW'
ORDER BY "createdAt" DESC;
```

### Find Approved But Unpaid (Student)

```sql
SELECT * FROM mentorship_sessions
WHERE "studentId" = ? 
  AND status = 'SCHEDULED'
  AND "bookingMode" = 'REQUEST'
  AND "paymentStatus" = 'PENDING';
```

### Get Completed Sessions with Earnings

```sql
SELECT 
  ms.id, ms.title, ms."scheduledAt", ms.price,
  t.amount as transaction_amount,
  t."tutorShareAmount" as tutor_earned
FROM mentorship_sessions ms
LEFT JOIN transactions t ON ms.id = (t.metadata->>'mentorshipSessionId')::text
WHERE ms."tutorId" = ? AND ms.status = 'COMPLETED'
ORDER BY ms."scheduledAt" DESC;
```

---

## Zoom Meeting Settings

All meetings created with:
- ✅ Host camera: ON
- ✅ Participant video: ON
- ✅ Join before host: OFF
- ✅ Mute on entry: OFF
- ✅ Waiting room: OFF
- ✅ Auto-recording: CLOUD (to Zoom storage)
- ✅ Authentication: OFF (link-based)

---

## Error Handling

### Zoom API Fails

```
Payment Success ✓
  → Zoom call fails
  → Logged: [Zoom Meeting Creation Failed] Session: {id}, Error: {...}
  → Session marked: SCHEDULED, paymentStatus: PAID
  → meetingUrl: NULL
  → Tutor alerted: "Please add meeting URL manually"
  → No refund (payment already confirmed)
```

### Invalid Session Status

```
Student tries to pay for REQUEST that wasn't approved
  → Validation fails: status !== SCHEDULED
  → Error: "This session is not ready for payment"
  → Button disabled in UI (preventive)
```

---

## Testing Commands

```bash
# Validate schema
pnpm prisma validate

# Check types
pnpm tsc --noEmit

# Run tests (if configured)
pnpm test

# Lint code
pnpm lint

# Build for production
pnpm build
```

---

## Feature Flags (Future)

```typescript
// To temporarily disable REQUEST mode:
const ENABLE_REQUEST_MODE = false;

// In booking dialog:
{ENABLE_REQUEST_MODE && (
  <option value="REQUEST">Request Approval</option>
)}
```

---

## Monitoring & Alerts

### Key Metrics to Track

```
✓ REQUEST approval rate (approved / total)
✓ Average approval time (minutes)
✓ Zoom API success rate
✓ Payment failure rate
✓ Session join rate (booked vs attended)
✓ Tutor earnings distribution
```

### Log Patterns to Watch

```
[Zoom Meeting Creation Failed]  ← Means: Add manual fallback
[Session not found]              ← Means: Invalid sessionId
[Unauthorized]                   ← Means: Auth issue
[Paystack error]                 ← Means: Payment gateway down
```

---

## Next Steps After Deployment

1. ✅ Announce feature to mentors/students
2. ✅ Monitor Zoom API logs (first week)
3. ✅ Gather feedback on approval UX
4. ✅ Plan v2: Auto-reject after 72h, session rescheduling, calendar
5. ✅ Consider email notifications (in addition to socket)

---

**See the full implementation guide:** [MENTORSHIP-RESTRUCTURE-IMPLEMENTATION.md](MENTORSHIP-RESTRUCTURE-IMPLEMENTATION.md)

For detailed troubleshooting: [MENTORSHIP-RESTRUCTURE-SUMMARY.md](MENTORSHIP-RESTRUCTURE-SUMMARY.md#troubleshooting)
