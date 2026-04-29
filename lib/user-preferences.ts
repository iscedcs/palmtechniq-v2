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
