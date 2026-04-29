# Mentorship System - Architecture Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TUTORS: CREATE OFFERINGS                           │
└─────────────────────────────────────────────────────────────────────────┘

    Tutor Dashboard (/tutor/mentorship)
             │
             ├─ "Create Offering" Button
             │         │
             ▼         ▼
    ┌──────────────────────────────┐
    │  Schedule Page               │
    │  /tutor/mentorship/schedule  │
    │                              │
    │  Form:                       │
    │  - Title                     │
    │  - Course (optional)         │
    │  - Duration                  │
    │  - Price                     │
    │  - Description               │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐         Actions:
    │  createMentorshipOffering()  │ ─────► 1️⃣ Verify tutor owns course
    │                              │         2️⃣ Create session (isOffering=true)
    │  Sets:                       │         3️⃣ Set studentId = tutorId
    │  - isOffering: true          │         4️⃣ Return offering with course
    │  - courseId (if linked)      │
    │  - status: SCHEDULED         │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Offering Created & Listed    │
    │ on Schedule Page             │
    │                              │
    │ Grouped by:                  │
    │ - Course-linked offerings    │
    │ - Standalone offerings       │
    └──────────┬───────────────────┘
               │
               ├─────────────────────────────┐
               │                             │
               ▼                             ▼
    ┌──────────────────────┐     ┌──────────────────────┐
    │ Visible to Students: │     │ Visible to Students: │
    │ In Marketplace       │     │ On Course Completion │
    │ (/mentorship)        │     │ (Card Component)     │
    └──────────────────────┘     └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                  STUDENTS: DISCOVER & BOOK MENTORSHIP                   │
└─────────────────────────────────────────────────────────────────────────┘

    PATH 1: Course Completion Upsell
    
    Student Completes Course
             │
             ▼
    ┌──────────────────────────────────────┐
    │ Course Completion Page               │
    │ Shows: CourseMentorshipSuggestions   │
    │                                      │
    │ API Call:                            │
    │ GET /api/mentorship/suggestions      │
    │     ?courseId={{courseId}}           │
    └──────────┬───────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────┐
    │ Suggestions Card                     │
    │ "Master this course with mentorship" │
    │                                      │
    │ Shows up to 5 offerings:             │
    │ - Tutor name                         │
    │ - Duration (⏱️)                       │
    │ - Price (₦)                          │
    │ - "Book" button                      │
    │ - "View All" button                  │
    └──────────┬───────────────────────────┘
               │
               └─ Student Dismisses → Card disappears
    
    
    PATH 2: Marketplace Browse
    
    Student Visits /mentorship (Marketplace)
             │
             ▼
    ┌──────────────────────────────────┐
    │ Browse All Offerings             │
    │ (isOffering = true, status = OK) │
    │                                  │
    │ Filter options:                  │
    │ - By tutor                       │
    │ - By price                       │
    │ - By duration                    │
    │ - By course (future)             │
    └──────────┬───────────────────────┘
               │
               ▼ Click offering
    
    
    Both Paths Converge:
    
    ┌────────────────────────────────────┐
    │ Student Ready to Book              │
    │ beginMentorshipCheckout() called   │
    │                                    │
    │ Input:                             │
    │ - offeringId                       │
    │ - bookingMode: INSTANT|REQUEST     │
    │                                    │
    │ Creates new MentorshipSession:     │
    │ - isOffering: false ⚠️             │
    │ - studentId: actual_student        │
    │ - courseId: copied from offering   │
    │ - status: PENDING_MENTOR_REVIEW|   │
    │          SCHEDULED                 │
    └────────────┬───────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
