# IP-Based Brute Force Protection Implementation

## Overview

This document details the comprehensive brute force protection system implemented to prevent unauthorized login attempts and protect user accounts from credential stuffing attacks.

## Features Implemented

### 1. **IP-Based Rate Limiting**
- Limits login attempts from a single IP address
- Default: 10 failed attempts per IP within 15 minutes
- Automatic IP blocking for 1 hour after exceeding limit
- Works across multiple email addresses from the same IP

### 2. **Account Lockout Mechanism**
- Tracks failed login attempts per user account
- Locks account after 5 failed attempts within 15 minutes
- Automatic unlock after 15 minutes
- Users can reset password to regain immediate access

### 3. **Login Attempt Logging**
- Records all login attempts (successful and failed)
- Tracks IP address and user agent
- Enables historical analysis and forensics
- Helps identify attack patterns

### 4. **IP Blacklist Management**
- Maintains a database of blocked IPs
- Supports both automatic and manual blocking
- Expiring blocks automatically unlocked after set duration
- Admin interface for managing blacklist

### 5. **Security Headers & Client Detection**
- Extracts real IP address from multiple proxy headers:
  - `X-Forwarded-For` (standard proxy header)
  - `X-Real-IP` (Nginx reverse proxy)
  - `CF-Connecting-IP` (Cloudflare)
  - `X-Client-IP` (general proxy)

### 6. **User Profile Security Data**
- Tracks last login time and IP
- Tracks last failed login time and IP
- Maintains failed attempt counter
- Records account lock status and timestamp

## Database Schema

### LoginAttempt Table
```sql
CREATE TABLE "login_attempts" (
    "id" TEXT PRIMARY KEY,
    "ipAddress" TEXT,           -- IP address making the attempt
    "email" TEXT,               -- Email address being targeted (null for verification failures)
    "success" BOOLEAN,          -- Whether login attempt succeeded
    "userAgent" TEXT,           -- Browser/OS information
    "createdAt" TIMESTAMP       -- When attempt occurred
);

-- Indexes for performance
CREATE INDEX "login_attempts_ipAddress_idx" ON "login_attempts"("ipAddress");
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");
CREATE INDEX "login_attempts_createdAt_idx" ON "login_attempts"("createdAt");
```

### IPBlacklist Table
```sql
CREATE TABLE "ip_blacklist" (
    "id" TEXT PRIMARY KEY,
    "ipAddress" TEXT UNIQUE,    -- IP address to block
    "reason" TEXT,              -- Why it was blocked
    "blockedAt" TIMESTAMP,      -- When it was blocked
    "unblockedAt" TIMESTAMP,    -- When block expires
    "isActive" BOOLEAN          -- Is the block currently active?
);
```

### User Table Additions
```sql
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "accountLockedUntil" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "lastLoginIp" TEXT;
ALTER TABLE "users" ADD COLUMN "lastFailedLoginAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "lastFailedLoginIp" TEXT;
```

## Configuration

All settings are configurable in `/lib/ip-rate-limit.ts`:

```typescript
export const IP_RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS_PER_IP: 10,           // Attempts before IP blocked
  WINDOW_MS: 15 * 60 * 1000,         // 15 minute window
  MAX_ATTEMPTS_PER_EMAIL: 5,         // Attempts before account locked
  MIN_INTERVAL_SECONDS: 2,           // Min delay between attempts
  BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hour IP block
};
```

## Login Flow with Protection

```
User submits login form
    ↓
Extract client IP from headers
    ↓
Check if IP is blacklisted
    ├─→ YES: Return error, block attempt
    └─→ NO: Continue
    ↓
Check IP rate limit (last 15 minutes)
    ├─→ Exceeded: Block IP, return error
    └─→ OK: Continue
    ↓
Check if user account exists
    ├─→ NO: Log attempt, return generic error
    └─→ YES: Continue
    ↓
Check if user account is locked
    ├─→ YES: Return error with unlock time
    └─→ NO: Continue
    ↓
Verify credentials
    ├─→ INVALID: Increment attempts, check if should lock, log attempt
    └─→ VALID: Reset counters, log success, return success
```

## Admin Security Dashboard

Available at `/admin/security` (admin only):

### Features:
1. **Real-time Statistics**
   - Failed login attempts (last 24h)
   - Successful login attempts (last 24h)
   - Unique IP addresses attempting login
   - Unique emails targeted

2. **IP Management**
   - View all blocked IPs
   - View blocking reason and timestamp
   - Manually block IPs
   - Manually unblock IPs
   - View detailed stats per IP

3. **Account Management**
   - View all locked accounts
   - See lock duration remaining
   - Unlock accounts manually
   - View failed attempt history

4. **Reports**
   - Suspicious activity report
   - Top IPs by failed attempts
   - Top emails targeted
   - Export data for analysis

## Files Modified

