import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; // Lấy từ biến môi trường trên Vercel
    
    if (!apiKey) return NextResponse.json({ text: "Lỗi: Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sử dụng model 1.5 Flash để đảm bảo tính ổn định khi trả về JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Ép AI trả về JSON
    });

    const instruction = `
      Bạn là một chuyên gia giáo dục. Hãy giải bài tập được cung cấp.
      Trả về kết quả duy nhất dưới dạng JSON theo cấu trúc sau:
      {
        "dap_an": "Chỉ ghi đáp án cuối cùng cực ngắn gọn",
        "giai_thich": "Các bước giải chi tiết, mỗi bước trình bày trên 1 dòng riêng biệt",
        "trac_nghiem": {
          "cau_hoi": "Tạo 1 câu hỏi trắc nghiệm tương tự bài tập trên",
          "lua_chon": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "index_dung": 0
        },
        "tu_luan": {
          "cau_hoi": "Tạo 1 câu hỏi tự luận tương tự",
          "dap_an": "Đáp án ngắn gọn của câu tự luận này"
        }
      }
      Lưu ý: Không viết bất kỳ lời dẫn nào ngoài mã JSON.
    `;

    const parts: any[] = [{ text: `${instruction}\n\nĐề bài: ${prompt}` }];
    
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
    return NextResponse.json({ text: "AI đang bận, bạn thử lại sau nhé!" }, { status: 500 });
  }
}