INSTANT MODE            REQUEST MODE
    │                         │
    ┌─ Direct to ─┐          ┌─ Tutor ─┐
    │  Paystack   │          │ Reviews │
    │  Payment    │          │         │
    └──────┬──────┘          └────┬────┘
           │                      │
           ▼                  ┌───┴────┐
      Payment              Approve/  Reject
      Success              Reject
           │                      │
           ├──────────┬───────────┤
           │          │           │
    Approved      Approved    Rejected
    (PAID)        (SCHEDULED) (REJECTED)
           │          │           │
           │          ▼           ▼
           │      Student Gets   Student
           │      Payment Link   Notified
           │          │
           │          ▼
           │      Pays → PAID
           │
           ▼
    ┌────────────────────────────────┐
    │ Payment Success Handler        │
    │ (finalizePaystack.ts)          │
    │                                │
    │ Actions:                       │
    │ 1️⃣ Verify payment              │
    │ 2️⃣ Get session details         │
    │ 3️⃣ Create Zoom meeting         │
    │ 4️⃣ Update: paymentStatus=PAID  │
    │ 5️⃣ Update: meetingUrl=generated│
    │ 6️⃣ Add to tutor wallet (+70%)  │
    │ 7️⃣ Add to platform wallet (30%)│
    │ 8️⃣ Send notifications          │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Session Ready              │
    │                            │
    │ Status: SCHEDULED          │
    │ PaymentStatus: PAID        │
    │ MeetingUrl: Populated      │
    │                            │
    │ Visible in:                │
    │ - Tutor: /tutor/mentorship │
    │  (Pending tab)             │
    │ - Student: /student/       │
    │  mentorship (Pending)      │
    │                            │
    │ Both can:                  │
    │ - View together details    │
    │ - Access Zoom link         │
    │ - See countdown timer      │
    └────────────┬───────────────┘
                 │
        When Session Time:
        scheduledAt <= now <=
        scheduledAt + duration
                 │
                 ▼
    ┌────────────────────────────┐
    │ Join Page Accessible       │
    │ /mentorship/session/[id]   │
    │                            │
    │ Shows:                     │
    │ - Session details          │
    │ - Zoom iframe (embedded)   │
    │ - Copy meeting URL button  │
    │ - Participant cards        │
    │ - Countdown timer          │
    └────────────┬───────────────┘
                 │
        After Session Ends:
        now > scheduledAt + duration
                 │
                 ▼
    ┌────────────────────────────┐
    │ Tutor Marks Complete       │
    │                            │
    │ Options:                   │
    │ - Mark as COMPLETED        │
    │ - Mark as NO_SHOW          │
    │ - Mark as CANCELLED        │
    │                            │
    │ Action:                    │
    │ updateTutorMentorshipSessionStatus() │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Session Archived           │
    │                            │
    │ Visible in:                │
    │ - Tutor: History tab       │
    │ - Student: History tab     │
    │ - Analytics: Counted       │
    └────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA (Relevant Parts)                     │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   MentorshipSession      │
├──────────────────────────┤
│ id: String               │
│ title: String            │
│ description: String?     │
│ duration: Int            │
│ price: Float             │
│ status: SessionStatus    │◄──┐ SCHEDULED | IN_PROGRESS | COMPLETED
│ studentId: String        │   │ CANCELLED | NO_SHOW | PENDING_MENTOR_REVIEW
│ tutorId: String          │   │ REJECTED
│ courseId: String? ◄──────┼─────────┐ NEW: Links to course
│ meetingUrl: String?      │   │     │
│ scheduledAt: DateTime    │   │     │
│ startedAt: DateTime?     │   │     │
│ endedAt: DateTime?       │   │     │
│                          │   │     │
│ bookingMode: Enum ◄──────┼────────┬─ INSTANT | REQUEST (Phase 2)
│ paymentStatus: Enum ◄────┼────────┼─ PENDING | PAID | FAILED (Phase 2)
│ isOffering: Boolean ◄────┼────┐   │ NEW: true=offering, false=booking
│ approvalNotes: String? ◄─┼─────────┐─ Phase 2
│ rejectedAt: DateTime? ◄──┼─────────┐
│ approvalDeadline: DateTime?◄────────┐
│                          │
│ student: User ◄──────────┼─ Relation (for actual bookings)
│ tutor: User ◄────────────┼─ Relation
│ course: Course? ◄────────┤─ NEW: Relation
│ transactions: Transaction[]
└──────────────────────────┘
            │
            ├─ When isOffering=true:
            │  - studentId = tutorId (placeholder)
            │  - Used as product listing
            │  - Not real booking
            │
            └─ When isOffering=false:
               - studentId = actual student
               - Real booking with payment
               - Contains session details

