import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, image, subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Lỗi: Chưa cấu hình API Key trên Vercel!" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Cấu trúc contents để gửi cả Text và Ảnh (nếu có)
    const parts: any[] = [{ text: `${prompt} môn ${subject}` }];
    
    // Nếu có ảnh (định dạng base64), thêm vào phần gửi đi
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
        contents: [{ parts: parts }]
      }),
    });

    const data = await response.json();

    // Kiểm tra an toàn xem dữ liệu trả về có đúng cấu trúc không
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const result = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ text: result });
    } else {
      console.error("Gemini Error Details:", data);
      return NextResponse.json({ text: "AI không trả về kết quả hợp lệ. Có thể ảnh quá mờ hoặc vi phạm chính sách." });
    }

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ text: 'Lỗi hệ thống khi gọi Gemini' }, { status: 500 });
  }
}
