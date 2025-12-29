import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY; // Lấy từ Environment Variables đã cài trên Vercel

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ text: result });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi gọi API Gemini' }, { status: 500 });
  }
}
