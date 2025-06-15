'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Clock, Users, Trophy, Edit, Trash2, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, EXAMS_COLLECTION_ID, QUESTIONS_COLLECTION_ID, SUBMISSIONS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Exam, Submission, Question } from '@/types';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myExams, setMyExams] = useState<Exam[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions'>('exams');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionQuestions, setSubmissionQuestions] = useState<Question[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // 獲取我創建的考試
      const examsResponse = await databases.listDocuments(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        [
          Query.equal('creatorId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      );
      setMyExams(examsResponse.documents as Exam[]);

      // 獲取我的考試記錄
      const submissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('completedAt')
        ]
      );
      setMySubmissions(submissionsResponse.documents as Submission[]);
    } catch (error) {
      console.error('獲取數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('確定要刪除這個考試嗎？此操作無法撤銷。')) {
      return;
    }

    try {
      // 先删除考试相关的所有问题
      const questionsResponse = await databases.listDocuments(
        DATABASE_ID,
        QUESTIONS_COLLECTION_ID,
        [Query.equal('examId', examId)]
      );
      
      // 删除所有问题
      for (const question of questionsResponse.documents) {
        await databases.deleteDocument(DATABASE_ID, QUESTIONS_COLLECTION_ID, question.$id);
      }
      
      // 然后删除考试
      await databases.deleteDocument(DATABASE_ID, EXAMS_COLLECTION_ID, examId);
      setMyExams(prev => prev.filter(exam => exam.$id !== examId));
    } catch (error) {
      console.error('刪除考試失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  const viewSubmissionDetails = async (submission: Submission) => {
    setLoadingDetails(true);
    setSelectedSubmission(submission);
    setShowDetailModal(true);

    try {
      // 獲取考試的所有問題
      const questionsResponse = await databases.listDocuments(
        DATABASE_ID,
        QUESTIONS_COLLECTION_ID,
        [Query.equal('examId', submission.examId)]
      );
      setSubmissionQuestions(questionsResponse.documents as Question[]);
    } catch (error) {
      console.error('獲取問題詳情失敗:', error);
      alert('獲取詳情失敗，請稍後再試');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSubmission(null);
    setSubmissionQuestions([]);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            歡迎回來，{user.name}！
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            管理您的考試和查看考試記錄
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  我創建的考試
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {myExams.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  參與的考試
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mySubmissions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  平均分數
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mySubmissions.length > 0 
                    ? Math.round(mySubmissions.reduce((sum, sub) => sum + sub.score, 0) / mySubmissions.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('exams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'exams'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                我的考試
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                考試記錄
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {activeTab === 'exams' ? (
            <div>
              {/* Create Exam Button */}
              <div className="mb-6">
                <Link
                  href="/create-exam"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  創建新考試
                </Link>
              </div>

              {/* Exams List */}
              {myExams.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    還沒有創建任何考試
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    開始創建您的第一個考試吧！
                  </p>
                  <Link
                    href="/create-exam"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    創建考試
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myExams.map((exam, index) => (
                    <motion.div
                      key={exam.$id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {exam.title}
                        </h3>
                        <div className="flex space-x-2">
                          <Link
                            href={`/exam/${exam.$id}`}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="查看考試"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/edit-exam/${exam.$id}`}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            title="編輯考試"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteExam(exam.$id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="刪除考試"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {exam.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center">
                          <BookOpen className="mr-1 h-3 w-3" />
                          {exam.totalQuestions} 題
                        </span>
                        {exam.timeLimit && (
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {exam.timeLimit} 分鐘
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exam.isPublic 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {exam.isPublic ? '公開' : '私人'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        創建於 {formatDate(exam.createdAt)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Submissions List */}
              {mySubmissions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    還沒有參與任何考試
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    去首頁看看有什麼有趣的考試吧！
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                  >
                    瀏覽考試
                  </Link>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mySubmissions.map((submission, index) => (
                      <motion.div
                        key={submission.$id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              考試 ID: {submission.examId}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                用時：{Math.floor(submission.timeSpent / 60)}:{(submission.timeSpent % 60).toString().padStart(2, '0')}
                              </span>
                              <span>
                                完成時間：{formatDate(submission.completedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => viewSubmissionDetails(submission)}
                              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              查看詳情
                            </button>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                submission.score >= 80 ? 'text-green-600 dark:text-green-400' :
                                submission.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {submission.score}分
                              </div>
                              <div className={`text-sm ${
                                submission.score >= 80 ? 'text-green-600 dark:text-green-400' :
                                submission.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {submission.score >= 80 ? '優秀' :
                                 submission.score >= 60 ? '及格' : '不及格'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 詳情模態框 */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                考試詳情 - {selectedSubmission.examId}
              </h2>
              <button
                onClick={closeDetailModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 考試總結 */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedSubmission.score}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">總分</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(() => {
                            if (!selectedSubmission.answers) return 0;
                            const userAnswers = JSON.parse(selectedSubmission.answers);
                            return submissionQuestions.filter((q, index) => {
                              // 支持新舊格式：先嘗試使用索引，再嘗試使用完整ID
                              const userAnswer = userAnswers[index.toString()] || userAnswers[q.$id];
                              return userAnswer && userAnswer.length > 0 && userAnswer[0] === q.correctAnswer;
                            }).length;
                          })()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">答對題數</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {(() => {
                            if (!selectedSubmission.answers) return submissionQuestions.length;
                            const userAnswers = JSON.parse(selectedSubmission.answers);
                            return submissionQuestions.filter((q, index) => {
                              // 支持新舊格式：先嘗試使用索引，再嘗試使用完整ID
                              const userAnswer = userAnswers[index.toString()] || userAnswers[q.$id];
                              return !userAnswer || userAnswer.length === 0 || userAnswer[0] !== q.correctAnswer;
                            }).length;
                          })()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">答錯題數</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                          {Math.floor(selectedSubmission.timeSpent / 60)}:{(selectedSubmission.timeSpent % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">用時</div>
                      </div>
                    </div>
                  </div>

                  {/* 題目詳情 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      答題詳情
                    </h3>
                    {submissionQuestions.map((question, index) => {
                      const userAnswers = selectedSubmission.answers ? JSON.parse(selectedSubmission.answers) : {};
                      // 支持新舊格式：先嘗試使用索引，再嘗試使用完整ID
                      const userAnswer = userAnswers[index.toString()] || userAnswers[question.$id];
                      const isCorrect = userAnswer && userAnswer.length > 0 && userAnswer[0] === question.correctAnswer;
                      
                      return (
                        <div key={question.$id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                第 {index + 1} 題: {question.question}
                              </h4>
                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => {
                                  const isUserChoice = userAnswer && userAnswer.includes(optionIndex);
                                  const isCorrectOption = optionIndex === question.correctAnswer;
                                  
                                  return (
                                    <div key={optionIndex} className={`p-2 rounded border ${
                                      isCorrectOption ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                      isUserChoice ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                      'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                    }`}>
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-medium ${
                                          isCorrectOption ? 'text-green-700 dark:text-green-300' :
                                          isUserChoice ? 'text-red-700 dark:text-red-300' :
                                          'text-gray-700 dark:text-gray-300'
                                        }`}>
                                          {String.fromCharCode(65 + optionIndex)}.
                                        </span>
                                        <span className={`${
                                          isCorrectOption ? 'text-green-700 dark:text-green-300' :
                                          isUserChoice ? 'text-red-700 dark:text-red-300' :
                                          'text-gray-700 dark:text-gray-300'
                                        }`}>
                                          {option}
                                        </span>
                                        {isCorrectOption && (
                                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                            正確答案
                                          </span>
                                        )}
                                        {isUserChoice && !isCorrectOption && (
                                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                                            你的選擇
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}