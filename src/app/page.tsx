"use client";

import "./globals.css";
import { useState, useCallback, useEffect, useRef } from "react";
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
  
  // --- STATE CHO 3 TAB VÀ LUYỆN TẬP ---
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [showEssayAns, setShowEssayAns] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- HÀM GỬI ĐỀ VÀ XỬ LÝ DỮ LIỆU ---
  const sendToAI = async () => {
    setLoading(true);
    setStep(3);
    setActiveTab(1);
    setUserChoice(null);
    setShowEssayAns(false);
    
    try {
      const base64Data = croppedImage ? croppedImage.split(",")[1] : null;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: transcript || `Hãy giải bài tập ${subject} này.`,
          image: base64Data,
        }),
      });
      
      const result = await res.json();
      let cleanText = result.text;

      // Bộ lọc loại bỏ các ký hiệu thừa để tránh lỗi Parse
      if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
      }

      try {
        const parsed = JSON.parse(cleanText.trim());
        setAiData(parsed);
      } catch (e) {
        setAiData({
          dap_an: "Lỗi định dạng",
          giai_thich: "AI trả về dữ liệu không đúng cấu trúc. Hãy thử chụp lại rõ nét hơn.",
          trac_nghiem: { cau_hoi: "", lua_chon: [], index_dung: 0 },
          tu_luan: { cau_hoi: "", dap_an: "" }
        });
      }
    } catch (error) {
      alert("Lỗi kết nối API.");
    }
    setLoading(false);
  };

  // --- CÁC HÀM XỬ LÝ CAMERA/CROP (GIỮ NGUYÊN) ---
  const startCameraWithTimer = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCountdown(10))
      .catch(() => alert("Vui lòng cho phép quyền Camera!"));
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      if (cameraInputRef.current) cameraInputRef.current.click();
    }
  }, [countdown]);

  const handleVoiceInput = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
      recognition.start();
    } catch (err) { alert("Lỗi Micro"); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const res = reader.result as string;
        if (isCamera) { setImage(res); setShowCropper(true); } else { setCroppedImage(res); }
      };
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => setCroppedAreaPixels(pixels), []);

  const confirmCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    const canvas = document.createElement("canvas");
    const img = new Image(); img.src = image;
    await new Promise((r) => (img.onload = r));
    const { width, height, x, y } = croppedAreaPixels as any;
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d")?.drawImage(img, x, y, width, height, 0, 0, width, height);
    setCroppedImage(canvas.toDataURL("image/jpeg"));
    setShowCropper(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* ĐẾM NGƯỢC */}
        {countdown !== null && (
          <div className="fixed inset-0 z-[100] bg-indigo-600/95 flex flex-col items-center justify-center text-white">
            <div className="text-9xl font-black mb-4">{countdown}</div>
            <p className="text-xl font-bold">CHUẨN BỊ CHỤP ĐỀ...</p>
          </div>
        )}

        {/* MODAL CROP */}
        {showCropper && (
          <div className="fixed inset-0 z-[90] bg-black flex flex-col">
            <div className="relative flex-1">
              <Cropper image={image!} crop={crop} zoom={zoom} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-slate-900 flex justify-between">
              <button onClick={() => setShowCropper(false)} className="text-white">Hủy</button>
              <button onClick={confirmCrop} className="bg-yellow-400 px-8 py-2 rounded-full font-bold">CẮT ẢNH</button>
            </div>
          </div>
        )}

        {/* STEP 1: HOME */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-8">
              <h1 className="text-2xl font-black mb-1">AI TUTOR SYSTEM</h1>
              <p className="opacity-70 text-xs text-indigo-100">Chọn môn học để bắt đầu giải đề</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["TOÁN", "LÝ", "HÓA", "ANH VĂN"].map((sub) => (
                <button key={sub} onClick={() => { setSubject(sub); setStep(2); }} className="h-32 bg-white border-2 border-slate-100 font-bold rounded-3xl shadow-sm text-indigo-600 hover:border-indigo-500 transition-all">{sub}</button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: INPUT */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-4">← QUAY LẠI</button>
            <h2 className="text-3xl font-black mb-8 text-slate-800 uppercase">MÔN {subject}</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              <button onClick={startCameraWithTimer} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 active:bg-indigo-50">
                <span className="text-3xl mb-1">📸</span>
                <span className="text-[10px] font-black uppercase">Chụp ảnh</span>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
              </button>
              <label className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                <span className="text-3xl mb-1">📁</span>
                <span className="text-[10px] font-black uppercase">Tải lên</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, false)} />
              </label>
              <button onClick={handleVoiceInput} className={`flex flex-col items-center p-4 rounded-2xl border-2 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50'}`}>
                <span className="text-3xl mb-1">{isRecording ? "⏹️" : "🎤"}</span>
                <span className="text-[10px] font-black uppercase">Giọng nói</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {transcript && <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 italic mb-4">“{transcript}”</div>}
              {croppedImage && <img src={croppedImage} className="w-full rounded-2xl shadow-lg border-4 border-white" />}
            </div>

            <button onClick={sendToAI} disabled={!croppedImage && !transcript} className="mt-6 w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest disabled:bg-slate-200 shadow-xl active:scale-95 transition-all">
              Giải đề ngay 🚀
            </button>
          </div>
        )}

        {/* STEP 3: RESULT (3 TAB) */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <button onClick={() => setStep(2)} className="text-indigo-600 font-bold">← Quay lại</button>
              <span className="font-black text-slate-400 uppercase text-xs">Kết quả giải đề</span>
              <div className="w-8"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-400 animate-pulse uppercase text-xs">AI đang phân tích...</p>
              </div>
            ) : aiData && (
              <div className="flex flex-col flex-1">
                {/* THANH CHUYỂN TAB */}
                <div className="flex bg-slate-100 p-1.5 m-4 rounded-2xl">
                  {[{ id: 1, n: "ĐÁP ÁN" }, { id: 2, n: "GIẢI THÍCH" }, { id: 3, n: "LUYỆN TẬP" }].map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t.n}</button>
                  ))}
                </div>

                <div className="flex-1 px-6 pb-6 overflow-y-auto">
                  {activeTab === 1 && (
                    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Kết quả cuối cùng</div>
                      <div className="text-4xl font-black text-indigo-600 bg-indigo-50 px-10 py-12 rounded-full border-8 border-white shadow-2xl text-center min-w-[180px]">
                        {aiData.dap_an}
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                      {aiData.giai_thich.split('\n').map((line: string, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                          <span className="font-black text-indigo-300 italic">{i + 1}.</span>
                          <p className="text-slate-700 text-sm font-medium leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl">
                        <p className="font-bold mb-6 leading-snug">📝 {aiData.trac_nghiem.cau_hoi}</p>
                        <div className="space-y-2">
                          {aiData.trac_nghiem.lua_chon.map((opt: string, i: number) => (
                            <button key={i} onClick={() => setUserChoice(i)} className={`w-full text-left p-4 rounded-2xl font-bold text-xs transition-all ${userChoice === i ? (i === aiData.trac_nghiem.index_dung ? 'bg-emerald-400 text-white' : 'bg-rose-400 text-white') : 'bg-white/10 hover:bg-white/20'}`}>
                              {userChoice === i && (i === aiData.trac_nghiem.index_dung ? "✓ " : "✕ ")} {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6">
                        <p className="font-bold text-slate-800 mb-4 text-sm">✍️ Tự luận: {aiData.tu_luan.cau_hoi}</p>
                        {showEssayAns ? (
                          <div className="p-4 bg-white rounded-2xl border-2 border-amber-200 text-amber-600 font-black text-center animate-in fade-in duration-500 uppercase text-xs">{aiData.tu_luan.dap_an}</div>
                        ) : (
                          <button onClick={() => setShowEssayAns(true)} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-lg uppercase">Xem đáp án tự luận</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t mt-auto">
                  <button onClick={() => setStep(1)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Hoàn thành bài học</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
