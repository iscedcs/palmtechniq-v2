# Exam Center — Feature Design & Flow

**Status:** Phase 1 largely built — publish pipeline, attempt engine, sitting screen,
tutor authoring and the scheduled sweep are in. Remaining: live monitor, manual
grading queue, and results release. Phase 2 (question banks and import) not started.
**Date:** 2026-08-06
**Goal:** Replace third-party exam platforms with a first-party exam system where tutors schedule and run real exams, and question import is a first-class feature (not an afterthought).

---

## 1. Why not extend the existing `Quiz`

| | `Quiz` (today) | Exam (needed) |
|---|---|---|
| Ownership | Welded to one `Lesson` (`lessonId @unique`) | Standalone; scoped to course / cohort / group |
| Timing | `timeLimit` only, client-trusted | Scheduled window + server-authoritative timer |
| Who sits it | Anyone with an `Enrollment` | Explicit roster, with per-student accommodations |
| Questions | Authored inline, single use | Reusable, importable, versioned question bank |
| Grading | Auto only | Auto + manual rubric + override + release control |
| Integrity | None | Event log, lockdown signals, single-session lock |

`Quiz` stays exactly as it is for lesson knowledge-checks. Exam Center is a parallel system that reuses the `QuestionType` enum and the question-rendering components.

---

## 2. Core objects

```
QuestionBank ──< BankQuestion (versioned, tagged: topic / difficulty / type)
                      │
                      │ (snapshot on publish)
                      ▼
Exam ──< ExamSection ──< ExamQuestion
 │
 ├──< ExamCandidate    (roster + accommodations)
 ├──< ExamAttempt ──< ExamResponse   (autosaved)
 │         │
 │         └──< ExamEvent            (integrity signals)
 └──< ExamGrade                      (auto + manual + override)
```

### QuestionBank / BankQuestion
Tutor-owned, reusable across exams. **This is the object import targets** — you import once into a bank, then draw from it forever. Each question carries: stem (rich text + images), type, options, correct answer, explanation, points, topic tags, difficulty, and a version number.

### Exam
- **Scope:** which population it belongs to (course, program cohort, bootcamp track, or an ad-hoc student list)
- **Schedule:** `opensAt` / `closesAt` window, duration in minutes, timezone
- **Rules:** attempts allowed, passing score, shuffle questions, shuffle options, one-question-per-page vs. all-at-once, backtracking allowed, calculator/resources allowed
- **Access:** open to roster / access code required / manual release per student
- **Results policy:** immediate score, score after close, manual release, show correct answers y/n, show explanations y/n
- **Lifecycle:** `DRAFT → SCHEDULED → LIVE → CLOSED → GRADING → RELEASED → ARCHIVED`

### ExamSection
Sections with their own instructions and optional own time limit. Each section is either:
- **Fixed** — an explicit ordered list of questions, or
- **Randomized draw** — "10 questions from topic `Networking` at `MEDIUM` difficulty"

The draw is what gives every student a different paper from the same bank. The drawn set is frozen onto the attempt at start time so a resume shows the same paper.

### ExamCandidate
The roster. Auto-populated from the scope (enrollment / cohort membership) but explicitly materialized so tutors can add, exclude, and set per-student accommodations: extra time multiplier, alternate window, extra attempt.

### ExamAttempt
`startedAt`, **`expiresAt` computed server-side**, `status`, `lastHeartbeatAt`, `submittedAt`, `submittedBy` (`STUDENT | AUTO | TUTOR`), and the frozen question set.

### ExamResponse
One row per question per attempt, autosaved continuously. Keeps the last saved value plus a save timestamp so a crash never costs more than a few seconds.

### ExamGrade
Auto-graded objective portion computed at submit. Essay/code questions go into a grading queue with an optional rubric. Tutor can override any score with a reason. Release is a separate, deliberate action.

### ExamEvent
Integrity signal log: tab/focus loss, paste, window blur, fullscreen exit, IP change, disconnect/resume, time anomalies. **Signals, not verdicts** — surfaced to the tutor as a flag to review, never an automatic penalty.

