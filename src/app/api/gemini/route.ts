import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ text: "Lỗi: Chưa cấu hình API Key" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const instruction = `
      Bạn là chuyên gia giáo dục. Hãy giải bài tập trong ảnh/văn bản.
      Trả về JSON duy nhất:
      {
        "dap_an": "Chỉ ghi đáp án cuối cùng cực ngắn",
        "giai_thich": "Các bước giải ngắn gọn, mỗi bước 1 dòng",
        "trac_nghiem": {
          "cau_hoi": "1 câu hỏi trắc nghiệm tương tự",
          "lua_chon": ["A...", "B...", "C...", "D..."],
          "index_dung": 0
        },
        "tu_luan": {
          "cau_hoi": "1 câu hỏi tự luận tương tự",
          "dap_an": "đáp án câu tự luận đó"
        }
      }`;

    const parts: any[] = [{ text: `${instruction}\n\nĐề bài: ${prompt}` }];
    if (image) parts.push({ inlineData: { mimeType: "image/jpeg", data: image } });

    const result = await model.generateContent(parts);
    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    return NextResponse.json({ text: "Lỗi kết nối AI" }, { status: 500 });
  }
}
