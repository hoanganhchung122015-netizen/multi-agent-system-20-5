"use client";
import { useState, useEffect, useRef } from "react";

export default function StudyApp() {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [showEssayAns, setShowEssayAns] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gửi thẳng ảnh cho AI sau khi chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const base64 = reader.result as string;
        setImage(base64);
        sendToAI(base64);
      };
    }
  };

  const sendToAI = async (imgBase64: string) => {
    setLoading(true);
    setStep(3);
    setActiveTab(1);
    setUserChoice(null);
    setShowEssayAns(false);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Giải bài tập môn ${subject}`,
          image: imgBase64.split(",")[1]
        }),
      });
      const data = await res.json();
      setAiData(JSON.parse(data.text));
    } catch (e) {
      setAiData({ dap_an: "Lỗi", giai_thich: "Không thể giải bài này, hãy thử lại.", trac_nghiem: null, tu_luan: null });
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col overflow-hidden">
        
        {/* BƯỚC 1: CHỌN MÔN (MÀU SẮC NHƯ CŨ) */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-8 shadow-xl text-center">
              <h1 className="text-3xl font-black italic">HỆ THỐNG GIA SƯ AI</h1>
              <p className="opacity-80 text-sm">Chụp ảnh - Có ngay lời giải</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => {setSubject("TOÁN"); setStep(2)}} className="h-40 bg-rose-500 text-white font-black rounded-3xl text-xl shadow-lg active:scale-95 transition-all">TOÁN</button>
              <button onClick={() => {setSubject("LÝ"); setStep(2)}} className="h-40 bg-blue-500 text-white font-black rounded-3xl text-xl shadow-lg active:scale-95 transition-all">LÝ</button>
              <button onClick={() => {setSubject("HÓA"); setStep(2)}} className="h-40 bg-emerald-500 text-white font-black rounded-3xl text-xl shadow-lg active:scale-95 transition-all">HÓA</button>
              <button onClick={() => {setSubject("NHẬT KÝ"); setStep(2)}} className="h-40 bg-amber-500 text-white font-black rounded-3xl text-xl shadow-lg active:scale-95 transition-all">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỤP ẢNH */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1 items-center justify-center text-center">
            <button onClick={() => setStep(1)} className="absolute top-6 left-6 font-bold text-slate-400">← QUAY LẠI</button>
            <h2 className="text-2xl font-black mb-10 text-slate-800">MÔN {subject}</h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-48 h-48 bg-indigo-50 border-4 border-dashed border-indigo-200 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100 transition-all shadow-inner"
            >
              <span className="text-5xl mb-2">📸</span>
              <span className="font-bold text-indigo-600 text-sm uppercase">Bấm để chụp đề</span>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="mt-8 text-slate-400 text-sm italic font-medium">Chỉ cần chụp rõ nét, AI sẽ tự lo phần còn lại!</p>
          </div>
        )}

        {/* BƯỚC 3: KẾT QUẢ 3 TAB */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
              <button onClick={() => setStep(2)} className="text-indigo-600 font-bold uppercase text-xs">Chụp lại</button>
              <span className="font-black text-slate-700">LỜI GIẢI AI</span>
              <div className="w-10"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-400 animate-pulse">ĐANG PHÂN TÍCH ẢNH...</p>
              </div>
            ) : aiData && (
              <>
                <div className="flex bg-slate-100 p-1 m-4 rounded-2xl">
                  {["ĐÁP ÁN", "GIẢI THÍCH", "LUYỆN TẬP"].map((label, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveTab(idx + 1)}
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === idx + 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 px-6 overflow-y-auto">
                  {activeTab === 1 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Kết quả đúng là:</span>
                      <div className="text-5xl font-black text-indigo-600 bg-indigo-50 p-10 rounded-full border-8 border-white shadow-xl animate-bounce">
                        {aiData.dap_an}
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-4">
                      {aiData.giai_thich.split('\n').map((step: string, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 font-medium text-slate-700 text-sm">
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 3 && (
                    <div className="space-y-6 pb-10">
                      {aiData.trac_nghiem && (
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg">
                          <p className="font-bold mb-4">Câu hỏi: {aiData.trac_nghiem.cau_hoi}</p>
                          <div className="space-y-2">
                            {aiData.trac_nghiem.lua_chon.map((opt: string, i: number) => (
                              <button 
                                key={i} 
                                onClick={() => setUserChoice(i)}
                                className={`w-full text-left p-4 rounded-2xl font-bold text-xs transition-all ${userChoice === i ? (i === aiData.trac_nghiem.index_dung ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-white/10'}`}
                              >
                                {userChoice === i && (i === aiData.trac_nghiem.index_dung ? "✅ " : "❌ ")} {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiData.tu_luan && (
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6">
                          <p className="font-bold text-slate-800 mb-4 text-sm">Tự luận: {aiData.tu_luan.cau_hoi}</p>
                          {showEssayAns ? (
                            <div className="p-4 bg-white rounded-xl text-amber-600 font-black text-center border-2 border-amber-200 uppercase text-xs">{aiData.tu_luan.dap_an}</div>
                          ) : (
                            <button onClick={() => setShowEssayAns(true)} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase shadow-md">Xem đáp án</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t">
                  <button onClick={() => setStep(1)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Xong bài học</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
