import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image, subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ text: "Chưa cấu hình API Key" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Ép AI trả JSON
    });

    const instruction = `Bạn là chuyên gia giáo dục môn ${subject}. Giải bài tập và trả về JSON:
    {
      "dap_an": "Đáp số cuối cùng",
      "giai_thich": "Các bước giải ngắn gọn",
      "trac_nghiem": {"cau_hoi": "Câu hỏi tương tự", "lua_chon": ["A","B","C","D"], "index_dung": 0},
      "tu_luan": {"cau_hoi": "Câu hỏi mở rộng", "dap_an": "Gợi ý"}
    }`;

    const result = await model.generateContent([
      { text: instruction },
      { text: prompt },
      ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image } }] : [])
    ]);

    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    return NextResponse.json({ text: "Lỗi API" }, { status: 500 });
  }
}
