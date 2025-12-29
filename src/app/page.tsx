"use client";
import "./globals.css";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop"; // Thư viện cắt ảnh

import { useState } from "react";
export default function StudyApp() {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(""); // Lưu văn bản từ giọng nói
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

export default function StudyApp() {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  // --- 1. XỬ LÝ GIỌNG NÓI ---
  const startRecording = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onresult = (event: any) => {
      setTranscript(event.results[0][0].transcript);
    };
    recognition.start();
  };

  // --- 2. XỬ LÝ GỬI ĐỀ (Gộp cả 3 nguồn) ---
  const handleSendRequest = async () => {
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        body: JSON.stringify({ 
          image, 
          prompt: transcript || "Giải đề bài này", 
          subject: "Tổng hợp" 
        }),
      });
      const data = await res.json();
      setResponse(data.text);
    } catch (e) {
      setResponse("Lỗi kết nối.");
    }
    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-6">
      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-center">GỬI CÂU HỎI</h1>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Chức năng 1: Chụp ảnh */}
            <label className="flex flex-col items-center p-4 bg-white rounded-xl shadow cursor-pointer">
              <span className="text-2xl">📸</span>
              <span className="text-[10px] font-bold">CHỤP ẢNH</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {/* Thêm logic crop ở đây */}} />
            </label>

            {/* Chức năng 2: Tải ảnh */}
            <label className="flex flex-col items-center p-4 bg-white rounded-xl shadow cursor-pointer">
              <span className="text-2xl">📁</span>
              <span className="text-[10px] font-bold">TẢI LÊN</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>

            {/* Chức năng 3: Ghi âm */}
            <button onClick={startRecording} className="flex flex-col items-center p-4 bg-white rounded-xl shadow">
              <span className="text-2xl">🎤</span>
              <span className="text-[10px] font-bold">GIỌNG NÓI</span>
            </button>
          </div>

          {/* Hiển thị nội dung đã thu âm hoặc ảnh đã chọn */}
          {transcript && <div className="p-3 bg-blue-50 rounded-lg text-sm italic">" {transcript} "</div>}

          <button onClick={handleSendRequest} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">
             GỬI ĐỀ NGAY
          </button>
        </div>
      )}
      {/* ... (Các phần Step 1 và Step 3 giữ nguyên) */}
    </main>
  );
}


// 1. Khi chọn ảnh từ Camera hoặc File
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result as string);
        setShowCropper(true); // Hiện khung cắt ngay
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // 2. Lưu vị trí cắt
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 3. Hàm tạo ảnh đã cắt (từ Canvas)
  const generateCroppedImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.src = image!;
      await new Promise((resolve) => (img.onload = resolve));

      const ctx = canvas.getContext("2d");
      canvas.width = croppedAreaPixels!.width;
      canvas.height = croppedAreaPixels!.height;

      ctx?.drawImage(
        img,
        croppedAreaPixels!.x, croppedAreaPixels!.y,
        croppedAreaPixels!.width, croppedAreaPixels!.height,
        0, 0,
        croppedAreaPixels!.width, croppedAreaPixels!.height
      );

      const base64Image = canvas.toDataURL("image/jpeg");
      setFinalImage(base64Image); // Đây là ảnh "sạch" chỉ chứa vùng đã cắt
      setShowCropper(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 relative">
      {/* GIAO DIỆN CROP (Hiện đè lên màn hình) */}
      {showCropper && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={image!}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3} // Bạn có thể chỉnh tỉ lệ hoặc bỏ để tự do
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-6 bg-slate-900 flex justify-between">
            <button onClick={() => setShowCropper(false)} className="text-white">Hủy</button>
            <button onClick={generateCroppedImage} className="bg-indigo-600 px-6 py-2 rounded-lg text-white font-bold">
              XÁC NHẬN CẮT
            </button>
          </div>
        </div>
      )}

      {/* GIAO DIỆN CHÍNH */}
      <h1 className="text-2xl font-black text-center mb-10">GIẢI ĐỀ THÔNG MINH</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-lg cursor-pointer border-2 border-transparent active:border-indigo-500">
           <span className="text-4xl mb-2">📸</span>
           <span className="font-bold text-slate-600">CHỤP ĐỀ</span>
           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        </label>
        
        {/* Các nút khác giữ nguyên... */}
      </div>

      {/* Hiển thị ảnh sau khi đã cắt */}
      {finalImage && (
        <div className="mt-6">
          <p className="text-sm font-bold text-slate-400 mb-2 uppercase">Ảnh đã chọn:</p>
          <img src={finalImage} className="rounded-2xl border-4 border-white shadow-lg w-full" />
          <button className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl">
            GỬI CHO GEMINI GIẢI
          </button>
        </div>
      )}
    </main>
  );
}
