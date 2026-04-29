"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ================================
// TYPES
// ================================

export type Locale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "zh"
  | "ja"
  | "ko"
  | "ar"
  | "hi";

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  [locale: string]: Translation;
}

// ================================
// TRANSLATIONS
// ================================

const translations: Translations = {
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      next: "Next",
      previous: "Previous",
      close: "Close",
      open: "Open",
      yes: "Yes",
      no: "No",
      ok: "OK",
      back: "Back",
      continue: "Continue",
      submit: "Submit",
      reset: "Reset",
      clear: "Clear",
      select: "Select",
      upload: "Upload",
      download: "Download",
      share: "Share",
      copy: "Copy",
      paste: "Paste",
      cut: "Cut",
      undo: "Undo",
      redo: "Redo",
      refresh: "Refresh",
      reload: "Reload",
      logout: "Logout",
      login: "Login",
      signup: "Sign Up",
      profile: "Profile",
      settings: "Settings",
      help: "Help",
      about: "About",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      home: "Home",
      dashboard: "Dashboard",
      courses: "Courses",
      students: "Students",
      instructors: "Instructors",
      notifications: "Notifications",
      messages: "Messages",
      calendar: "Calendar",
      reports: "Reports",
      analytics: "Analytics",
      billing: "Billing",
      account: "Account",
    },
    navigation: {
      home: "Home",
      courses: "Courses",
      about: "About",
      contact: "Contact",
      login: "Login",
      signup: "Sign Up",
      dashboard: "Dashboard",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      search: "Search",
      cart: "Cart",
      wishlist: "Wishlist",
      notifications: "Notifications",
    },
    auth: {
      login: {
        title: "Welcome Back",
        subtitle: "Sign in to your account to continue learning",
        email: "Email",
        password: "Password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        loginButton: "Sign In",
        noAccount: "Don't have an account?",
        signupLink: "Sign up here",
        googleLogin: "Continue with Google",
        githubLogin: "Continue with GitHub",
      },
      signup: {
        title: "Create Account",
        subtitle: "Join thousands of learners worldwide",
        name: "Full Name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        agreeTerms: "I agree to the Terms of Service and Privacy Policy",
        signupButton: "Create Account",
        hasAccount: "Already have an account?",
        loginLink: "Sign in here",
        googleSignup: "Sign up with Google",
        githubSignup: "Sign up with GitHub",
      },
      forgotPassword: {
        title: "Reset Password",
        subtitle: "Enter your email to receive reset instructions",
        email: "Email",
        sendButton: "Send Reset Link",
        backToLogin: "Back to Login",
        success: "Reset link sent to your email",
      },
    },
    courses: {
      title: "Courses",
      subtitle: "Discover and learn new skills",
      searchPlaceholder: "Search courses...",
      filterBy: "Filter by",
      sortBy: "Sort by",
      level: "Level",
      category: "Category",
      price: "Price",
      rating: "Rating",
      duration: "Duration",
      language: "Language",
      instructor: "Instructor",
      students: "students",
      lessons: "lessons",
      hours: "hours",
      free: "Free",
      paid: "Paid",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      enrollNow: "Enroll Now",
      addToCart: "Add to Cart",
      addToWishlist: "Add to Wishlist",
      preview: "Preview",
      overview: "Overview",
      curriculum: "Curriculum",
      reviews: "Reviews",
      instructor_info: "Instructor",
      requirements: "Requirements",
      whatYouLearn: "What you'll learn",
      courseIncludes: "This course includes",
      videoContent: "hours of video content",
      downloadableResources: "downloadable resources",
      assignments: "assignments",
      certificate: "Certificate of completion",
      lifetimeAccess: "Lifetime access",
      mobileAccess: "Access on mobile and TV",
    },
    dashboard: {
      welcome: "Welcome back",
      overview: "Overview",
      myLearning: "My Learning",
      progress: "Progress",
      achievements: "Achievements",
      schedule: "Schedule",
      recentActivity: "Recent Activity",
      upcomingSessions: "Upcoming Sessions",
      completedCourses: "Completed Courses",
      inProgress: "In Progress",
      notStarted: "Not Started",
      totalHours: "Total Hours",
      coursesCompleted: "Courses Completed",
      currentStreak: "Current Streak",
      totalPoints: "Total Points",
      rank: "Rank",
      nextGoal: "Next Goal",
      studyTime: "Study Time",
      weeklyGoal: "Weekly Goal",
      monthlyGoal: "Monthly Goal",
      continueWatching: "Continue Watching",
      recommendedForYou: "Recommended for You",
      newCourses: "New Courses",
      popularCourses: "Popular Courses",
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal Information",
      accountSettings: "Account Settings",
      preferences: "Preferences",
      security: "Security",
      billing: "Billing",
      notifications: "Notifications",
      privacy: "Privacy",
      name: "Name",
      email: "Email",
      phone: "Phone",
      bio: "Bio",
      location: "Location",
      website: "Website",
      socialLinks: "Social Links",
      avatar: "Profile Picture",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      twoFactorAuth: "Two-Factor Authentication",
      emailNotifications: "Email Notifications",
      pushNotifications: "Push Notifications",
      marketingEmails: "Marketing Emails",
      courseUpdates: "Course Updates",
      systemNotifications: "System Notifications",
      language: "Language",
      timezone: "Timezone",
      theme: "Theme",
      currency: "Currency",
    },
    cart: {
      title: "Shopping Cart",
      empty: "Your cart is empty",
      items: "items",
      subtotal: "Subtotal",
      discount: "Discount",
      total: "Total",
      promoCode: "Promo Code",
      applyPromo: "Apply",
      removeItem: "Remove",
      checkout: "Checkout",
      continueShopping: "Continue Shopping",
      savedForLater: "Saved for Later",
      moveToWishlist: "Move to Wishlist",
      quantity: "Quantity",
      price: "Price",
      estimatedTotal: "Estimated Total",
      taxIncluded: "Tax included",
      freeShipping: "Free shipping",
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Mark all as read",
      clearAll: "Clear all",
      noNotifications: "No notifications",
      newCourse: "New course available",
      assignmentGraded: "Assignment graded",
      sessionReminder: "Session reminder",
      courseUpdate: "Course updated",
      newMessage: "New message",
      achievement: "Achievement unlocked",
      paymentConfirmed: "Payment confirmed",
      enrollmentConfirmed: "Enrollment confirmed",
      certificateReady: "Certificate ready",
      deadlineReminder: "Deadline reminder",
    },
    errors: {
      general: "Something went wrong",
      network: "Network error",
      unauthorized: "Unauthorized access",
      forbidden: "Access forbidden",
      notFound: "Page not found",
      serverError: "Server error",
      validationError: "Validation error",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      nameRequired: "Name is required",
      invalidEmail: "Invalid email format",
      passwordTooShort: "Password too short",
      passwordsNotMatch: "Passwords do not match",
      emailAlreadyExists: "Email already exists",
      invalidCredentials: "Invalid credentials",
      accountNotVerified: "Account not verified",
      sessionExpired: "Session expired",
      fileTooBig: "File too big",
      invalidFileType: "Invalid file type",
      uploadFailed: "Upload failed",
    },
    success: {
      accountCreated: "Account created successfully",
      loginSuccessful: "Login successful",
      passwordChanged: "Password changed successfully",
      profileUpdated: "Profile updated successfully",
      emailSent: "Email sent successfully",
      fileUploaded: "File uploaded successfully",
      courseEnrolled: "Course enrolled successfully",
      paymentSuccessful: "Payment successful",
      courseCompleted: "Course completed successfully",
      certificateGenerated: "Certificate generated successfully",
      settingsSaved: "Settings saved successfully",
      messagesSent: "Message sent successfully",
    },
  },
  es: {
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      view: "Ver",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      next: "Siguiente",
      previous: "Anterior",
      close: "Cerrar",
      open: "Abrir",
      yes: "Sí",
      no: "No",
      ok: "OK",
      back: "Atrás",
      continue: "Continuar",
      submit: "Enviar",
      reset: "Restablecer",
      clear: "Limpiar",
      select: "Seleccionar",
      upload: "Subir",
      download: "Descargar",
      share: "Compartir",
      copy: "Copiar",
      paste: "Pegar",
      cut: "Cortar",
      undo: "Deshacer",
      redo: "Rehacer",
      refresh: "Actualizar",
      reload: "Recargar",
      logout: "Cerrar sesión",
      login: "Iniciar sesión",
      signup: "Registrarse",
      profile: "Perfil",
      settings: "Configuración",
      help: "Ayuda",
      about: "Acerca de",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
      home: "Inicio",
      dashboard: "Panel",
      courses: "Cursos",
      students: "Estudiantes",
      instructors: "Instructores",
      notifications: "Notificaciones",
      messages: "Mensajes",
      calendar: "Calendario",
      reports: "Reportes",
      analytics: "Analíticas",
      billing: "Facturación",
      account: "Cuenta",
    },
    navigation: {
      home: "Inicio",
      courses: "Cursos",
      about: "Acerca de",
      contact: "Contacto",
      login: "Iniciar sesión",
      signup: "Registrarse",
      dashboard: "Panel",
      profile: "Perfil",
      settings: "Configuración",
      logout: "Cerrar sesión",
      search: "Buscar",
      cart: "Carrito",
      wishlist: "Lista de deseos",
      notifications: "Notificaciones",
    },
    // ... more Spanish translations
  },
  // ... more languages
};

