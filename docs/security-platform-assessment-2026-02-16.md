# PalmTechnIQ Platform and Security Assessment

Date: 2026-02-16  
Assessor: AI-assisted static and configuration review  
Repository: `e-learning-platform` (branch `fix/build-and-admin-export`)

## 1) Executive Summary

The platform has a solid architectural baseline (Next.js + NextAuth + Prisma, role-based middleware, payment webhook signature verification), but there are critical API authorization gaps and production hardening issues.

Most urgent risks:
- Unauthenticated API endpoints allow resource management and upload-related actions without login checks.
- Security headers are not configured.
- Dependency vulnerabilities include high-severity advisories in `next`, `axios`, and transitive packages.
- Build/lint hygiene has reliability gaps (lint setup mismatch and failing production build).

Overall risk rating: **High**  
Confidence level: **High** for code-verified findings, **Medium** for items requiring runtime validation.

---

## 2) Assessment Scope and Method

### Scope
- Application architecture and access control model
- API route authentication/authorization coverage
- Data handling and upload/payment surfaces
- Dependency security posture and CI/CD practices
- Build/lint operational health

### Method
- Static code review of core auth, middleware, API routes, config, and CI files
- Dependency audit via package manager
- Operational checks via local commands:
  - `pnpm audit --registry=https://registry.npmjs.org --audit-level=moderate`
  - `pnpm lint`
  - `pnpm build`

### Limitations
- No live penetration testing was performed.
- No dynamic runtime traffic inspection or external attack simulation was performed.
- Findings should be followed by staging validation.

---

## 3) Platform Architecture Overview

- Framework: Next.js 15 (App Router), React 19, TypeScript
- Auth: NextAuth v5 beta using JWT sessions and OAuth/Credentials providers
- Data layer: Prisma + PostgreSQL (Neon)
- Storage: AWS S3 presigned uploads
- Payments: Paystack webhook + transaction finalization flow
- Real-time: Socket.IO with token-based socket auth
- Access control model: route-role mapping in middleware plus server-side role checks in actions

Primary files reviewed:
- `auth.config.ts`
- `auth.ts`
- `middleware.ts`
- `routes.ts`
- `app/api/*`
- `next.config.mjs`
- `package.json`
- `.github/workflows/build.yml`

---

## 4) Verified Findings (Prioritized)

## Critical

### C1. Unauthenticated resource management API (create/read/update/delete)
- **Evidence:** `app/api/resources/route.ts`
- **Issue:** `POST`, `GET`, `PATCH`, and `DELETE` handlers have no `auth()` checks.
- **Impact:** Unauthenticated users can create, enumerate, modify, or delete learning resources.
- **Exploit path:** Direct API calls to `/api/resources` without a session.
- **Remediation:**
  - Add `auth()` guard at entry of all mutating handlers.
  - Enforce ownership/role checks (tutor/admin) on reads and writes.
  - Add schema validation (Zod) for request payloads.

### C2. Unauthenticated YouTube upload endpoint
- **Evidence:** `app/api/youtube/upload/route.ts`
- **Issue:** `POST` handler lacks authentication and role enforcement.
- **Impact:** Unauthorized uploads to configured YouTube channel are possible.
- **Exploit path:** Anonymous multipart upload requests.
- **Remediation:**
  - Require authenticated tutor/admin session.
  - Add rate limiting and payload size checks.
  - Add action logging for all successful uploads.

### C3. Unauthenticated presigned S3 upload endpoint
- **Evidence:** `app/api/upload/route.ts`
- **Issue:** `POST` handler lacks authentication.
- **Impact:** Unauthorized users can generate presigned upload policies.
- **Exploit path:** Anonymous requests can drive storage abuse/cost and content abuse.
- **Remediation:**
  - Require authenticated session and explicit role entitlement.
  - Apply route rate limiting and per-user quotas.
  - Validate filename and MIME against strict allowlist.

## High

### H1. IDOR risk in resource update/delete
- **Evidence:** `app/api/resources/route.ts`
- **Issue:** Update/delete uses caller-provided resource ID without ownership checks.
- **Impact:** Cross-tenant object tampering/deletion.
- **Remediation:**
  - Join resource to course/tutor ownership before mutation.
  - Return `403` for non-owner and non-admin attempts.

### H2. Missing security headers
- **Evidence:** `next.config.mjs`
- **Issue:** No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **Impact:** Increased exposure to clickjacking, content sniffing, and script injection classes.
- **Remediation:**
  - Add centralized headers config in Next.js.
  - Roll out conservative CSP and refine through report-only first.

### H3. Production build/lint quality controls are weak
- **Evidence:** `next.config.mjs`, command outputs
- **Issue:**
  - `eslint.ignoreDuringBuilds: true`
  - `typescript.ignoreBuildErrors: true`
  - `pnpm lint` fails due missing ESLint flat config compatibility
  - `pnpm build` fails with uncaught exception
- **Impact:** Security and correctness issues can bypass CI gates.
- **Remediation:**
  - Enforce lint/type/build as blocking in CI.
  - Fix ESLint v9 config migration.
  - Investigate and resolve build-time exception before release.

### H4. Permissive Socket.IO origin handling
- **Evidence:** `lib/socket.ts`
- **Issue:** Allows any `*.vercel.app` origin and localhost pattern.
- **Impact:** Cross-origin abuse opportunities if hostile deployment exists.
- **Remediation:**
  - Replace regex wildcard with strict, environment-specific allowlist.
  - Separate development and production origin policy.

