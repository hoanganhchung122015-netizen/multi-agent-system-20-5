import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();
    
    // 1. Lấy Key từ biến môi trường (như ảnh hướng dẫn)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ text: "Lỗi: Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Sử dụng model Gemini 2.5 Flash (theo ảnh bạn gửi)
    // Nếu vẫn lỗi 404, bạn hãy thử đổi thành "gemini-1.5-flash" hoặc "gemini-3-flash"
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    console.error("Lỗi API:", error);
    return NextResponse.json({ text: "AI đang bận, bạn thử lại sau nhé!" });
  }
}
