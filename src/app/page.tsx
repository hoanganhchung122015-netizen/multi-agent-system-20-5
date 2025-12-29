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
      reader.onloadend = () => setImage((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    }
  };

  // 2. Gửi dữ liệu tới API Backend
  const handleSolve = async () => {
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        body: JSON.stringify({ subject, image, prompt: "Giải đề bài này" }),
      });
      const data = await res.json();
      setResponse(data.text);
    } catch (error) {
      setResponse("Lỗi kết nối API. Hãy kiểm tra Key trên Vercel.");
    }
    setLoading(false);
  };

  // 3. Đọc văn bản (TTS)
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.lang = "vi-VN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 font-sans">
      {/* STEP 1: TRANG CHỦ */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-4 pt-20">
          {["TOÁN", "LÝ", "HÓA"].map((s) => (
            <button key={s} onClick={() => { setSubject(s); setStep(2); }}
              className="h-40 bg-white shadow-lg rounded-2xl text-2xl font-black text-slate-700 hover:bg-blue-50 transition-all border-b-4 border-slate-200">
              {s}
            </button>
          ))}
          <button className="h-40 bg-amber-400 shadow-lg rounded-2xl text-2xl font-black text-white border-b-4 border-amber-600">
            NHẬT KÝ
          </button>
        </div>
      )}

      {/* STEP 2: NHẬP LIỆU */}
      {step === 2 && (
        <div className="space-y-6">
          <button onClick={() => setStep(1)} className="text-slate-400 font-bold">← QUAY LẠI</button>
          <h1 className="text-3xl font-black text-slate-800 text-center uppercase">MÔN {subject}</h1>
          
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm cursor-pointer">
              <span className="text-2xl">📸</span><span className="text-[10px] mt-1 font-bold">CAMERA</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
            </label>
            <label className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm cursor-pointer">
              <span className="text-2xl">📁</span><span className="text-[10px] mt-1 font-bold">TẢI ẢNH</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm opacity-50">
              <span className="text-2xl">🎤</span><span className="text-[10px] mt-1 font-bold">MICRO</span>
            </div>
          </div>

          {image && <div className="text-center text-green-600 font-bold text-sm">✅ Đã nhận ảnh đề bài</div>}

          <button onClick={handleSolve} disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
            {loading ? "ĐANG GIẢI..." : "THỰC HIỆN"}
          </button>
        </div>
      )}

      {/* STEP 3: KẾT QUẢ */}
      {step === 3 && (
        <div className="space-y-4">
          <button onClick={() => setStep(2)} className="text-slate-400 font-bold">← LÀM CÂU KHÁC</button>
          
          <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
            {[1, 2, 3].map((i) => (
              <button key={i} onClick={() => setExpertView(i)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${expertView === i ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}>
                EXPERT {i}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl min-h-[300px] relative border border-slate-100">
            <button onClick={speak} className="absolute top-4 right-4 text-2xl">🔊</button>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
              {loading ? "AI đang suy nghĩ..." : response || "Chưa có dữ liệu."}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}