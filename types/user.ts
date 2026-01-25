export type UserRole = "USER" | "STUDENT" | "TUTOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: "STUDENT";
  enrolledCourses: string[];
  completedCourses: string[];
  progress: Record<string, number>;
  mentorshipSessions: string[];
  projects: string[];
  examResults: ExamResult[];
}

export interface Tutor extends User {
  role: "TUTOR";
  expertise: string[];
  courses: string[];
  rating: number;
  totalStudents: number;
  bio: string;
  hourlyRate: number;
}

export interface Admin extends User {
  role: "ADMIN";
  permissions: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  duration: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category: string;
  tutorId: string;
  modules: CourseModule[];
  isVirtual: boolean;
  isPhysical: boolean;
  location?: string;
  maxStudents?: number;
  enrolledStudents: number;
  rating: number;
  reviews: Review[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: number;
  resources: Resource[];
  quiz?: Quiz;
  project?: Project;
}

export interface ExamResult {
  id: string;
  courseId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  aiInterviewScore?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  submissionUrl?: string;
  feedback?: string;
  grade?: number;
  submittedAt?: Date;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  isPublic?: boolean;
  reviewerName?: string;
  tutorName?: string;
  createdAt: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: "PDF" | "VIDEO" | "LINK" | "CODE";
  url: string;
}

export interface Quiz {
  id: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
