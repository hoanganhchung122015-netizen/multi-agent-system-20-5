import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini Study App",
  description: "Giải bài tập cùng AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
<head>
        {/* Dòng này sẽ kéo Tailwind trực tiếp từ máy chủ Google/Tailwind về */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
