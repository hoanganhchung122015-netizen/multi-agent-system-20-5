"use client";

import "./globals.css";
import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";

export default function StudyApp() {
  const [step, setStep] = useState(1); // 1: Home, 2: Input, 3: Result
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // --- CHỨC NĂNG 1: GHI ÂM (SPEECH TO TEXT) ---
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ ghi âm.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
  };

  // --- CHỨC NĂNG 2: XỬ LÝ ẢNH & CROP ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setImage(reader.result as string);
        setShowCropper(true);
      };
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

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

  // --- CHỨC NĂNG 3: GỬI CHO AI ---
  const sendToAI = async () => {
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: transcript || "Hãy giải chi tiết bài tập này",
          image: croppedImage?.split(",")[1], // Chỉ gửi phần base64
          subject: subject
        }),
      });
      const data = await res.json();
      setAiResponse(data.text);
    } catch (error) {
      setAiResponse("Lỗi kết nối API. Vui lòng kiểm tra lại Key.");
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden">
        
        {/* MODAL CROP (GOOGLE LENS STYLE) */}
        {showCropper && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="relative flex-1">
              <Cropper
                image={image!}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 bg-gray-900 flex justify-between items-center">
              <button onClick={() => setShowCropper(false)} className="text-white">Hủy</button>
              <button onClick={confirmCrop} className="bg-yellow-400 px-8 py-2 rounded-full font-bold text-black">CẮT ẢNH</button>
            </div>
          </div>
        )}

        {/* MÀN HÌNH CHÍNH (STEP 1) */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-indigo-600 rounded-3xl p-6 text-white mb-8 shadow-lg">
              <h1 className="text-2xl font-black italic">GEMINI STUDY</h1>
              <p className="text-sm opacity-80">Chụp ảnh bài tập - Giải trong 5 giây</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["TOÁN", "VẬT LÝ", "HÓA HỌC", "TIẾNG ANH"].map((s) => (
                <button key={s} onClick={() => { setSubject(s); setStep(2); }}
                  className="h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-500 active:scale-95 transition-all">
                  <span className="text-3xl mb-1">{s === "TOÁN" ? "📐" : s === "VẬT LÝ" ? "⚛️" : s === "HÓA HỌC" ? "🧪" : "🇬🇧"}</span>
                  <span className="font-bold text-slate-700 text-xs">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MÀN HÌNH NHẬP ĐỀ (STEP 2) */}
        {step === 2 && (
          <div className="p-6 flex flex-col h-full">
            <button onClick={() => {setStep(1); setCroppedImage(null); setTranscript("");}} className="text-slate-400 font-bold text-sm mb-4">← QUAY LẠI</button>
            <h2 className="text-2xl font-black mb-6">MÔN {subject}</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <label className="flex flex-col items-center justify-center p-4 bg-rose-50 rounded-2xl border-2 border-rose-100 cursor-pointer">
                <span className="text-2xl">📸</span>
                <span className="text-[10px] font-black mt-1">CHỤP ĐỀ</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              </label>
              <label className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 cursor-pointer">
                <span className="text-2xl">📁</span>
                <span className="text-[10px] font-black mt-1">TẢI LÊN</span>
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
              <button onClick={handleVoiceInput} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-50 border-amber-100'}`}>
                <span className="text-2xl">{isRecording ? "⏹️" : "🎤"}</span>
                <span className="text-[10px] font-black mt-1 uppercase">{isRecording ? "ĐANG NGHE" : "GHI ÂM"}</span>
              </button>
            </div>

            {croppedImage && <img src={croppedImage} className="w-full rounded-2xl border-4 border-white shadow-md mb-4" />}
            {transcript && <div className="p-4 bg-slate-50 rounded-xl mb-4 text-sm text-slate-600 italic italic">"{transcript}"</div>}

            <button onClick={sendToAI} disabled={!croppedImage && !transcript}
              className="mt-auto w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl disabled:bg-slate-200">
              GIẢI BÀI NGAY 🚀
            </button>
          </div>
        )}

        {/* MÀN HÌNH KẾT QUẢ (STEP 3) */}
        {step === 3 && (
          <div className="p-6">
            <button onClick={() => setStep(2)} className="text-slate-400 font-bold text-sm mb-4">← LÀM CÂU KHÁC</button>
            <h2 className="text-xl font-black mb-4">LỜI GIẢI CHI TIẾT</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold animate-pulse">Gemini đang giải...</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap text-sm border border-slate-200">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