---

## 3. Question import (the driving requirement)

Import lands questions in a **QuestionBank**, not directly into an exam. Every path shares the same pipeline:

```
Upload / paste → Parse → Preview & fix → Map fields → Validate → Commit to bank
```

The **preview-and-fix** step is what third-party tools get wrong: parse errors are shown per-row with the offending text inline and editable, so a tutor fixes 3 bad rows instead of re-uploading the whole file blind. Nothing commits until the whole batch is valid or the tutor explicitly skips bad rows.

**Formats, by priority:**

| Priority | Format | Why |
|---|---|---|
| P0 | **CSV / XLSX** with downloadable template | Universal; every tutor has a spreadsheet |
| P0 | **Paste a block of text** | Fastest path for a tutor with a Word doc |
| P1 | **Moodle GIFT** and **Aiken** | Plain-text standards, small parsers, huge existing question sets |
| P1 | **DOCX upload** | Where tutors' questions actually live |
| P2 | **QTI 2.1 zip** | What most commercial exam tools export — the true migration path |
| P2 | **AI-assisted extraction** | Unstructured text/PDF → structured questions, tutor confirms every one |

Images in questions go through the existing upload API. Bulk export in the same formats, so tutors are never locked in — the thing we're fixing about the current vendor.

---

## 4. Flows

### 4.1 Tutor — create and run an exam

