"use client";
import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";

export default function StudyApp() {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [showEssayAns, setShowEssayAns] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Hàm bóc tách JSON an toàn
  const extractJSON = (text: string) => {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      return JSON.parse(text.substring(start, end + 1));
    } catch (e) { return null; }
  };

  const sendToAI = async () => {
    setLoading(true); setStep(3); setActiveTab(1); setUserChoice(null); setShowEssayAns(false);
    try {
      const base64 = croppedImage ? croppedImage.split(",")[1] : null;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Giải bài tập môn ${subject}`, image: base64, subject }),
      });
      const data = await res.json();
      const parsed = extractJSON(data.text);
      if (parsed) setAiData(parsed);
      else throw new Error("Format error");
    } catch (e) {
      setAiData({ dap_an: "⚠️ Thử lại", giai_thich: "AI không phân tích được ảnh. Hãy chụp gần và rõ nét hơn!", trac_nghiem: { cau_hoi: "", lua_chon: [], index_dung: 0 }, tu_luan: { cau_hoi: "", dap_an: "" } });
    }
    setLoading(false);
  };

  const handleChoice = (idx: number) => {
    setUserChoice(idx);
    if (idx === aiData.trac_nghiem.index_dung) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const onFileChange = (e: any, isCam: boolean) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        if (isCam) { setImage(reader.result as string); setShowCropper(true); }
        else setCroppedImage(reader.result as string);
      };
    }
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col min-h-screen relative overflow-hidden">
        
        {/* HIỆU ỨNG PHÁO HOA CSS THUẦN */}
        {showCelebration && (
          <div className="absolute inset-0 z-[110] pointer-events-none flex items-center justify-center">
             <div className="text-6xl animate-bounce">🎉✨🎊</div>
             <style jsx>{`
               @keyframes celebrate {
                 0% { transform: scale(0); opacity: 0; }
                 50% { opacity: 1; }
                 100% { transform: scale(2); opacity: 0; }
               }
             `}</style>
          </div>
        )}

        {/* MODAL CROP */}
        {showCropper && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="relative flex-1"><Cropper image={image!} crop={crop} zoom={zoom} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} /></div>
            <button onClick={async () => {
              const canvas = document.createElement("canvas");
              const img = new Image(); img.src = image!;
              await new Promise(r => img.onload = r);
              const { width, height, x, y } = croppedAreaPixels as any;
              canvas.width = width; canvas.height = height;
              canvas.getContext("2d")?.drawImage(img, x, y, width, height, 0, 0, width, height);
              setCroppedImage(canvas.toDataURL("image/jpeg")); setShowCropper(false);
            }} className="m-6 bg-yellow-400 p-5 rounded-3xl font-black text-black shadow-lg uppercase">Cắt ảnh này</button>
          </div>
        )}

        {/* TRANG CHỦ */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-indigo-600 p-10 rounded-[45px] text-white mb-10 shadow-2xl text-center">
              <h1 className="text-3xl font-black italic">GIA SƯ AI 24/7</h1>
              <p className="opacity-70 text-sm mt-2 font-bold uppercase tracking-widest">Học tập thông minh</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <button onClick={() => {setSubject("TOÁN"); setStep(2)}} className="h-44 bg-rose-500 text-white font-black rounded-[40px] text-2xl shadow-xl active:scale-95 transition-all">TOÁN</button>
              <button onClick={() => {setSubject("LÝ"); setStep(2)}} className="h-44 bg-blue-500 text-white font-black rounded-[40px] text-2xl shadow-xl active:scale-95 transition-all">LÝ</button>
              <button onClick={() => {setSubject("HÓA"); setStep(2)}} className="h-44 bg-emerald-500 text-white font-black rounded-[40px] text-2xl shadow-xl active:scale-95 transition-all">HÓA</button>
              <button onClick={() => {setSubject("NHẬT KÝ"); setStep(2)}} className="h-44 bg-amber-500 text-white font-black rounded-[40px] text-2xl shadow-xl active:scale-95 transition-all">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {/* NHẬP ĐỀ */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-6 text-xs uppercase tracking-tighter">← Quay về</button>
            <h2 className="text-4xl font-black mb-10 text-slate-800 uppercase tracking-tighter">Môn {subject}</h2>
            <div className="flex gap-4 mb-8">
              <button onClick={() => cameraInputRef.current?.click()} className="flex-1 p-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[35px] text-4xl shadow-inner active:bg-indigo-50">📸<input ref={cameraInputRef} type="file" capture="environment" className="hidden" onChange={e => onFileChange(e, true)} /></button>
              <label className="flex-1 p-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[35px] text-4xl text-center shadow-inner cursor-pointer active:bg-indigo-50">📁<input type="file" className="hidden" onChange={e => onFileChange(e, false)} /></label>
            </div>
            {croppedImage && <img src={croppedImage} className="w-full rounded-[35px] shadow-2xl border-8 border-white mb-6" />}
            <button onClick={sendToAI} disabled={!croppedImage} className="mt-auto bg-indigo-600 text-white py-6 rounded-[35px] font-black uppercase text-lg shadow-2xl disabled:bg-slate-200">Giải đề ngay 🚀</button>
          </div>
        )}

        {/* KẾT QUẢ */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="p-5 flex justify-between items-center border-b">
              <button onClick={() => setStep(2)} className="text-indigo-600 font-bold text-xs uppercase">Thử lại</button>
              <span className="font-black text-slate-700 tracking-tighter">PHẢN HỒI AI</span>
              <div className="w-10"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Đang tính toán...</p>
              </div>
            ) : aiData && (
              <div className="flex flex-col flex-1">
                <div className="flex bg-slate-100 p-1.5 m-5 rounded-2xl shadow-inner">
                  {["ĐÁP ÁN", "GIẢI THÍCH", "LUYỆN TẬP"].map((t, i) => (
                    <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === i+1 ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>

                <div className="flex-1 px-6 overflow-auto pb-10">
                  {activeTab === 1 && (
                    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-75">
                      <div className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Kết quả đúng</div>
                      <div className="text-5xl font-black text-indigo-600 bg-indigo-50 p-14 rounded-[50px] border-8 border-white shadow-2xl text-center min-w-[200px]">{aiData.dap_an}</div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-4 animate-in fade-in">
                      {aiData.giai_thich.split('\n').map((l: string, i: number) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-3xl border-l-8 border-indigo-500 font-bold text-slate-700 text-sm shadow-sm">{l}</div>
                      ))}
                    </div>
                  )}

                  {activeTab === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-10">
                      <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl">
                        <p className="font-black mb-6 text-lg">📝 {aiData.trac_nghiem.cau_hoi}</p>
                        <div className="space-y-3">
                          {aiData.trac_nghiem.lua_chon.map((o: string, i: number) => (
                            <button key={i} onClick={() => handleChoice(i)} className={`w-full text-left p-4 rounded-2xl font-black text-xs transition-all ${userChoice === i ? (i === aiData.trac_nghiem.index_dung ? 'bg-emerald-400 border-2' : 'bg-rose-400') : 'bg-white/10 border border-white/5'}`}>{o}</button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-amber-100 p-8 rounded-[40px] border-2 border-amber-200">
                        <p className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">✍️ Tự luận</p>
                        <p className="font-bold text-slate-600 mb-6 italic">"{aiData.tu_luan.cau_hoi}"</p>
                        {showEssayAns ? <p className="p-5 bg-white rounded-3xl text-sm font-black text-amber-600 border-4 border-amber-200 text-center uppercase animate-in fade-in">{aiData.tu_luan.dap_an}</p> : <button onClick={() => setShowEssayAns(true)} className="w-full bg-amber-500 text-white p-5 rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95">Xem gợi ý giải</button>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 bg-white border-t mt-auto">
                  <button onClick={() => setStep(1)} className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Hoàn thành bài học</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
