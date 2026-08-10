/**
 * Preload for the exam notification verification script.
 *
 * Must run BEFORE the module under test is required, which is why it is a
 * separate preload rather than statements at the top of the script: TypeScript's
 * CommonJS emit hoists every `require` above other top-level statements, so
 * anything set inside the script itself would run too late.
 *
 * Used as:
 *   pnpm tsx --require ./scripts/_exam-test-bootstrap.cjs scripts/verify-exam-notifications.ts
 */

// Never contact the mail provider from a test run.
process.env.EXAM_NOTIFICATIONS_DRY_RUN = "1";

// `server-only` throws when loaded outside Next. Seed the require cache with an
// empty module so the code under test can be imported. The guard stays intact
// for the real build — this workaround exists only in the test path.
try {
  const resolved = require.resolve("server-only");
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
    children: [],
    paths: [],
  };
} catch {
  // Not installed — nothing to stub.
}
