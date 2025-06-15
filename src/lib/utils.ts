import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function calculateScore(questions: any[], answers: Record<string, number[]>) {
  let correct = 0;
  let total = questions.length;
  
  for (const question of questions) {
    const userAnswer = answers[question.id] || [];
    const correctAnswer = question.correctAnswers;
    
    // 将数字数组转换为字符串数组进行比较
    const userAnswerStr = userAnswer.map(String).sort();
    const correctAnswerStr = correctAnswer.map(String).sort();
    
    if (JSON.stringify(userAnswerStr) === JSON.stringify(correctAnswerStr)) {
      correct++;
    }
  }
  
  return Math.round((correct / total) * 100);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 添加到現有的 utils.ts 文件中
export const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  
  return (...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};