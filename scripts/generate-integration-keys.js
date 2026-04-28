#!/usr/bin/env node
/**
 * Generate secure API keys for mailing sync integration
 * Usage: node scripts/generate-integration-keys.js
 */

const crypto = require("crypto");

function generateKey() {
  return crypto.randomBytes(32).toString("hex");
}

const primaryKey = generateKey();
const previousKey = generateKey();

console.log("\n🔐 Generated Integration Keys\n");
console.log("Primary Key (use this in MAILING_SYNC_API_KEY):");
console.log(primaryKey);
console.log("\nPrevious Key (use this in MAILING_SYNC_API_KEY_PREVIOUS):");
console.log(previousKey);
console.log("\n📝 Add these to your .env file:\n");
console.log(`MAILING_SYNC_API_KEY=${primaryKey}`);
console.log(`MAILING_SYNC_API_KEY_PREVIOUS=${previousKey}`);
console.log("\n✅ Optional: Set IP allowlist (comma-separated):");
console.log("MAILING_SYNC_ALLOWED_IPS=1.2.3.4,5.6.7.8\n");
