# Security Admin Quick Start Guide

## Accessing Security Features

All security admin functions are located in `/actions/security-admin.ts` and require admin role.

## Common Admin Tasks

### 1. View Security Dashboard Summary
```typescript
import { getSecurityDashboardSummary } from "@/actions/security-admin";

const dashboard = await getSecurityDashboardSummary();
// Returns statistics about login attempts, blocked IPs, locked accounts, and config
```

### 2. View All Blocked IPs
```typescript
import { getBlockedIPs } from "@/actions/security-admin";

const blockedIPs = await getBlockedIPs();
// Returns list of all active IP blocks with reason and timestamp
```

### 3. Manually Block an IP
```typescript
import { manuallyBlockIP } from "@/actions/security-admin";

await manuallyBlockIP("192.168.1.100", "Suspected brute force attack");
// IP will be blocked for 1 hour automatically
```

### 4. Unblock an IP
```typescript
import { manuallyUnblockIP } from "@/actions/security-admin";

await manuallyUnblockIP("192.168.1.100");
// IP will be immediately unblocked
```

### 5. View Details for Specific IP
```typescript
import { viewIPStats } from "@/actions/security-admin";

const stats = await viewIPStats("192.168.1.100");
// Returns: {
//   ipAddress, total attempts, failed, successful, 
//   uniqueEmails attempted, recent attempts list
// }
```

### 6. View All Login Attempts
```typescript
import { getLoginAttempts } from "@/actions/security-admin";

// Get all attempts
const attempts = await getLoginAttempts();

// Filter by IP
const attemptsFromIP = await getLoginAttempts({ 
  ipAddress: "192.168.1.100",
  limit: 50 
});

// Filter by email
const attemptsOnEmail = await getLoginAttempts({ 
  email: "user@example.com" 
});

// Get only failed attempts
const failedAttempts = await getLoginAttempts({ 
  success: false 
});
```

### 7. View Locked User Accounts
```typescript
import { getLockedAccounts } from "@/actions/security-admin";

const lockedAccounts = await getLockedAccounts();
// Returns list of accounts currently locked with lock duration
```

### 8. Unlock a User's Account
```typescript
import { unlockUserAccount } from "@/actions/security-admin";

await unlockUserAccount("userId123");
// Account will be immediately unlocked and failed attempt counter reset
```

### 9. View Suspicious Activity Report
```typescript
import { getSuspiciousActivityReport } from "@/actions/security-admin";

const report = await getSuspiciousActivityReport();
// Returns top IPs and emails with highest failed attempt counts (last 7 days)
```

### 10. Clean Up Old Login Attempts
```typescript
import { cleanupLoginAttempts } from "@/actions/security-admin";

await cleanupLoginAttempts(30); // Keep logs from last 30 days
// Deletes login attempt records older than 30 days to keep DB clean
```

## Response Format

All admin functions return standardized responses:

### Success Response
```typescript
{
  success: true,
  data: { /* actual data */ }
}
```

### Error Response
```typescript
{
  error: "Error message describing what went wrong"
}
```

## Security Configuration

Current settings (in `/lib/ip-rate-limit.ts`):

| Setting | Value | Purpose |
|---------|-------|---------|
| MAX_ATTEMPTS_PER_IP | 10 | Block IP after 10 failed attempts |
| MAX_ATTEMPTS_PER_EMAIL | 5 | Lock account after 5 failed attempts |
| WINDOW_MS | 15 minutes | Rolling window for counting attempts |
| BLOCK_DURATION_MS | 1 hour | How long IP stays blocked |
| MIN_INTERVAL_SECONDS | 2 | Minimum delay between login attempts |

### To Adjust Settings
1. Edit `/lib/ip-rate-limit.ts`
2. Modify the `IP_RATE_LIMIT_CONFIG` object
3. Changes take effect immediately (no restart needed)

## Common Scenarios

### Scenario 1: User Locked Due to Failed Attempts
**Symptoms**: User can't login, gets message "Account temporarily locked..."

