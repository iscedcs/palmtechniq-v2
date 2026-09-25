export const defaultUserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  courseReminders: true,
  mentorshipAlerts: true,
  achievementNotifications: true,
  weeklyProgress: true,
  marketingEmails: false,
  publicProfile: true,
  showProgress: true,
  showAchievements: true,
};

export type UserPreferences = typeof defaultUserPreferences;

/**
 * Does this user want an email on this topic?
 *
 * `User.preferences` is a JSON column that only ever contains the keys a user
 * has actually toggled, so a missing key means "still on the default" — and
 * every email switch defaults to on. That is why this compares against `false`
 * instead of testing truthiness: `if (prefs.emailNotifications)` would treat a
 * tutor who has never opened their settings as having opted out, and quietly
 * stop telling them about their own sales.
 *
 * The master switch always applies. A topic switch, when given, must also be
 * on — so turning off "Email Notifications" silences everything, and turning
 * off just one topic silences just that.
 */
export function allowsEmail(
  preferences: unknown,
  topic?: Exclude<keyof UserPreferences, "emailNotifications">,
): boolean {
  const prefs =
    preferences && typeof preferences === "object"
      ? (preferences as Record<string, unknown>)
      : {};

  if (prefs.emailNotifications === false) return false;
  if (topic && prefs[topic] === false) return false;
  return true;
}
