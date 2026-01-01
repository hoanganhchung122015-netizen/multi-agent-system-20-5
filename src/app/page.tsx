"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import confetti from "canvas-confetti";

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Hàm bóc tách JSON siêu mạnh
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
        body: JSON.stringify({ prompt: `Giải bài này môn ${subject}`, image: base64, subject }),
      });
      const data = await res.json();
      const parsed = extractJSON(data.text);
      if (parsed) setAiData(parsed);
      else throw new Error("Format error");
    } catch (e) {
      setAiData({ dap_an: "Lỗi", giai_thich: "AI không trả kết quả. Hãy chụp lại rõ nét hơn!", trac_nghiem: { cau_hoi: "", lua_chon: [], index_dung: 0 }, tu_luan: { cau_hoi: "", dap_an: "" } });
    }
    setLoading(false);
  };

  const handleCorrect = (idx: number) => {
    setUserChoice(idx);
    if (idx === aiData.trac_nghiem.index_dung) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Các hàm xử lý ảnh (giữ nguyên logic cơ bản)
  const onFileChange = (e: any, cam: boolean) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        if (cam) { setImage(reader.result as string); setShowCropper(true); }
        else setCroppedImage(reader.result as string);
      };
    }
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 p-0 m-0">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col min-h-screen relative overflow-hidden">
        
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
            }} className="m-6 bg-yellow-400 p-4 rounded-2xl font-black shadow-lg">XÁC NHẬN CẮT ẢNH</button>
          </div>
        )}

        {step === 1 && (
          <div className="p-6">
            <div className="bg-indigo-600 p-8 rounded-[40px] text-white mb-8 shadow-xl">
              <h1 className="text-3xl font-black italic">GIA SƯ AI 24/7</h1>
              <p className="opacity-70 text-sm">Chụp ảnh đề bài ngay!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => {setSubject("TOÁN"); setStep(2)}} className="h-40 bg-rose-500 text-white font-black rounded-[32px] shadow-lg">TOÁN</button>
              <button onClick={() => {setSubject("LÝ"); setStep(2)}} className="h-40 bg-blue-500 text-white font-black rounded-[32px] shadow-lg">LÝ</button>
              <button onClick={() => {setSubject("HÓA"); setStep(2)}} className="h-40 bg-emerald-500 text-white font-black rounded-[32px] shadow-lg">HÓA</button>
              <button onClick={() => {setSubject("NHẬT KÝ"); setStep(2)}} className="h-40 bg-amber-500 text-white font-black rounded-[32px] shadow-lg">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-4 uppercase text-xs">← Quay lại</button>
            <h2 className="text-3xl font-black mb-8">MÔN {subject}</h2>
            <div className="flex gap-4 mb-8">
              <button onClick={() => cameraInputRef.current?.click()} className="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-3xl">📸<input ref={cameraInputRef} type="file" capture="environment" className="hidden" onChange={e => onFileChange(e, true)} /></button>
              <label className="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-3xl text-center">📁<input type="file" className="hidden" onChange={e => onFileChange(e, false)} /></label>
            </div>
            {croppedImage && <img src={croppedImage} className="w-full rounded-3xl shadow-xl border-4 border-white mb-4" />}
            <button onClick={sendToAI} disabled={!croppedImage} className="mt-auto bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase shadow-xl disabled:bg-slate-200">Giải đề ngay 🚀</button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="p-4 flex justify-between items-center border-b">
              <button onClick={() => setStep(2)} className="text-indigo-600 font-bold uppercase text-xs">Thử lại</button>
              <span className="font-black text-slate-800">KẾT QUẢ AI</span>
              <div className="w-10"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-400 animate-pulse uppercase text-xs">Đang phân tích...</p>
              </div>
            ) : aiData && (
              <div className="flex flex-col flex-1">
                <div className="flex bg-slate-100 p-1 m-4 rounded-2xl">
                  {["ĐÁP ÁN", "GIẢI THÍCH", "LUYỆN TẬP"].map((t, i) => (
                    <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${activeTab === i+1 ? 'bg-white text-indigo-600 shadow' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <div className="flex-1 px-6 overflow-auto">
                  {activeTab === 1 && (
                    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-50">
                      <div className="text-5xl font-black text-indigo-600 bg-indigo-50 p-12 rounded-[40px] border-8 border-white shadow-2xl">{aiData.dap_an}</div>
                    </div>
                  )}
                  {activeTab === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5">
                      {aiData.giai_thich.split('\n').map((l: string, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 font-medium text-slate-700 text-sm">{l}</div>
                      ))}
                    </div>
                  )}
                  {activeTab === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-5">
                      <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl">
                        <p className="font-bold mb-4">{aiData.trac_nghiem.cau_hoi}</p>
                        <div className="space-y-2">
                          {aiData.trac_nghiem.lua_chon.map((o: string, i: number) => (
                            <button key={i} onClick={() => handleCorrect(i)} className={`w-full text-left p-4 rounded-2xl font-bold text-xs ${userChoice === i ? (i === aiData.trac_nghiem.index_dung ? 'bg-emerald-400 border-2' : 'bg-rose-400') : 'bg-white/10'}`}>{o}</button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-amber-100 p-6 rounded-[32px] mb-8">
                        <p className="font-bold text-sm mb-4">Tự luận: {aiData.tu_luan.cau_hoi}</p>
                        {showEssayAns ? <p className="p-4 bg-white rounded-2xl text-xs font-black text-amber-600 border-2 border-amber-200 uppercase">{aiData.tu_luan.dap_an}</p> : <button onClick={() => setShowEssayAns(true)} className="w-full bg-amber-500 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg">Xem đáp án</button>}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setStep(1)} className="m-6 bg-slate-900 text-white p-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Hoàn thành bài học</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
