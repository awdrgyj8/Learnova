'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Calendar, BookOpen, CheckCircle, XCircle, ArrowRight, ArrowLeft, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, EXAMS_COLLECTION_ID, QUESTIONS_COLLECTION_ID, SUBMISSIONS_COLLECTION_ID, ID, Query } from '@/lib/appwrite';
import { Exam, Question, Submission } from '@/types';
import { formatDate, calculateScore } from '@/lib/utils';

interface ExamPageProps {
  params: { id: string };
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const examId = params?.id as string;

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStarted && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleSubmit(true); // 自動提交
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, timeLeft]);

  const fetchExam = async () => {
    try {
      // 获取考试基本信息
      const examData = await databases.getDocument(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        examId
      );
      
      // 获取考试相关的问题
      const questionsResponse = await databases.listDocuments(
        DATABASE_ID,
        QUESTIONS_COLLECTION_ID,
        [
          Query.equal('examId', examId)
        ]
      );
      
      // 将问题数据转换为前端期望的格式
      const questions = questionsResponse.documents.map((doc: any) => ({
        id: doc.$id,
        question: doc.question,
        options: doc.options,
        correctAnswers: doc.correctAnswers,
        type: doc.type
      }));
      
      // 组合考试数据和问题数据
      const examWithQuestions = {
        ...examData,
        questions: questions
      };
      
      setExam(examWithQuestions as Exam);
    } catch (error) {
      console.error('獲取考試失敗:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    if (!exam) return;
    
    setIsStarted(true);
    setStartTime(new Date());
    
    if (exam.timeLimit) {
      setTimeLeft(exam.timeLimit * 60); // 轉換為秒
    }
  };

  const handleAnswerChange = (questionId: string, optionIndex: number, isMultiple: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (isMultiple) {
        // 多選題
        if (currentAnswers.includes(optionIndex)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(answer => answer !== optionIndex)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, optionIndex]
          };
        }
      } else {
        // 單選題
        return {
          ...prev,
          [questionId]: [optionIndex]
        };
      }
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!exam || !user || !startTime || isSubmitting) return;
    
    if (!isAutoSubmit) {
      const confirmSubmit = confirm('確定要提交考試嗎？提交後無法修改答案。');
      if (!confirmSubmit) return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const score = calculateScore(exam.questions, answers);
      
      const submissionData: Omit<Submission, '$id' | '$createdAt' | '$updatedAt'> = {
        examId: exam.$id,
        userId: user.$id,
        userName: user.name,
        answers: JSON.stringify(answers),
        score,
        timeSpent,
        completedAt: endTime.toISOString(),
      };
      
      await databases.createDocument(
        DATABASE_ID,
        SUBMISSIONS_COLLECTION_ID,
        ID.unique(),
        submissionData
      );
      
      setHasSubmitted(true);
    } catch (error) {
      console.error('提交考試失敗:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).filter(questionId => 
      answers[questionId] && answers[questionId].length > 0
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            考試不存在
          </h1>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    const score = calculateScore(exam.questions, answers);
    const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
          >
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
              score >= 80 ? 'bg-green-100 dark:bg-green-900' :
              score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' :
              'bg-red-100 dark:bg-red-900'
            }`}>
              {score >= 60 ? (
                <CheckCircle className={`h-8 w-8 ${
                  score >= 80 ? 'text-green-600 dark:text-green-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`} />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              考試完成！
            </h1>
            
            <div className={`text-6xl font-bold mb-4 ${
              score >= 80 ? 'text-green-600 dark:text-green-400' :
              score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {score}分
            </div>
            
            <p className={`text-lg mb-6 ${
              score >= 80 ? 'text-green-600 dark:text-green-400' :
              score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {score >= 80 ? '優秀！' :
               score >= 60 ? '及格' : '需要加油'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="block font-medium">用時</span>
                <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
              </div>
              <div>
                <span className="block font-medium">正確率</span>
                <span>{Math.round((score / 100) * 100)}%</span>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/leaderboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看排行榜
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                返回儀表板
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {exam.title}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {exam.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <BookOpen className="mr-2 h-5 w-5" />
                <span>{exam.totalQuestions} 道題目</span>
              </div>
              
              {exam.timeLimit && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{exam.timeLimit} 分鐘</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <User className="mr-2 h-5 w-5" />
                <span>創建者：{exam.creatorId}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="mr-2 h-5 w-5" />
                <span>{formatDate(exam.createdAt)}</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                考試須知
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• 考試開始後無法暫停</li>
                <li>• 請確保網路連接穩定</li>
                {exam.timeLimit && <li>• 時間到會自動提交</li>}
                <li>• 提交後無法修改答案</li>
              </ul>
            </div>
            
            <div className="flex justify-center">
              {user ? (
                <button
                  onClick={startExam}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  開始考試
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    請先登入才能參加考試
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    前往登入
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.totalQuestions) * 100;
  const answeredCount = getAnsweredQuestionsCount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {exam.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                題目 {currentQuestionIndex + 1} / {exam.totalQuestions}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {timeLeft !== null && (
                <div className={`flex items-center px-3 py-1 rounded-lg ${
                  timeLeft <= 300 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                  timeLeft <= 600 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  <Clock className="mr-1 h-4 w-4" />
                  <span className="font-mono">{formatTime(timeLeft)}</span>
                </div>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                已答：{answeredCount}/{exam.totalQuestions}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8"
          >
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentQuestion.type === 'single' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {currentQuestion.type === 'single' ? '單選題' : '多選題'}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {currentQuestion.question}
              </h2>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = answers[currentQuestion.id]?.includes(optionIndex) || false;
                
                return (
                  <motion.button
                    key={optionIndex}
                    onClick={() => handleAnswerChange(
                      currentQuestion.id, 
                      optionIndex, 
                      currentQuestion.type === 'multiple'
                    )}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        currentQuestion.type === 'multiple' ? 'rounded-md' : ''
                      } ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 mr-3 font-medium">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {option}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            上一題
          </button>
          
          <div className="flex space-x-4">
            {currentQuestionIndex === exam.totalQuestions - 1 ? (
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 border border-transparent text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Flag className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? '提交中...' : '提交考試'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(exam.totalQuestions - 1, currentQuestionIndex + 1))}
                className="inline-flex items-center px-4 py-2 border border-transparent text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                下一題
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}