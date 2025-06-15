'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Users, Clock, BookOpen } from 'lucide-react';
import { databases, DATABASE_ID, EXAMS_COLLECTION_ID, LEADERBOARD_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Exam, LeaderboardEntry } from '@/types';
import { formatDate } from '@/lib/utils';

export default function LeaderboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchLeaderboard(selectedExam);
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        [
          Query.equal('isPublic', true),
          Query.orderDesc('$createdAt')
        ]
      );
      const examList = response.documents as Exam[];
      setExams(examList);
      if (examList.length > 0) {
        setSelectedExam(examList[0].$id);
      }
    } catch (error) {
      console.error('獲取考試列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (examId: string) => {
    setLeaderboardLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        LEADERBOARD_COLLECTION_ID,
        [
          Query.equal('examId', examId),
          Query.orderDesc('score'),
          Query.orderAsc('timeSpent'),
          Query.limit(50)
        ]
      );
      const entries = response.documents as LeaderboardEntry[];
      // 添加排名
      const rankedEntries = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      setLeaderboard(rankedEntries);
    } catch (error) {
      console.error('獲取排行榜失敗:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 排行榜
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            查看各個考試的最佳成績排名
          </p>
        </motion.div>

        {exams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              暫無公開考試
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              目前還沒有任何公開的考試，請稍後再來查看。
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              返回首頁
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Exam Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                選擇考試
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <button
                    key={exam.$id}
                    onClick={() => setSelectedExam(exam.$id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedExam === exam.$id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {exam.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {exam.totalQuestions} 題
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {exam.creatorName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Leaderboard */}
            {selectedExam && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {exams.find(e => e.$id === selectedExam)?.title} - 排行榜
                  </h2>
                </div>

                {leaderboardLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">載入中...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-8 text-center">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      暫無成績記錄
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      還沒有人完成這個考試，成為第一個挑戰者吧！
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.$id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          entry.rank <= 3 ? getRankBadgeColor(entry.rank) + ' text-white' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${
                                entry.rank <= 3 ? 'text-white' : 'text-gray-900 dark:text-white'
                              }`}>
                                {entry.userName}
                              </h3>
                              <p className={`text-sm ${
                                entry.rank <= 3 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                完成時間：{formatDate(entry.completedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              entry.rank <= 3 ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {entry.score}分
                            </div>
                            <div className={`text-sm flex items-center ${
                              entry.rank <= 3 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Clock className="mr-1 h-3 w-3" />
                              {Math.floor(entry.timeSpent / 60)}:{(entry.timeSpent % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}