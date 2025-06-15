export interface User {
  $id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Question {
  id: string; // 添加id字段用於答案狀態關聯
  $id: string;
  examId: string;
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correctAnswers: string[];
  order: number;
  createdAt: string;
}

export interface Exam {
  $id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  isPublic: boolean;
  timeLimit: number; // in minutes
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  $id: string;
  examId: string;
  userId: string;
  userName: string;
  answers: string; // JSON string of Record<string, number[]>
  score: number;
  completedAt: string;
  timeSpent: number; // in seconds
}

export interface LeaderboardEntry {
  $id: string;
  examId: string;
  userId: string;
  userName: string;
  score: number;
  completedAt: string;
  timeSpent: number;
  rank: number;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface CreateExamData {
  title: string;
  description: string;
  isPublic: boolean;
  timeLimit: number;
  creatorId: string;
  creatorName: string;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}