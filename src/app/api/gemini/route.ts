import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, image, subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ text: "Thiếu API Key" }, { status: 500 });

    // Sử dụng v1beta với model gemini-1.5-flash-latest
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: `Môn học: ${subject}. Yêu cầu: ${prompt}` }];
    
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // Tắt bớt bộ lọc để tránh lỗi "vi phạm chính sách" nhầm lẫn
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Chi tiết lỗi từ Google:", data.error);
      return NextResponse.json({ text: `Lỗi Google: ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({ text: data.candidates[0].content.parts[0].text });
    }

    return NextResponse.json({ text: "AI không thể đọc được đề bài, hãy thử chụp rõ nét hơn." });

  } catch (error) {
    return NextResponse.json({ text: 'Lỗi máy chủ.' }, { status: 500 });
  }
}
