import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `Bạn là LearnHub AI - trợ thủ học tập thông minh của ứng dụng LearnHub.

Nhiệm vụ của bạn:
1. Giải đáp các câu hỏi về học tập, kiến thức
2. Hỗ trợ giải bài tập, giải thích khái niệm
3. Đưa ra lời khuyên về phương pháp học tập hiệu quả
4. Giúp lên kế hoạch học tập

Phong cách:
- Thân thiện, dễ hiểu, phù hợp với học sinh/sinh viên
- Sử dụng tiếng Việt
- Giải thích chi tiết khi cần
- Khuyến khích và động viên người học

Lưu ý: Không trả lời các câu hỏi không liên quan đến học tập hoặc có nội dung không phù hợp.`;

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory = [] } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'DeepSeek API key not configured' },
                { status: 500 }
            );
        }

        // Build messages array
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message },
        ];

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('DeepSeek API error:', error);
            return NextResponse.json(
                { error: 'Failed to get AI response' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const aiMessage = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';

        return NextResponse.json({
            success: true,
            message: aiMessage,
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
