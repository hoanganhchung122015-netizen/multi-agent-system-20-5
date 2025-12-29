import "./globals.css";
"use client";

import { useState } from "react";

export default function StudyApp() {
  const [step, setStep] = useState(1); // 1: Home, 2: Input, 3: Result
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [expertView, setExpertView] = useState(1);
  const [image, setImage] = useState<string | null>(null);

  // 1. Xử lý Chụp ảnh/Tải ảnh
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Gửi dữ liệu tới API Backend
  const handleSolve = async () => {
    if (!image) {
      alert("Vui lòng chụp ảnh hoặc tải ảnh đề bài lên trước nhé!");
      return;
    }
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject, 
          image, 
          prompt: `Bạn là một chuyên gia môn ${subject}. Hãy giải chi tiết đề bài trong ảnh này.` 
        }),
      });
      const data = await res.json();
      setResponse(data.text || "AI không trả về nội dung. Hãy kiểm tra lại API Key.");
    } catch (error) {
      setResponse("Lỗi kết nối server. Hãy đảm bảo bạn đã cấu hình GEMINI_API_KEY trên Vercel.");
    }
    setLoading(false);
  };

  // 3. Đọc văn bản (TTS)
  const speak = () => {
    if (!response) return;
    window.speechSynthesis.cancel(); // Dừng các giọng đọc đang chạy
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = "vi-VN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 font-sans border-x border-slate-200 shadow-2xl">
      
      {/* STEP 1: TRANG CHỦ (MENU 4 MÀU) */}
      {step === 1 && (
        <div className="flex flex-col h-full pt-10">
          <h1 className="text-3xl font-black text-slate-800 text-center mb-10 leading-tight">
            NHẬT KÝ <br/> <span className="text-indigo-600">TOÁN LÝ HÓA</span>
          </h1>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "TOÁN", color: "bg-rose-500", shadow: "border-rose-700" },
              { name: "LÝ", color: "bg-blue-500", shadow: "border-blue-700" },
              { name: "HÓA", color: "bg-emerald-500", shadow: "border-emerald-700" },
            ].map((s) => (
              <button 
                key={s.name} 
                onClick={() => { setSubject(s.name); setStep(2); }}
                className={`h-40 ${s.color} shadow-lg rounded-3xl text-2xl font-black text-white transition-all border-b-8 ${s.shadow} active:border-b-0 active:translate-y-1`}
              >
                {s.name}
              </button>
            ))}
            <button className="h-40 bg-amber-400 shadow-lg rounded-3xl text-2xl font-black text-white border-b-8 border-amber-600 active:border-b-0 active:translate-y-1">
              NHẬT KÝ
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: NHẬP LIỆU */}
      {step === 2 && (
        <div className="flex flex-col space-y-6 pt-4">
          <button onClick={() => {setStep(1); setImage(null);}} className="text-slate-400 font-bold flex items-center gap-2 hover:text-slate-600">
            ← QUAY LẠI
          </button>
          <h1 className="text-3xl font-black text-slate-800 text-center uppercase tracking-widest">
            MÔN <span className="text-indigo-600">{subject}</span>
          </h1>
          
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-md cursor-pointer hover:bg-slate-50 border-2 border-transparent active:border-indigo-400 transition-all">
              <span className="text-3xl">📸</span>
              <span className="text-[10px] mt-2 font-black text-slate-500">CAMERA</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
            </label>
            
            <label className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-md cursor-pointer hover:bg-slate-50 border-2 border-transparent active:border-indigo-400 transition-all">
              <span className="text-3xl">📁</span>
              <span className="text-[10px] mt-2 font-black text-slate-500">TẢI ẢNH</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>

            <div className="flex flex-col items-center justify-center p-5 bg-slate-100 rounded-2xl opacity-50 cursor-not-allowed">
              <span className="text-3xl">🎤</span>
              <span className="text-[10px] mt-2 font-black text-slate-400">GIỌNG NÓI</span>
            </div>
          </div>

          {image && (
            <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center justify-center gap-2">
              <span className="text-emerald-600 text-xl">✅</span>
              <span className="text-emerald-700 font-bold text-sm">ĐÃ NHẬN ẢNH ĐỀ BÀI</span>
            </div>
          )}

          <button 
            onClick={handleSolve} 
            disabled={loading || !image}
            className={`w-full py-6 rounded-3xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
              !image ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 text-white active:scale-95 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ĐANG GIẢI...
              </>
            ) : "GIẢI BÀI NGAY"}
          </button>
        </div>
      )}

      {/* STEP 3: KẾT QUẢ */}
      {step === 3 && (
        <div className="flex flex-col space-y-4 pt-4 pb-10">
          <button onClick={() => {setStep(2); setResponse("");}} className="text-slate-400 font-bold flex items-center gap-2">
            ← LÀM CÂU KHÁC
          </button>
          
          <div className="flex bg-slate-200 p-1.5 rounded-2xl gap-1">
            {[1, 2, 3].map((i) => (
              <button key={i} onClick={() => setExpertView(i)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${expertView === i ? "bg-white shadow-md text-indigo-600" : "text-slate-500"}`}>
                EXPERT {i}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-2xl min-h-[400px] relative border border-slate-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <button 
              onClick={speak} 
              className="absolute top-6 right-6 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl hover:bg-indigo-100 active:scale-90 transition-all shadow-sm"
              title="Đọc kết quả"
            >
              🔊
            </button>
            
            <div className="mt-8 text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {loading ? (
                <div className="flex flex-col items-center justify-center pt-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-slate-400 animate-pulse">AI ĐANG SUY NGHĨ...</p>
                </div>
              ) : (
                response || "Đang đợi dữ liệu từ AI..."
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Phản hồi bởi Gemini AI. Kết quả chỉ mang tính chất tham khảo.
          </p>
        </div>
      )}
    </main>
  );
}

