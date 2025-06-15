'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Users, Clock, ArrowRight, Star } from 'lucide-react';
import { databases, DATABASE_ID, EXAMS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Exam } from '@/types';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicExams();
  }, []);

  const fetchPublicExams = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        [
          Query.equal('isPublic', true),
          Query.orderDesc('$createdAt'),
          Query.limit(6)
        ]
      );
      setExams(response.documents as Exam[]);
    } catch (error) {
      console.error('獲取考試列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: '創建考試',
      description: '輕鬆創建單選和多選題目，自定義考試內容',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: '拖拽排序',
      description: '直觀的拖拽介面，自由調整題目順序',
      color: 'bg-green-500'
    },
    {
      icon: Trophy,
      title: '排行榜',
      description: '即時排行榜系統，激發學習競爭力',
      color: 'bg-yellow-500'
    },
    {
      icon: Clock,
      title: '計時考試',
      description: '支援時間限制，模擬真實考試環境',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
            >
              智慧學習
              <span className="text-blue-600 dark:text-blue-400"> 考試平台</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300"
            >
              創建、管理和參與線上考試，提升學習效率與競爭力
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                開始使用
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                查看排行榜 <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              平台特色
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-lg text-gray-600 dark:text-gray-300"
            >
              強大的功能，簡潔的介面，為您提供最佳的考試體驗
            </motion.p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className={`inline-flex rounded-lg ${feature.color} p-3 text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Exams Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              熱門考試
            </motion.h2>
            <Link
              href="/leaderboard"
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-48"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam, index) => (
                <motion.div
                  key={exam.$id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative rounded-lg bg-gray-50 dark:bg-gray-700 p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {exam.description}
                      </p>
                      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
                        <span className="flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {exam.creatorName}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(exam.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400" />
                    </div>
                  </div>
                  
                  <Link
                    href={`/exam/${exam.$id}`}
                    className="absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">查看考試 {exam.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          
          {!loading && exams.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-center py-12"
            >
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                暫無公開考試
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                成為第一個創建考試的用戶吧！
              </p>
              <Link
                href="/register"
                className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                立即註冊
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