1. **Exam Center → New Exam.** Pick scope (which course/cohort) and name it.
2. **Questions.** Either draw from a bank, add manually, or import (§3). Import is offered inline at this step, not buried in settings.
3. **Structure.** Add sections; set fixed lists or randomized draws; set points.
4. **Rules & schedule.** Window, duration, attempts, passing score, shuffle, results policy, access code.
5. **Roster.** Review auto-populated candidates; add/exclude; set accommodations.
6. **Preview as student.** Sit the exam yourself in a sandbox attempt that never scores. Non-negotiable before publish.
7. **Publish.** Roster is notified (in-app + email); exam appears on student dashboards with a countdown.
8. **Live monitor.** During the window: who's started, who's in progress, time remaining per student, submitted count, integrity flags. Tutor can grant extra time, force-submit, or reopen an attempt for a student who crashed.
9. **Grade.** Objective portion is already scored. Work the essay/code queue with rubrics; anonymous-grading toggle.
10. **Release.** One deliberate action. Then: per-student results, item analysis (which questions everyone failed — that's a teaching signal), export to CSV.

### 4.2 Student — sit an exam

1. **Upcoming exam** appears on the dashboard with date, duration, and rules summary.
2. **Readiness check** before the window: browser/connection check, so surprises happen early rather than at minute 0.
3. **Enter** when the window opens — access code if required.
4. **Instructions + honor agreement**, explicit "Start" that begins the server-side clock.
5. **Sit the exam:** autosave on every change, question navigator with flag-for-review, server-driven countdown, warnings at 10/5/1 min. Disconnect and reconnect resumes the same attempt with the original expiry — no lost work, no bonus time.
6. **Submit** — with an unanswered-questions warning — or auto-submit at expiry.
7. **Confirmation** with a receipt (submitted at, questions answered).
8. **Results** when policy allows; review with explanations if enabled.
9. **Certificate** if the exam is a program/course final and the student passed — hooks into the existing `Certificate` model.

### 4.3 Admin — oversight

Cross-tutor exam calendar, integrity reports, platform-wide defaults (max duration, mandatory rules), and audit trail on every score override and manual release.

---

## 5. Non-negotiable technical rules

1. **The server owns the clock.** `expiresAt` is computed and stored at attempt start. The client renders a countdown but never decides when time is up. Fixes the entire class of "I changed my system clock" cheating.
2. **Correct answers never reach the client during an attempt.** Separate read models for sitting vs. reviewing.
3. **Autosave is idempotent and queued.** Offline writes buffer locally and flush on reconnect; last-write-wins per question with a client timestamp.
4. **Submit is idempotent.** Double-submit, auto-submit racing manual submit, and reconnect-then-submit all converge to one attempt record.
5. **Questions are snapshotted at publish.** Editing a bank question later never mutates a past exam or its graded attempts.
6. **One active attempt per student per exam.** Second device gets locked out, and it's an integrity event.
7. **Every grade change is audited** — who, when, old value, new value, reason.

---

## 6. Suggested build order

**Phase 1 — Take an exam at all.** Exam model + sections + fixed questions, roster from enrollment, scheduled window, server-authoritative attempt engine with autosave and auto-submit, objective auto-grading, immediate-or-manual release. Manual question authoring only.

**Phase 2 — Kill the import pain.** QuestionBank, CSV/XLSX + paste import with the preview-and-fix pipeline, randomized draws from bank, export.

**Phase 3 — Run exams at scale.** Live monitor, accommodations, integrity event log, manual grading queue with rubrics, item analysis.

**Phase 4 — Migration & polish.** GIFT/Aiken/DOCX/QTI import, AI-assisted extraction, certificate hookup, admin oversight.

Phase 1 is the smallest thing that lets a tutor stop using the third-party tool for a simple exam. Phase 2 is the thing the complaining tutor actually asked for.

---

## 7. Decisions (resolved 2026-08-06)

### 7.1 Scope — polymorphic: course, cohort, or ad-hoc ✅

An `Exam` carries `scopeType` (`COURSE | PROGRAM_COHORT | BOOTCAMP_TRACK | AD_HOC`) plus a nullable id per type. The roster is **materialized into `ExamCandidate` rows at publish** regardless of scope, so all downstream code (monitor, grading, analytics) reads one uniform roster and never branches on scope. Scope only decides how that roster is *seeded*:

| Scope | Seeded from |
|---|---|
| `COURSE` | `Enrollment` where `status = ACTIVE` |
| `PROGRAM_COHORT` | `ProgramEnrollment` for the cohort |
| `BOOTCAMP_TRACK` | `BootcampEnrollment` for the track |
| `AD_HOC` | Manually picked users |

Late enrollers are handled by a "re-sync roster" action, not by making the roster a live query — a roster that shifts mid-exam is a correctness nightmare.

### 7.2 Integrity — soft signals only ✅

`ExamEvent` logs tab/focus loss, paste, fullscreen exit, IP change, disconnect/resume, and time anomalies. Events are surfaced to the tutor as a reviewable flag on the attempt, with a severity hint. **No automatic penalty, no automatic submission, no accusation language in the UI.** No fullscreen enforcement, no copy/paste blocking — both break screen readers and keyboard users, and are bypassed with a devtools window anyway.

The one hard enforcement is §5.6: one active attempt per student per exam. A second device is refused and logged.

### 7.3 Question banks — tutor-owned, shareable ✅

`QuestionBank.ownerId` is a tutor. A `QuestionBankShare` join grants another tutor `VIEW` (draw from it) or `EDIT` (add/modify questions). A bank may also be attached to a course, which grants every tutor on that course `VIEW` by default.

Sharing grants access to the *bank*; drawing a question into an exam **snapshots** it (§5.5), so a shared bank can never be edited out from under someone else's published exam.

### 7.4 Certificates — auto-issue on pass ✅

An exam can be flagged `isFinalAssessment` for its course or program. When results are **released** (not at submit — release is the deliberate gate), every candidate at or above `passingScore` gets a `Certificate` issued through the existing model in [schema.prisma:1083](../prisma/schema.prisma).

Issuing is idempotent on `(userId, courseId)`, and a later score override that drops a student below passing **revokes** via the existing `isRevoked` flag rather than deleting — the certificate ID may already be in circulation.

### 7.5 Still open

**Late / missed exams.** Proposed default, to confirm during Phase 1: the window hard-closes and in-progress attempts auto-submit at `closesAt`; a student who never started is marked `MISSED`; the tutor can grant an individual makeup window per candidate (this reuses the accommodations mechanism, so it costs almost nothing to support).
