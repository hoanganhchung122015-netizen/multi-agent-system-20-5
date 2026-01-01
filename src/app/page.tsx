"use client";
import { useState, useEffect, useRef } from "react";

export default function StudyApp() {
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(1);
  
  // State cho Camera & Đếm ngược
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mở Camera và bắt đầu đếm ngược
  const startCaptureProcess = async () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    setCountdown(10); // Đếm ngược từ 10
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Không thể mở Camera. Vui lòng cấp quyền!");
      setIsCameraOpen(false);
      setCountdown(null);
    }
  };

  // Xử lý đếm ngược
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      takePhoto();
    }
  }, [countdown]);

  // Hàm chụp ảnh
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const data = canvas.toDataURL("image/jpeg");
      setCapturedImage(data);
      
      // Tắt camera sau khi chụp
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
      setCountdown(null);
    }
  };

  const sendToAI = async () => {
    if (!capturedImage) return;
    setLoading(true); setStep(3); setActiveTab(1);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Giải bài tập ${subject}`, 
          image: capturedImage.split(",")[1], 
          subject 
        }),
      });
      const data = await res.json();
      const cleanJson = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      setAiData(JSON.parse(cleanJson));
    } catch (e) {
      setAiData({ dap_an: "Lỗi", giai_thich: "Không thể đọc ảnh.", trac_nghiem: null, tu_luan: null });
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col min-h-screen relative overflow-hidden">
        
        {/* LỚP PHỦ CAMERA & ĐẾM NGƯỢC */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white text-9xl font-black animate-ping">{countdown}</div>
            </div>
            <div className="absolute bottom-10 text-white font-bold uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full">
              Giữ chắc máy, tự động chụp sau {countdown}s
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* STEP 1: CHỌN MÔN */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-indigo-600 p-8 rounded-[40px] text-white mb-8 text-center shadow-xl">
              <h1 className="text-3xl font-black italic">GIA SƯ AI 2.5</h1>
              <p className="opacity-70 text-sm">Chụp ảnh - Đợi 10s - Có lời giải</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["TOÁN", "LÝ", "HÓA", "NHẬT KÝ"].map((s, i) => (
                <button key={i} onClick={() => {setSubject(s); setStep(2)}} className={`h-40 text-white font-black rounded-[35px] text-2xl shadow-lg active:scale-95 transition-all ${i===0?'bg-rose-500':i===1?'bg-blue-500':i===2?'bg-emerald-500':'bg-amber-500'}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: CHỤP VÀ XÁC NHẬN */}
        {step === 2 && (
          <div className="p-6 flex flex-col flex-1">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold mb-4 uppercase text-xs">← Quay lại</button>
            <h2 className="text-3xl font-black mb-8 text-slate-800">MÔN {subject}</h2>
            
            {!capturedImage ? (
              <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[40px] bg-slate-50 p-10 text-center">
                <button onClick={startCaptureProcess} className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-5xl shadow-2xl hover:scale-105 transition-all mb-6">📸</button>
                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Bấm để bắt đầu đếm ngược 10s</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="relative group">
                  <img src={capturedImage} className="w-full rounded-[40px] shadow-2xl border-8 border-white mb-6" />
                  <button onClick={() => setCapturedImage(null)} className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full font-bold shadow-lg">XÓA CHỤP LẠI</button>
                </div>
                <button onClick={sendToAI} className="mt-auto bg-indigo-600 text-white py-6 rounded-[35px] font-black uppercase text-lg shadow-2xl animate-bounce">Gửi cho chuyên gia 🚀</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: KẾT QUẢ 3 TAB (Giữ nguyên giao diện đẹp của bạn) */}
        {step === 3 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-500">
            <div className="p-4 border-b flex justify-between items-center">
              <button onClick={() => {setStep(2); setCapturedImage(null)}} className="text-indigo-600 font-bold text-xs">CHỤP LẠI</button>
              <span className="font-black tracking-tighter text-slate-700">LỜI GIẢI CHI TIẾT</span>
              <div className="w-10"></div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-400 animate-pulse text-[10px]">AI ĐANG GIẢI BÀI...</p>
              </div>
            ) : aiData && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex bg-slate-100 p-1.5 m-4 rounded-2xl">
                  {["ĐÁP ÁN", "GIẢI THÍCH", "LUYỆN TẬP"].map((t, i) => (
                    <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === i+1 ? 'bg-white text-indigo-600 shadow' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <div className="flex-1 px-6 overflow-y-auto pb-10">
                  {activeTab === 1 && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-5xl font-black text-indigo-600 bg-indigo-50 p-14 rounded-[50px] border-8 border-white shadow-2xl text-center">{aiData.dap_an}</div>
                    </div>
                  )}
                  {activeTab === 2 && (
                    <div className="space-y-4">
                      {aiData.giai_thich.split('\n').map
