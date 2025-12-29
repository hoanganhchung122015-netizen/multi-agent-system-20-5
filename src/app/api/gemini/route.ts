import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image, subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Lỗi: Thiếu API Key trên Vercel!" }, { status: 500 });
    }

    // Khởi tạo SDK chính chủ của Google
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Thử dùng model gemini-1.5-flash (SDK sẽ tự tìm đường dẫn v1 hoặc v1beta cho bạn)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ]
    });

    const parts: any[] = [{ text: `Môn học: ${subject}. Yêu cầu: ${prompt}` }];
    
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Lỗi chi tiết:", error);
    // Nếu vẫn lỗi 404, có thể model này chưa được cấp phép cho Key của bạn
    return NextResponse.json({ 
      text: `Lỗi: ${error.message || "AI không phản hồi"}. Hãy kiểm tra xem bạn đã bật Gemini API trong Google Cloud Console chưa.` 
    }, { status: 500 });
  }
}