### New Files Created:
- `/lib/ip-rate-limit.ts` - IP-based rate limiting logic
- `/actions/security-admin.ts` - Admin security management actions
- `/prisma/migrations/20260218_add_ip_brute_force_protection` - Database schema migration

### Modified Files:
- `/actions/auth.ts` - Updated login function with IP checking
- `/prisma/schema.prisma` - Added LoginAttempt, IPBlacklist models and User fields

## Usage Examples

### Block an IP (Admin)
```typescript
import { blockIP } from "@/lib/ip-rate-limit";

await blockIP("192.168.1.100", "Brute force attack detected");
```

### Check IP Rate Limit
```typescript
import { checkIPRateLimit } from "@/lib/ip-rate-limit";

const result = await checkIPRateLimit({
  ipAddress: "192.168.1.100",
  email: "user@example.com",
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000
});

if (result.isBlocked) {
  return { error: result.reason };
}
```

### Record Login Attempt
```typescript
import { recordLoginAttempt } from "@/lib/ip-rate-limit";

await recordLoginAttempt({
  ipAddress: "192.168.1.100",
  email: "user@example.com",
  userAgent: "Mozilla/5.0...",
  success: true
});
```

### Get IP Statistics
```typescript
import { getIPStats } from "@/lib/ip-rate-limit";

const stats = await getIPStats("192.168.1.100");
// Returns: { ipAddress, total, failed, successful, uniqueEmails, recentAttempts }
```

## Security Best Practices Implemented

1. **Don't Reveal User Enumeration**
   - Returns "Invalid email or password" even if email doesn't exist
   - Rate limits by IP prevent email enumeration

2. **Progressive Security**
   - IP-level blocking prevents large-scale attacks
   - Account-level locking protects individual accounts
   - Combination provides defense in depth

3. **Non-Destructive Lockout**
   - Account locks automatically expire (15 minutes)
   - Users can reset password for immediate access
   - No permanent account damage from attacks

4. **Audit Trail**
   - All attempts logged with timestamp and IP
   - Failed attempt tracking helps identify compromised passwords
   - IP history helps detect account takeover

5. **Graceful Degradation**
   - If database fails, system won't block legitimate users
   - Falls back to allow attempts while logging errors
   - Prevents false positives from affecting users

## Monitoring & Maintenance

### Regular Tasks:
1. **Review Login Attempts** (Daily)
   - Check for unusual patterns
   - Monitor suspicious IPs
   - Review failed attempts by email

2. **Cleanup Old Data** (Weekly)
   - Run `cleanupLoginAttempts(30)` to keep DB lean
   - Keeps only last 30 days of attempt logs
   - Improves query performance

3. **Review Locked Accounts** (Daily)
   - Check for legitimate users affected by attacks
   - Unlock if appropriate
   - Contact users if targeted

4. **Analyze Attack Patterns** (Weekly)
   - Review suspicious activity report
   - Identify new attack sources
   - Adjust thresholds if needed

## API Reference

### Core Functions

#### `checkIPRateLimit(options)`
Checks if an IP has exceeded rate limits.
- Returns: `{ isBlocked, currentAttempts, remainingAttempts, resetTime }`

#### `recordLoginAttempt(options)`
Records a login attempt.
- Parameters: `ipAddress`, `email`, `userAgent`, `success`

#### `blockIP(ipAddress, reason)`
Manually blocks an IP address.

#### `unblockIP(ipAddress)`
Manually unblocks an IP address.

#### `getIPStats(ipAddress)`
Gets detailed statistics for an IP address.

#### `cleanupOldLoginAttempts(daysToKeep)`
Cleans up old login attempt records.

## Troubleshooting

### Users Locked Out
1. Check admin dashboard - see which accounts are locked
2. Verify it's not an attack in progress
3. Use `unlockUserAccount()` to unlock
4. Optionally send user password reset link

### False Positives (Legitimate IPs Blocked)
1. Use `viewIPStats()` to review the IP's activity
2. If legitimate, unblock with `manuallyUnblockIP()`
3. Consider adjusting thresholds for that IP/user

### Database Performance Issues
1. Run `cleanupLoginAttempts()` to remove old records
2. Queries already have proper indexes
3. Consider archiving old data if logs grow too large

## Future Enhancements

1. **Machine Learning Detection**
   - Pattern recognition for attack signatures
   - Anomaly detection for unusual login patterns

2. **Geographic IP Analysis**
   - Alert on logins from unusual countries
   - Block known VPN/proxy IP ranges

3. **CAPTCHA Integration**
   - After N failed attempts, require CAPTCHA
   - Reduces bot attacks while allowing humans

4. **Email Alerts**
   - Notify users of failed attempts
   - Alert admins of large attacks

5. **Two-Factor Authentication (2FA)**
   - Additional layer regardless of password
   - Protects even if password is compromised

## Support & Questions

For questions about the security implementation, refer to:
- `/lib/ip-rate-limit.ts` - Core implementation
- `/actions/security-admin.ts` - Admin functions
- `/actions/auth.ts` - Login flow integration
