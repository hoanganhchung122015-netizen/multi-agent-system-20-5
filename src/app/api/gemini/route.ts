import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ text: "Lỗi: Thiếu Key trên Vercel" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
  
// Trong file route.ts
const model = genAI.getGenerativeModel({ 
  model: "Gemini 2.5 Flash" // Đổi thành gemini-3-flash để khớp với tài khoản của bạn
});
    
    const parts: any[] = [{ text: prompt }];
    
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ text: "AI đang bận hoặc ảnh chưa rõ. Bạn thử lại nhé!" });
  }
}



