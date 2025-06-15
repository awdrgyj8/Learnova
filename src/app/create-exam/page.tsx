'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, Eye, EyeOff, Sparkles, FileText } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, EXAMS_COLLECTION_ID, QUESTIONS_COLLECTION_ID, ID } from '@/lib/appwrite';
import { Question, CreateExamData } from '@/types';

interface QuestionFormData {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: string[];
  correctAnswers: number[];
}

interface SortableQuestionProps {
  question: QuestionFormData;
  index: number;
  onUpdate: (id: string, updates: Partial<QuestionFormData>) => void;
  onDelete: (id: string) => void;
}

function SortableQuestion({ question, index, onUpdate, onDelete }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addOption = () => {
    const newOptions = [...question.options, ''];
    onUpdate(question.id, { options: newOptions });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate(question.id, { options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length <= 2) return;
    
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    const newCorrectAnswers = question.correctAnswers
      .filter(answer => answer !== optionIndex)
      .map(answer => answer > optionIndex ? answer - 1 : answer);
    
    onUpdate(question.id, { 
      options: newOptions, 
      correctAnswers: newCorrectAnswers 
    });
  };

  const toggleCorrectAnswer = (optionIndex: number) => {
    let newCorrectAnswers: number[];
    
    if (question.type === 'single') {
      newCorrectAnswers = [optionIndex];
    } else {
      if (question.correctAnswers.includes(optionIndex)) {
        newCorrectAnswers = question.correctAnswers.filter(answer => answer !== optionIndex);
      } else {
        newCorrectAnswers = [...question.correctAnswers, optionIndex];
      }
    }
    
    onUpdate(question.id, { correctAnswers: newCorrectAnswers });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            題目 {index + 1}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate(question.id, { 
              type: e.target.value as 'single' | 'multiple',
              correctAnswers: [] // 重置正確答案
            })}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="single">單選題</option>
            <option value="multiple">多選題</option>
          </select>
          <button
            onClick={() => onDelete(question.id)}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          題目內容
        </label>
        <textarea
          value={question.question}
          onChange={(e) => onUpdate(question.id, { question: e.target.value })}
          placeholder="請輸入題目內容..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          選項 ({question.type === 'single' ? '單選' : '多選'})
        </label>
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => toggleCorrectAnswer(optionIndex)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  question.correctAnswers.includes(optionIndex)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                }`}
                title={question.correctAnswers.includes(optionIndex) ? '正確答案' : '點擊設為正確答案'}
              >
                {question.correctAnswers.includes(optionIndex) && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(optionIndex, e.target.value)}
                placeholder={`選項 ${String.fromCharCode(65 + optionIndex)}`}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {question.options.length > 2 && (
                <button
                  onClick={() => removeOption(optionIndex)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          + 添加選項
        </button>
      </div>
    </div>
  );
}

export default function CreateExamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    timeLimit: '',
    isPublic: true,
  });
  
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [aiContent, setAiContent] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      id: `question-${Date.now()}`,
      question: '',
      type: 'single',
      options: ['', ''],
      correctAnswers: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionFormData>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const generateQuestionsWithAI = async () => {
    if (!aiContent.trim()) {
      alert('請輸入要生成題目的內容');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: aiContent,
          questionCount: aiQuestionCount,
          difficulty: 'medium'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成題目失敗');
      }

      if (data.success && data.questions) {
        const newQuestions: QuestionFormData[] = data.questions.map((q: any, index: number) => ({
          id: `ai-question-${Date.now()}-${index}`,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers.map((ans: string) => parseInt(ans))
        }));

        setQuestions([...questions, ...newQuestions]);
        setAiContent('');
        setAiQuestionCount(5);
        setShowAiGenerator(false);
        alert(`成功生成 ${newQuestions.length} 道題目！`);
      }
    } catch (error) {
      console.error('AI 生成題目錯誤:', error);
      alert(error instanceof Error ? error.message : '生成題目時發生錯誤，請重試');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const validateForm = () => {
    if (!examData.title.trim()) {
      alert('請輸入考試標題');
      return false;
    }
    
    if (!examData.description.trim()) {
      alert('請輸入考試描述');
      return false;
    }
    
    if (questions.length === 0) {
      alert('請至少添加一個題目');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question.trim()) {
        alert(`題目 ${i + 1} 的內容不能為空`);
        return false;
      }
      
      if (question.options.some(option => !option.trim())) {
        alert(`題目 ${i + 1} 的選項不能為空`);
        return false;
      }
      
      if (question.correctAnswers.length === 0) {
        alert(`題目 ${i + 1} 必須設置正確答案`);
        return false;
      }
    }
    
    return true;
  };

  const saveExam = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      // 首先創建考試文檔（不包含questions字段）
      const createExamData = {
        title: examData.title,
        description: examData.description,
        timeLimit: examData.timeLimit ? parseInt(examData.timeLimit) : 0,
        isPublic: examData.isPublic,
        creatorId: user.$id,
        creatorName: user.name,
        totalQuestions: questions.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const examResponse = await databases.createDocument(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        ID.unique(),
        createExamData
      );
      
      // 然後為每個問題創建單獨的文檔
      const questionPromises = questions.map((q, index) => {
        const questionData = {
          examId: examResponse.$id,
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswers: q.correctAnswers.map(String), // 轉換為字符串數組
          order: index,
          createdAt: new Date().toISOString(),
        };
        
        return databases.createDocument(
          DATABASE_ID,
          QUESTIONS_COLLECTION_ID,
          ID.unique(),
          questionData
        );
      });
      
      await Promise.all(questionPromises);
      
      router.push(`/exam/${examResponse.$id}`);
    } catch (error) {
      console.error('創建考試失敗:', error);
      alert('創建考試失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              創建新考試
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              設計您的考試內容，可以拖拽調整題目順序
            </p>
          </div>

          {/* Exam Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              基本信息
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  考試標題 *
                </label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                  placeholder="請輸入考試標題"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  時間限制（分鐘）
                </label>
                <input
                  type="number"
                  value={examData.timeLimit}
                  onChange={(e) => setExamData({ ...examData, timeLimit: e.target.value })}
                  placeholder="不限制時間請留空"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                考試描述 *
              </label>
              <textarea
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                placeholder="請輸入考試描述"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={examData.isPublic}
                onChange={(e) => setExamData({ ...examData, isPublic: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                公開考試（其他用戶可以看到並參與）
              </label>
            </div>
          </div>

          {/* AI Generator Section */}
          {showAiGenerator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI 智能生成題目
                </h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  輸入學習內容或教材文本
                </label>
                <textarea
                  value={aiContent}
                  onChange={(e) => setAiContent(e.target.value)}
                  placeholder="請輸入您想要生成題目的內容，例如：課程講義、教材章節、知識點等...\n\n範例：\n- 數學：二次方程式的解法\n- 歷史：第二次世界大戰的起因\n- 科學：光合作用的過程"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  生成題目數量
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    道題目 (建議 1-50 題)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="inline h-4 w-4 mr-1" />
                  AI 將根據您的內容自動生成 {aiQuestionCount} 道選擇題
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAiGenerator(false)}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={generateQuestionsWithAI}
                    disabled={aiLoading || !aiContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {aiLoading ? '生成中...' : '生成題目'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Questions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                題目設計 ({questions.length})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAiGenerator(!showAiGenerator)}
                  className="inline-flex items-center px-3 py-2 border border-purple-300 dark:border-purple-600 shadow-sm text-sm font-medium rounded-md text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 生成
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showPreview ? '隱藏預覽' : '預覽模式'}
                </button>
                <button
                  onClick={addQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  手動添加
                </button>
              </div>
            </div>
            
            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Plus className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  還沒有添加任何題目
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  您可以手動添加題目，或使用 AI 智能生成
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowAiGenerator(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 生成題目
                  </button>
                  <button
                    onClick={addQuestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    手動添加題目
                  </button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      onUpdate={updateQuestion}
                      onDelete={deleteQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={saveExam}
              disabled={loading || questions.length === 0}
              className="inline-flex items-center px-6 py-2 border border-transparent text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? '創建中...' : '創建考試'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}