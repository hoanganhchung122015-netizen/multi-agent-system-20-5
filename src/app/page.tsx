"use client";

import "./globals.css";
import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";

export default function StudyApp() {
  // State cơ bản
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State kết quả AI (3 Tab)
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [showEssayAns, setShowEssayAns] = useState(false);

  // --- XỬ LÝ CAMERA & MICRO ---
  const startCameraWithTimer = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCountdown(5)) // Đếm ngược 5 giây cho nhanh
      .catch(() => alert("Cần quyền Camera!"));
  };

  useEffect(() => {
    if (countdown === 0) {
      setCountdown(null);
      cameraInputRef.current?.click();
    }
    if (!countdown) return;
    const timer = setInterval(() => setCountdown(prev => (prev ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVoiceInput = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ giọng nói");
    const rec = new SpeechRecognition();
    rec.lang = "vi-VN";
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
    rec.start();
  };

  // --- XỬ LÝ ẢNH ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const res = reader.result as string;
        if (isCamera) { setImage(res); setShowCropper(true); } 
        else { setCroppedImage(res); }
      };
    }
  };

  const onCropComplete = useCallback((_: any, p: any) => setCroppedAreaPixels(p), []);
  const confirmCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    const canvas = document.createElement("canvas");
    const img = new Image(); img.src = image;
    await new Promise(r => img.onload = r);
    const { width, height, x, y } = croppedAreaPixels as any;
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d")?.drawImage(img, x, y, width, height, 0, 0, width, height);
    setCroppedImage(canvas.toDataURL("image/jpeg"));
    setShowCropper(false);
  };

  // --- HÀM SEND TO AI (QUAN TRỌNG NHẤT) ---
  const sendToAI = async () => {
    setLoading(true);
    setStep(3);
    setActiveTab(1);
    setUserChoice(null);
    setShowEssayAns(false);

    try {
      const base64 = croppedImage ? croppedImage.split(",")[1] : null;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcript || `Giải bài tập ${subject}`, image: base64, subject }),
      });

      const result = await res.json();
      // Bộ lọc dọn dẹp JSON
      const cleanJson = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
      setAiData(JSON.parse(cleanJson));
    } catch (e) {
      setAiData({
        dap_an: "Lỗi",
        giai_thich: "AI trả về dữ liệu không đúng cấu trúc. Hãy thử chụp lại rõ nét hơn.",
        trac_nghiem: { cau_hoi: "", lua_chon: [], index_dung: 0 },
        tu_luan: { cau_hoi: "", dap_an: "" }
      });
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* COUNTDOWN */}
        {countdown !== null && (
          <div className="fixed inset-0 z-[100] bg-indigo-600 flex flex-col items-center justify-center text-white text-9xl font-black">
            {countdown}
          </div>
        )}

        {/* CROPPER */}
        {showCropper && (
          <div className="fixed inset-0 z-[90] bg-black flex flex-col">
            <div className="relative flex-1"><Cropper image={image!} crop={crop} zoom={zoom} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} /></div>
            <button onClick={confirmCrop} className="m-6 bg-yellow-400 p-4 rounded-full font-black">XÁC NHẬN CẮT ẢNH</button>
          </div>
        )}

        {/* STEP 1: HOME */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white mb-8 shadow-lg">
              <h1 className="text-2xl font-black italic">GIA SƯ AI 24/7</h1>
              <p className="text-xs opacity-70">Chụp ảnh đề bài - Nhận lời giải ngay</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => {setSubject("TOÁN"); setStep(2)}} className="h-32 bg-rose-500 text-white font-bold rounded-2xl shadow-md">TOÁN</button>
              <button onClick={() => {setSubject("LÝ"); setStep(2)}} className="h-32 bg-blue-500 text-white font-bold rounded-2xl shadow-md">LÝ</button>
              <button onClick={() => {setSubject("HÓA"); setStep(2)}} className="h-32 bg-emerald-500 text-white font-bold rounded-2xl shadow-md">HÓA</button>
              <button onClick={() => {setSubject("NHẬT KÝ"); setStep(2)}} className="h-32 bg-amber-500 text-white font-bold rounded-2xl shadow-md">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {/* STEP 2: INPUT */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-4">← QUAY LẠI</button>
            <h2 className="text-2xl font-black mb-6 uppercase">MÔN {subject}</h2>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button onClick={startCameraWithTimer} className="p-4 bg-slate-50 border rounded-2xl text-2xl">📸<input ref={cameraInputRef} type="file" capture="environment" className="hidden" onChange={e => onFileChange(e, true)} /></button>
              <label className="p-4 bg-slate-50 border rounded-2xl text-2xl text-center">📁<input type="file" className="hidden" onChange={e => onFileChange(e, false)} /></label>
              <button onClick={handleVoiceInput} className={`p-4 border rounded-2xl text-2xl ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-50'}`}>🎤</button>
            </div>
            <div className="flex-1 overflow-auto">
              {croppedImage && <img src={croppedImage} className="w-full rounded-2xl border-4 border-white shadow-lg" />}
              {transcript && <p className="p-4 bg-indigo-50 rounded-xl mt-4 italic">"{transcript}"</p>}
            </div>
            <button onClick={sendToAI} disabled={!croppedImage && !transcript} className="mt-4 w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase disabled:bg-slate-200 shadow-xl">GIẢI ĐỀ NGAY 🚀</button>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="p-4 border-b flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-indigo-600 font-bold">THỬ LẠI</button>
              <span className="font-black">LỜI GIẢI AI</span>
              <div className="w-10"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-400">AI ĐANG SUY NGHĨ...</p>
              </div>
            ) : aiData && (
              <div className="flex flex-col flex-1">
                <div className="flex bg-slate-100 p-1 m-4 rounded-xl">
                  {["ĐÁP ÁN", "GIẢI THÍCH", "LUYỆN TẬP"].map((t, i) => (
                    <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 py-2 rounded-lg font-black text-[10px] ${activeTab === i+1 ? 'bg-white text-indigo-600 shadow' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>

                <div className="flex-1 px-6 overflow-y-auto">
                  {activeTab === 1 && (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="text-4xl font-black text-indigo-600 bg-indigo-50 p-10 rounded-full border-8 border-white shadow-xl">{aiData.dap_an}</div>
                    </div>
                  )}
                  {activeTab === 2 && (
                    <div className="space-y-4">
                      {aiData.giai_thich.split('\n').map((line: string, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border-l-4 border-indigo-500 text-sm font-medium">{line}</div>
                      ))}
                    </div>
                  )}
                  {activeTab === 3 && (
                    <div className="space-y-6">
                      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg">
                        <p className="font-bold mb-4">Câu hỏi: {aiData.trac_nghiem.cau_hoi}</p>
                        <div className="space-y-2">
                          {aiData.trac_nghiem.lua_chon.map((opt: string, i: number) => (
                            <button key={i} onClick={() => setUserChoice(i)} className={`w-full text-left p-3 rounded-xl text-xs font-bold ${userChoice === i ? (i === aiData.trac_nghiem.index_dung ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-white/10'}`}>{opt}</button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-amber-100 p-6 rounded-3xl">
                        <p className="font-bold text-sm mb-4">Tự luận: {aiData.tu_luan.cau_hoi}</p>
                        {showEssayAns ? <p className="text-xs font-black text-amber-700">{aiData.tu_luan.dap_an}</p> : <button onClick={() => setShowEssayAns(true)} className="w-full bg-amber-500 text-white p-3 rounded-xl font-bold text-xs uppercase">Xem đáp án</button>}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setStep(1)} className="m-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs">Hoàn thành</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
