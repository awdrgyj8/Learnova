import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { content, questionCount = 5, difficulty = 'medium' } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '請提供試卷內容' },
        { status: 400 }
      );
    }

    // 獲取 Gemini 模型
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 構建提示詞
    const prompt = `
根據以下內容生成 ${questionCount} 道${difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難'}難度的選擇題。

內容：
${content}

請按照以下 JSON 格式返回題目，每題包含：
- question: 題目內容
- type: "single" 或 "multiple" (單選或多選)
- options: 選項陣列 (4個選項)
- correctAnswers: 正確答案的索引陣列 (從0開始)

要求：
1. 題目要基於提供的內容
2. 選項要有合理的干擾項
3. 單選題只有一個正確答案，多選題可以有多個
4. 題目難度要符合要求
5. 只返回 JSON 格式，不要其他文字

格式範例：
{
  "questions": [
    {
      "question": "題目內容",
      "type": "single",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "correctAnswers": [0]
    }
  ]
}
`;

    // 生成內容
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析 JSON 回應
    let parsedResponse;
    try {
      // 清理回應文字，移除可能的 markdown 格式
      const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON 解析錯誤:', parseError);
      console.error('原始回應:', text);
      return NextResponse.json(
        { error: 'AI 回應格式錯誤，請重試' },
        { status: 500 }
      );
    }

    // 驗證回應格式
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      return NextResponse.json(
        { error: 'AI 回應格式不正確' },
        { status: 500 }
      );
    }

    // 驗證每個題目的格式
    const validatedQuestions = parsedResponse.questions.map((q: any, index: number) => {
      if (!q.question || !q.type || !q.options || !q.correctAnswers) {
        throw new Error(`題目 ${index + 1} 格式不完整`);
      }

      if (!['single', 'multiple'].includes(q.type)) {
        throw new Error(`題目 ${index + 1} 類型無效`);
      }

      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`題目 ${index + 1} 選項不足`);
      }

      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
        throw new Error(`題目 ${index + 1} 缺少正確答案`);
      }

      // 驗證正確答案索引
      for (const answerIndex of q.correctAnswers) {
        if (answerIndex < 0 || answerIndex >= q.options.length) {
          throw new Error(`題目 ${index + 1} 正確答案索引無效`);
        }
      }

      return {
        question: q.question.trim(),
        type: q.type,
        options: q.options.map((opt: string) => opt.trim()),
        correctAnswers: q.correctAnswers.map((ans: string) => ans.toString())
      };
    });

    return NextResponse.json({
      success: true,
      questions: validatedQuestions
    });

  } catch (error) {
    console.error('生成題目錯誤:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '生成題目時發生錯誤，請重試' 
      },
      { status: 500 }
    );
  }
}