## Medium

### M1. Sensitive debug and verbose logging in server paths
- **Evidence:** `app/api/upload/route.ts`, `middleware.ts`, `lib/socket.ts`, `app/layout.tsx`
- **Issue:** Console logs include internal state; Mixpanel init has `debug: true`.
- **Impact:** Potential telemetry leakage and noisy logs in production.
- **Remediation:**
  - Disable debug flags in production.
  - Replace raw console logging with structured logger and redaction.

### M2. Public-read object ACL for uploads
- **Evidence:** `app/api/upload/route.ts`
- **Issue:** Presigned uploads set `acl: "public-read"`.
- **Impact:** Uploaded files may be globally accessible by URL.
- **Remediation:**
  - Default bucket objects to private.
  - Serve via signed download URLs where needed.

### M3. Missing consistent validation across API routes
- **Evidence:** `app/api/resources/route.ts`, `app/api/upload/route.ts`
- **Issue:** Body parsing occurs without strict schema validation.
- **Impact:** malformed input and business logic bypass opportunities.
- **Remediation:**
  - Introduce Zod schemas for all route inputs.
  - Reject unknown fields and enforce bounds.

---

## 5) Dependency and Supply-Chain Posture

Command run:
- `pnpm audit --registry=https://registry.npmjs.org --audit-level=moderate`

Result:
- **15 vulnerabilities** reported (`5 high`, `10 moderate`)

Notable direct-impact advisories:
- `next` (multiple advisories; upgrade recommended beyond vulnerable ranges)
- `axios` DoS advisory (upgrade to patched version)
- `next-auth` beta advisory (upgrade to beta patch or stable line when feasible)

Transitive advisories include:
- `spinner > node-uuid`
- `@aws-sdk` transitive parser package
- Prisma dev-chain transitive dependencies

Additional dependency risk signals:
- Several dependencies pinned to `"latest"` in `package.json` (nondeterministic supply-chain behavior)
- Multiple packages reported as deprecated by `pnpm outdated`

Recommendations:
- Pin all direct dependencies to explicit versions.
- Adopt Renovate/Dependabot with weekly security PRs.
- Add CI job for `pnpm audit` with policy threshold.

---

## 6) CI/CD and Operational Security

Strengths:
- CI uses frozen lockfile (`pnpm install --frozen-lockfile`).
- No obvious hardcoded production secrets in workflow file.

Gaps:
- No explicit SAST/secret-scanning/dependency-scanning workflow steps.
- Build pipeline currently allows code quality suppression in app config.
- Lint command is currently nonfunctional under current ESLint major version.

Recommended CI additions:
- Secret scanning (e.g., Gitleaks)
- SAST (CodeQL or Semgrep)
- Dependency scanning and failing thresholds
- Required checks: lint, typecheck, build, unit tests

---

## 7) Secrets Handling Assessment

Observed:
- Local `.env` contains high-value credentials and API keys.
- `.gitignore` excludes `.env*`.
- `git ls-files .env .env.local` returned no tracked env files (good).

Risk interpretation:
- No evidence in this assessment that local env files are currently tracked in Git.
- However, secret concentration in local env makes accidental exposure impact high.

Recommendations:
- Rotate high-impact secrets if exposure is suspected.
- Use a managed secret store for production (not local file distribution).
- Add pre-commit secret scanning and repository-level secret protection.

---

## 8) Platform Health Results

### Lint
- Command: `pnpm lint`
- Status: **Failed**
- Reason: ESLint 9 requires `eslint.config.*`; current setup missing compatible config.

### Build
- Command: `pnpm build`
- Status: **Failed**
- Reason: Next.js build exits with `uncaughtException` (`TypeError` reading `length`).

### Impact
- Release confidence is reduced.
- Security controls are harder to verify when standard quality gates fail.

---

## 9) 30-Day Remediation Plan

### 0-72 hours
1. Add auth + role checks to:
   - `app/api/resources/route.ts`
   - `app/api/upload/route.ts`
   - `app/api/youtube/upload/route.ts`
2. Add ownership checks for resource update/delete.
3. Disable production debug flags and remove sensitive console logging in critical paths.

### 3-7 days
1. Implement security headers in `next.config.mjs`.
2. Add request schema validation to high-risk API routes.
3. Restrict Socket.IO CORS allowlist.
4. Set upload objects to private ACL and signed access pattern.

### 1-2 weeks
1. Fix ESLint v9 config and enforce lint/type/build in CI.
2. Resolve build exception and block deploys on failure.
3. Upgrade vulnerable direct dependencies (`next`, `axios`, `next-auth` line).

### 2-4 weeks
1. Add SAST, secret scanning, and dependency scanning in CI.
2. Introduce security test checklist for release gates.
3. Run authenticated and unauthenticated API abuse tests in staging.

---

## 10) Manual Validation Checklist (Next Step)

- Verify unauthenticated requests to upload/resource/youtube APIs return `401`.
- Verify tutor cannot modify/delete another tutor's resource (`403`).
- Validate security headers on all routes (including API responses where applicable).
- Confirm private object access model for uploads.
- Test webhook signature rejection with invalid signature.
- Test rate-limit behavior and lockout boundaries on sensitive endpoints.

---

## 11) Final Risk Statement

The platform is functionally mature but currently has exploitable API authorization weaknesses and insufficient production hardening. Addressing the three unauthenticated API surfaces plus header and dependency upgrades will materially reduce breach and abuse risk in the shortest time.
