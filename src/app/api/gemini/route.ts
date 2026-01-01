import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image, subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return NextResponse.json({ text: "Lỗi: Chưa cấu hình API Key" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    // Sử dụng model 1.5-flash để ổn định nhất cho JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const instruction = `
      Bạn là một chuyên gia giáo dục giải bài tập môn ${subject}.
      Hãy phân tích ảnh/văn bản và trả về DUY NHẤT mã JSON theo cấu trúc sau:
      {
        "dap_an": "Kết quả cuối cùng cực ngắn gọn",
        "giai_thich": "Các bước giải chi tiết, xuống dòng bằng dấu \\n",
        "trac_nghiem": {
          "cau_hoi": "Tạo 1 câu hỏi trắc nghiệm tương tự",
          "lua_chon": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "index_dung": 0
        },
        "tu_luan": {
          "cau_hoi": "Tạo 1 câu hỏi tự luận mở rộng",
          "dap_an": "Gợi ý đáp án ngắn"
        }
      }
      Lưu ý: Không viết thêm bất kỳ chữ nào ngoài mã JSON.`;

    const parts: any[] = [{ text: `${instruction}\n\nĐề bài: ${prompt}` }];
    if (image) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: image } });
    }

    const result = await model.generateContent(parts);
    return NextResponse.json({ text: result.response.text() });

  } catch (error) {
    return NextResponse.json({ text: "Lỗi kết nối AI" }, { status: 500 });
  }
}
