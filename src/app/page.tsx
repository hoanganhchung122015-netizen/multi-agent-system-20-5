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
  const [aiResponse, setAiResponse] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- XỬ LÝ CAMERA & ĐẾM NGƯỢC ---
  const startCameraWithTimer = () => {
    // Xin quyền camera trước khi đếm ngược để tránh bị chặn
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCountdown(10))
      .catch(() => alert("Vui lòng cho phép quyền truy cập Camera trong cài đặt trình duyệt!"));
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      // Kích hoạt input camera
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  }, [countdown]);

  // --- XỬ LÝ GHI ÂM (MICRO) ---
  const handleVoiceInput = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = false;
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
      };

      recognition.start();
    } catch (err) {
      alert("Vui lòng cho phép quyền truy cập Micro!");
    }
  };

  // --- XỬ LÝ ẢNH & CROP ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const result = reader.result as string;
        if (isCamera) {
          setImage(result);
          setShowCropper(true);
        } else {
          setCroppedImage(result); // Tải lên dùng luôn không cần crop
        }
      };
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => setCroppedAreaPixels(pixels), []);

  const confirmCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => (img.onload = resolve));
    const ctx = canvas.getContext("2d");
    const { width, height, x, y } = croppedAreaPixels as any;
    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);
    setCroppedImage(canvas.toDataURL("image/jpeg"));
    setShowCropper(false);
  };

  // --- GỬI ĐỀ CHO AI ---
  const sendToAI = async () => {
    setLoading(true);
    setStep(3);
    try {
      const base64Data = croppedImage ? croppedImage.split(",")[1] : null;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: transcript || `Hãy giải chi tiết bài tập ${subject} này bằng tiếng Việt.`,
          image: base64Data,
          subject: subject
        }),
      });
      const data = await res.json();
      setAiResponse(data.text || "AI không trả về lời giải. Hãy kiểm tra lại ảnh hoặc Key.");
    } catch (error) {
      setAiResponse("Lỗi kết nối. Vui lòng kiểm tra API Key trên Vercel.");
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* LỚP PHỦ ĐẾM NGƯỢC */}
        {countdown !== null && (
          <div className="fixed inset-0 z-[100] bg-indigo-600/95 flex flex-col items-center justify-center text-white">
            <div className="text-9xl font-black mb-4 animate-bounce">{countdown}</div>
            <p className="text-xl font-bold uppercase tracking-widest">Chuẩn bị chụp đề...</p>
          </div>
        )}

        {/* MODAL CROP GOOGLE LENS */}
        {showCropper && (
          <div className="fixed inset-0 z-[90] bg-black flex flex-col">
            <div className="relative flex-1">
              <Cropper image={image!} crop={crop} zoom={zoom} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-slate-900 flex justify-between items-center">
              <button onClick={() => setShowCropper(false)} className="text-white font-medium">Hủy</button>
              <button onClick={confirmCrop} className="bg-yellow-400 px-10 py-3 rounded-full font-black text-black shadow-lg">XÁC NHẬN VÙNG CHỌN</button>
            </div>
          </div>
        )}

        {/* STEP 1: HOME */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-8 shadow-xl">
              <h1 className="text-3xl font-black italic mb-1">MULTI-AGEN-SYSTEM 20.5</h1>
              <p className="opacity-80 text-sm">Gia sư AI hoàn hảo của mọi thế hệ học sinh</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setSubject("TOÁN"); setStep(2); }} className="h-40 bg-rose-500 text-white font-bold rounded-3xl shadow-lg text-xl active:scale-95 transition-all">TOÁN</button>
              <button onClick={() => { setSubject("LÝ"); setStep(2); }} className="h-40 bg-blue-500 text-white font-bold rounded-3xl shadow-lg text-xl active:scale-95 transition-all">LÝ</button>
              <button onClick={() => { setSubject("HÓA"); setStep(2); }} className="h-40 bg-emerald-500 text-white font-bold rounded-3xl shadow-lg text-xl active:scale-95 transition-all">HÓA</button>
              <button onClick={() => { setSubject("NHẬT KÝ"); setStep(2); }} className="h-40 bg-amber-500 text-white font-bold rounded-3xl shadow-lg text-xl active:scale-95 transition-all">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {/* STEP 2: INPUT */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => {setStep(1); setCroppedImage(null); setTranscript("");}} className="text-slate-400 font-bold mb-4 flex items-center">
              <span className="mr-2 text-xl">←</span> QUAY LẠI
            </button>
            <h2 className="text-3xl font-black mb-8 text-slate-800">MÔN {subject}</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              <button onClick={startCameraWithTimer} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 active:bg-indigo-50 active:border-indigo-200">
                <span className="text-3xl mb-1">📸</span>
                <span className="text-[10px] font-black uppercase">Chụp ảnh</span>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
              </button>

              <label className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer active:bg-indigo-50">
                <span className="text-3xl mb-1">📁</span>
                <span className="text-[10px] font-black uppercase">Tải lên</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, false)} />
              </label>

              <button onClick={handleVoiceInput} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse border-red-600' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-3xl mb-1">{isRecording ? "⏹️" : "🎤"}</span>
                <span className="text-[10px] font-black uppercase">{isRecording ? "Đang nghe" : "Giọng nói"}</span>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {transcript && (
                <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 rounded-r-xl text-sm font-medium italic">
                  “{transcript}”
                </div>
              )}
              {croppedImage && (
                <div className="relative">
                  <img src={croppedImage} className="w-full rounded-2xl border-4 border-white shadow-xl" />
                  <button onClick={() => setCroppedImage(null)} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg">×</button>
                </div>
              )}
            </div>

            <button onClick={sendToAI} disabled={!croppedImage && !transcript} className="mt-6 w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-all disabled:bg-slate-200 disabled:shadow-none uppercase tracking-widest">
              Gửi đề cho chuyên gia 🚀
            </button>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(2)} className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">← Thử lại</button>
            <h2 className="text-2xl font-black mb-6 text-indigo-600 flex items-center">
              ✨ LỜI GIẢI CHI TIẾT
            </h2>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">Gemini đang phân tích...</p>
              </div>
            ) : (
              <div className="flex-1 bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner border border-slate-200 overflow-y-auto max-h-[60vh]">
                {aiResponse}
              </div>
            )}
            {!loading && (
               <button onClick={() => setStep(1)} className="mt-6 w-full bg-slate-800 text-white py-4 rounded-2xl font-bold uppercase text-sm">Quay về trang chủ</button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}