// ================================
// I18N STORE
// ================================

interface I18nState {
  locale: Locale;
  translations: Translation;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: "en",
      translations: translations.en,

      setLocale: (locale: Locale) => {
        set({
          locale,
          translations: translations[locale] || translations.en,
        });
      },

      t: (key: string, params?: Record<string, string | number>) => {
        const state = get();
        const keys = key.split(".");
        let value: any = state.translations;

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            // Fallback to English if key not found
            value = translations.en;
            for (const fallbackKey of keys) {
              if (value && typeof value === "object" && fallbackKey in value) {
                value = value[fallbackKey];
              } else {
                return key; // Return key if not found in fallback
              }
            }
            break;
          }
        }

        if (typeof value !== "string") {
          return key;
        }

        // Replace parameters
        if (params) {
          return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
          });
        }

        return value;
      },

      formatNumber: (value: number) => {
        const state = get();
        return new Intl.NumberFormat(state.locale).format(value);
      },

      formatCurrency: (value: number, currency = "NGN") => {
        const state = get();
        return new Intl.NumberFormat(state.locale, {
          style: "currency",
          currency,
        }).format(value);
      },

      formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
        const state = get();
        return new Intl.DateTimeFormat(state.locale, options).format(date);
      },

      formatRelativeTime: (date: Date) => {
        const state = get();
        const now = new Date();
        const diffInSeconds = Math.floor(
          (now.getTime() - date.getTime()) / 1000,
        );

        const rtf = new Intl.RelativeTimeFormat(state.locale, {
          numeric: "auto",
        });

        if (diffInSeconds < 60) {
          return rtf.format(-diffInSeconds, "second");
        } else if (diffInSeconds < 3600) {
          return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
        } else if (diffInSeconds < 86400) {
          return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
        } else if (diffInSeconds < 2592000) {
          return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
        } else if (diffInSeconds < 31536000) {
          return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
        } else {
          return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
        }
      },
    }),
    {
      name: "i18n-storage",
      partialize: (state) => ({
        locale: state.locale,
      }),
    },
  ),
);

// ================================
// LANGUAGE SELECTOR COMPONENT
// ================================

export const languages: { code: Locale; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

// ================================
// HOOKS
// ================================

export function useTranslation() {
  const {
    t,
    locale,
    setLocale,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  } = useI18nStore();

  return {
    t,
    locale,
    setLocale,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  };
}

export function useLocale() {
  const { locale, setLocale } = useI18nStore();
  return { locale, setLocale };
}