┌──────────────────────────┐
│   Course                 │
├──────────────────────────┤
│ id: String               │
│ title: String            │
│ slug: String?            │
│ thumbnail: String?       │
│ tutorId: String          │
│ creatorId: String        │
│ ...                      │
│                          │
│ mentorshipSessions: ◄────┼─ NEW: Array of linked offerings
│ MentorshipSession[]      │
└──────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    ACTION FUNCTIONS & RELATIONS                         │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 3 NEW FUNCTIONS:

createMentorshipOffering(data)
    ├─ Input: title, description, duration, price, courseId?
    ├─ Checks:
    │  ├─ User is TUTOR or MENTOR
    │  └─ If courseId: User owns course
    └─ Returns: MentorshipSession (isOffering=true)

getTutorMentorshipOfferings()
    ├─ Fetches where: tutorId, isOffering=true, status=SCHEDULED
    └─ Returns: Array of offerings

getTutorCourses()
    ├─ Fetches where: tutorId or creatorId = user
    └─ Returns: Array of courses (for selector)

deleteMentorshipOffering(offeringId)
    ├─ Checks:
    │  ├─ User owns offering
    │  └─ isOffering=true
    └─ Deletes & returns success

PHASE 2 FUNCTIONS (for reference):

beginMentorshipCheckout(data)
    ├─ Takes offering or creates from scratch
    ├─ Creates booking: isOffering=false
    └─ Returns: Paystack payment URL

approveMentorshipRequest(sessionId, notes)
    ├─ Updates: status=SCHEDULED
    └─ Notifies student

rejectMentorshipRequest(sessionId, reason)
    ├─ Updates: status=REJECTED
    └─ Notifies student

updateTutorMentorshipSessionStatus(sessionId, status)
    └─ Updates status (COMPLETED, NO_SHOW, etc.)

getTutorPendingApprovals()
    └─ Fetches REQUEST sessions awaiting approval

getApprovedSessionsReadyForPayment()
    └─ Fetches REQUEST sessions approved, awaiting student payment


┌─────────────────────────────────────────────────────────────────────────┐
│                      API ENDPOINT REFERENCE                             │
└─────────────────────────────────────────────────────────────────────────┘

POST /action/createMentorshipOffering
  Input: { title, description?, duration, price, courseId? }
  Output: MentorshipSession
  Auth: Required (TUTOR/MENTOR)

POST /action/getTutorMentorshipOfferings
  Input: (none)
  Output: MentorshipSession[]
  Auth: Required

POST /action/getTutorCourses
  Input: (none)
  Output: Course[]
  Auth: Required

POST /action/deleteMentorshipOffering
  Input: { offeringId }
  Output: { success: true }
  Auth: Required (must own offering)

GET /api/mentorship/suggestions?courseId=X
  Output: { suggestions: MentorshipSession[], total: number }
  Auth: Public

---

