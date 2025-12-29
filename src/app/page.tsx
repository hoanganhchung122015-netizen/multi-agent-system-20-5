"use client";

import "./globals.css";
import { useState, useCallback, useEffect } from "react";
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

  // --- TỰ ĐỘNG CHỤP SAU 10 GIÂY ---
  const startCameraWithTimer = () => {
    setCountdown(10);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Khi đếm về 0, kích hoạt click vào input camera
      setCountdown(null);
      document.getElementById("camera-input")?.click();
    }
  }, [countdown]);

  // --- XỬ LÝ ẢNH ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const result = reader.result as string;
        if (isCamera) {
          setImage(result);
          setShowCropper(true); // Chỉ chụp camera mới hiện Crop
        } else {
          setCroppedImage(result); // Tải lên thì dùng luôn
        }
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

  // --- GỌI API GEMINI ---
  const sendToAI = async () => {
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Hãy giải chi tiết bài tập ${subject} này`,
          image: croppedImage?.split(",")[1],
          subject: subject
        }),
      });
      const data = await res.json();
      setAiResponse(data.text || "AI không trả về nội dung. Kiểm tra API Key trên Vercel.");
    } catch (error) {
      setAiResponse("Lỗi kết nối. Hãy đảm bảo bạn đã add GEMINI_API_KEY vào Environment Variables trên Vercel.");
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl overflow-hidden relative">
        
        {/* ĐẾM NGƯỢC 10 GIÂY */}
        {countdown !== null && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
            <div className="text-white text-9xl font-black animate-ping">{countdown}</div>
          </div>
        )}

        {/* CROPPER (GOOGLE LENS STYLE) */}
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
              <button onClick={confirmCrop} className="bg-yellow-400 px-8 py-2 rounded-full font-bold text-black uppercase">Xác nhận vùng chọn</button>
            </div>
          </div>
        )}

        {/* STEP 1: GIAO DIỆN 4 NÚT NGÀY TRƯỚC */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-8 shadow-xl">
              <h1 className="text-3xl font-black italic">GEMINI STUDY</h1>
              <p className="opacity-80">Giải bài tập bằng AI thông minh</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setSubject("TOÁN"); setStep(2); }} className="h-40 bg-rose-500 text-white font-bold rounded-3xl shadow-lg text-xl hover:scale-95 transition-transform">TOÁN</button>
              <button onClick={() => { setSubject("LÝ"); setStep(2); }} className="h-40 bg-blue-500 text-white font-bold rounded-3xl shadow-lg text-xl hover:scale-95 transition-transform">LÝ</button>
              <button onClick={() => { setSubject("HÓA"); setStep(2); }} className="h-40 bg-emerald-500 text-white font-bold rounded-3xl shadow-lg text-xl hover:scale-95 transition-transform">HÓA</button>
              <button className="h-40 bg-amber-500 text-white font-bold rounded-3xl shadow-lg text-xl hover:scale-95 transition-transform">NHẬT KÝ</button>
            </div>
          </div>
        )}

        {/* STEP 2: CHỌN PHƯƠNG THỨC GỬI ĐỀ */}
        {step === 2 && (
          <div className="p-6 flex flex-col h-full">
            <button onClick={() => {setStep(1); setCroppedImage(null);}} className="text-slate-400 font-bold mb-4">← QUAY LẠI</button>
            <h2 className="text-3xl font-black mb-8 text-slate-800 tracking-tight">MÔN {subject}</h2>
            
            <div className="space-y-4">
              {/* NÚT CHỤP CAMERA CÓ ĐẾM NGƯỢC */}
              <button onClick={startCameraWithTimer} className="w-full flex items-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 group">
                <span className="text-3xl mr-4">📸</span>
                <div className="text-left">
                  <div className="font-bold text-slate-700">CHỤP ĐỀ (10S TỰ ĐỘNG)</div>
                  <div className="text-xs text-slate-400 font-medium">Sẽ có khung căn chỉnh sau khi chụp</div>
                </div>
                <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
              </button>

              {/* NÚT TẢI LÊN (KHÔNG CROP) */}
              <label className="w-full flex items-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 cursor-pointer">
                <span className="text-3xl mr-4">📁</span>
                <div className="text-left">
                  <div className="font-bold text-slate-700">TẢI ẢNH TỪ MÁY</div>
                  <div className="text-xs text-slate-400 font-medium">Gửi trực tiếp ảnh có sẵn</div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, false)} />
              </label>
            </div>

            {croppedImage && (
              <div className="mt-8 animate-in fade-in zoom-in duration-300">
                <img src={croppedImage} className="w-full rounded-2xl border-4 border-white shadow-xl mb-6" />
                <button onClick={sendToAI} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-transform uppercase tracking-widest">
                  Giải bài ngay 🚀
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: LỜI GIẢI */}
        {step === 3 && (
          <div className="p-6">
            <button onClick={() => setStep(2)} className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest">← Thử câu khác</button>
            <h2 className="text-2xl font-black mb-6 text-indigo-600">LỜI GIẢI CỦA GEMINI</h2>
            {loading ? (
              <div className="flex flex-col items-center py-20">
                <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-tighter">Đang phân tích đề bài...</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner border border-slate-200">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
