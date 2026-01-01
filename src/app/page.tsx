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
      let rawText = data.text;

      // HÀM DỌN DẸP DỮ LIỆU THÔ TỪ AI
      // Loại bỏ các ký tự Markdown nếu có
      let cleanJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsedData = JSON.parse(cleanJson);
        setAiData(parsedData);
      } catch (parseError) {
        console.error("Dữ liệu lỗi từ AI:", rawText);
        setAiData({ 
          dap_an: "Thử lại", 
          giai_thich: "AI trả về dữ liệu không đúng cấu trúc. Hãy chụp ảnh gần và rõ nét hơn.", 
          trac_nghiem: null, 
          tu_luan: null 
        });
      }
    } catch (e) {
      setAiData({ dap_an: "Lỗi", giai_thich: "Lỗi kết nối AI. Kiểm tra lại Key trên Vercel.", trac_nghiem: null, tu_luan: null });
    }
    setLoading(false);
  };