[End of Architecture Diagram]
```

## Component Interaction Diagram

```
┌─────────────────────────────────┐
│  Tutor Dashboard                │
│  /tutor/mentorship              │
│                                 │
│  ┌─ Tabs:                       │
│  ├─ Approvals (REQUEST mode)    │
│  ├─ Pending (INSTANT bookings)  │
│  ├─ Active (IN_PROGRESS)        │
│  └─ Completed                   │
│                                 │
│  [Create Offering] Button ───┐  │
└─────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────┐
│  Schedule Page                           │
│  /tutor/mentorship/schedule              │
│                                          │
│  ┌── Create Offering Dialog ──┐          │
│  │ Form Component:            │          │
│  │ - Title                    │          │
│  │ - Course Select ─────┐     │          │
│  │ - Description        │     │          │
│  │ - Duration           │     │          │
│  │ - Price              │     │          │
│  │ [Create Button]      │     │          │
│  └────────────────────────────┘          │
│                                          │
│  ┌── Offerings List ──┐                  │
│  │ Group 1: Course-   │                  │
│  │ Linked Offerings   │                  │
│  │ - Card per offering│                  │
│  │ - [Delete]         │                  │
│  │                    │                  │
│  │ Group 2: Standalone│                  │
│  │ - Card per offering│                  │
│  │ - [Delete]         │                  │
│  └────────────────────┘                  │
└──────────────────────────────────────────┘
                                  │
                                  ├─────────────────┐
                    ┌─────────────┘                 │
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌──────────────────────┐
    │ Student Dashboard         │   │ Course Completion    │
    │ /student/mentorship       │   │ Page                 │
    │                           │   │                      │
    │ Tabs:                     │   │ Shows:               │
    │ - Book (Browse)           │   │ CourseCompletion     │
    │ - Awaiting Approval       │   │ Suggestions Comp.    │
    │ - Pending                 │   │                      │
    │ - History                 │   │ API Call:            │
    │ - Rejected                │   │ GET /api/mentorship/ │
    │                           │   │ suggestions?courseId │
    │ Click → Checkout          │   │                      │
    │         Payment           │   │ Shows:               │
    │                           │   │ - 5 offerings        │
    │                           │   │ - Tutor names        │
    │                           │   │ [Book] buttons       │
    └───────────────────────────┘   └──────────────────────┘
                    │                               │
                    └──────────────┬────────────────┘
                                   │
                    ┌──────────────▼─────────────┐
                    │   Paystack Checkout        │
                    │   (Existing flow)          │
                    │                            │
                    │   Payment ────→ Success    │
                    └───────────────┬────────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │ finalizePaystack.ts        │
                    │                            │
                    │ 1. Create Zoom Meeting     │
                    │ 2. Update DB: PAID, URL    │
                    │ 3. Add to wallets          │
                    │ 4. Send notifications      │
                    └───────────────┬────────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │  Session Ready             │
                    │                            │
                    │  Join Page:                │
                    │  /mentorship/session/[id]  │
                    │                            │
                    │  Shows:                    │
                    │  - Session details         │
                    │  - Zoom iframe             │
                    │  - Countdown (when live)   │
                    │  - Participant cards       │
                    └────────────────────────────┘
```

## Data Flow: Creating an Offering

```
1. User fills form on schedule page
   ↓
2. Form validation (title, duration, price required)
   ↓
3. POST /action/createMentorshipOffering
   {
     title: "React Mastery",
     duration: 60,
     price: 5000,
     courseId: "react-course-id"
   }
   ↓
4. Server-side validation:
   - User is tutor/mentor? ✓
   - courseId (if provided): User owns course? ✓
   ↓
5. Create MentorshipSession:
   - isOffering: true
   - studentId: user.id (placeholder)
   - tutorId: user.id
   - courseId: "react-course-id"
   - status: "SCHEDULED"
   - bookingMode: "INSTANT"
   ↓
6. Return offering to UI
   ↓
7. Add to offerings list on schedule page
   ↓
8. Show success toast: "✓ Offering created"
   ↓
9. Offering now:
   - Listed on schedule page
   - Appears in marketplace
   - Suggested on course completion (if course linked)
```

## Data Flow: Student Books Offering

```
1. Student sees offering:
   ├─ On schedule page (marketplace)
   ├─ On course completion page
   └─ Via marketplace filter
   ↓
2. Student clicks "Book"
   ↓
3. System calls beginMentorshipCheckout({
     offeringId,
     bookingMode: "INSTANT",
     ...sessionData
   })
   ↓
4. Server creates NEW MentorshipSession:
   - isOffering: false (⚠️ different from offering!)
   - studentId: actual_student_id
   - tutorId: original_tutor_id
   - courseId: copied from offering
   - status: "SCHEDULED" (for INSTANT) or "PENDING_MENTOR_REVIEW" (for REQUEST)
   ↓
5. Returns Paystack payment link
   ↓
6. Student proceeds to Paystack checkout
   ↓
7. After payment confirmation:
   - finalizePaystack() called
   - Zoom meeting created
   - meetingUrl saved
   - paymentStatus: PAID
   - Notifications sent to both parties
   ↓
8. Session appears in:
   - Tutor dashboard (Pending tab)
   - Student dashboard (Pending tab)
   ↓
9. When session time arrives:
   - Join page accessible (/mentorship/session/[id])
   - Zoom embedded & ready
   ↓
10. After session:
    - Tutor marks complete/no-show
    - Session archived (history)
```

---

*This diagram represents the complete mentorship system across all three phases of implementation.*
