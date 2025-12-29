import { GoogleGenerativeAI } from "@google/generativeai";



export async function POST(req: Request) {
  const { prompt, image, subject } = await req.json();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");    
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `Bạn là chuyên gia ${subject}. Giải bài theo 3 chế độ: 1. Đáp án+CASIO, 2. Gia sư AI ngắn gọn, 3. Luyện Skill (2 câu trắc nghiệm). Trả về văn bản sạch, dùng LaTeX cho công thức.`
  });

  const result = await model.generateContent(image ? [prompt, { inlineData: { data: image, mimeType: "image/jpeg" } }] : prompt);
  return Response.json({ text: result.response.text() });
}