**Solution**:
```javascript
// 1. Check if account is locked
const lockedAccounts = await getLockedAccounts();

// 2. Verify it's not an active attack
const ipStats = await viewIPStats("suspect-ip");

// 3. Unlock the account
await unlockUserAccount("userId");

// 4. Optionally unblock the IP if it was legitimate
await manuallyUnblockIP("legitimate-ip");
```

### Scenario 2: Brute Force Attack in Progress
**Symptoms**: Spike in failed login attempts from multiple IPs

**Solution**:
```javascript
// 1. Get suspicious activity report
const report = await getSuspiciousActivityReport();

// 2. Block the attacking IPs
for (const ip of report.topIPsByFailedAttempts) {
  if (ip.failedAttempts > 20) {
    await manuallyBlockIP(ip.ipAddress, "Aggressive brute force attack");
  }
}

// 3. Notify support team
// (Send alert email with attack details)

// 4. Monitor the situation
const dashboard = await getSecurityDashboardSummary();
// Check if new attacks are coming from different IPs
```

### Scenario 3: Legitimate User Behind Corporate Proxy Blocked
**Symptoms**: User reports they can't login from work, gets "Try again later" message

**Solution**:
```javascript
// 1. Check IP stats to understand the situation
const stats = await viewIPStats("corporate-ip");
// If multiple employees are using same proxy, might genuinely trigger limits

// 2. Unblock the IP
await manuallyUnblockIP("corporate-ip");

// 3. Consider increasing MAX_ATTEMPTS_PER_IP for corporate ranges
// Edit config if this pattern repeats

// 4. Consider IP whitelist for known corporate ranges (future enhancement)
```

### Scenario 4: Password Compromise Detection
**Symptoms**: Failed attempts from same IP using different email addresses

**Solution**:
```javascript
// 1. Get login attempts from suspicious IP
const attempts = await getLoginAttempts({ ipAddress: "attacker-ip" });

// 2. If multiple emails targeted, it's likely a credential stuffing attack
const uniqueEmails = new Set(attempts.map(a => a.email));

if (uniqueEmails.size > 10) {
  // 3. Block the IP
  await manuallyBlockIP("attacker-ip", "Credential stuffing attack detected");
  
  // 4. Get list of targeted emails
  const targetedEmails = Array.from(uniqueEmails);
  
  // 5. Send notification to users
  // (Optional: send "suspicious activity detected" emails to targeted accounts)
}
```

## Monitoring Best Practices

### Daily Check
```javascript
// Every morning, review suspicious activity
const dashboard = await getSecurityDashboardSummary();
console.log("Failed attempts (24h):", dashboard.data.last24h.failedLoginAttempts);
console.log("Actively blocked IPs:", dashboard.data.current.activelyBlockedIPs);
console.log("Locked accounts:", dashboard.data.current.lockedUserAccounts);
```

### Weekly Analysis
```javascript
// Review attack patterns
const report = await getSuspiciousActivityReport();
// Identify repeat offenders and trends
```

### Monthly Maintenance
```javascript
// Clean up old logs
await cleanupLoginAttempts(30);
// Keep database lean and queries fast
```

## Important Notes

⚠️ **Security Reminders**
- Always verify activity is malicious before blocking IPs
- Some legitimate services might genuinely trigger limits
- Keep audit trail for compliance/investigation
- Never share admin credentials or access links
- All actions are logged for audit purposes

✅ **Best Practices**
- Review locked accounts daily
- Unblock only after verifying legitimacy
- Monitor trends weekly
- Keep logs for 90+ days for investigation
- Document any manual blocks with clear reasons

## Troubleshooting Admin Functions

### "Unauthorized" Error
- Make sure you're logged in as admin
- Check user role is "ADMIN" in database

### Database Connection Errors
- Verify database is running
- Check connection string in .env
- Ensure migrations are applied

### Missing Data
- Check if cleanupLoginAttempts() ran recently
- Old data (>30 days) might have been deleted
- Check timestamp filters in queries

## Need Help?

Refer to the comprehensive documentation:
- Implementation details: `/docs/SECURITY-IP-BRUTE-FORCE-PROTECTION.md`
- Code reference: `/lib/ip-rate-limit.ts`
- Integration reference: `/actions/auth.ts`
