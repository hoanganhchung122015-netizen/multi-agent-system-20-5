import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini App",
  description: "Created with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Xóa class font lỗi ở thẻ body */}
      <body>
        {children}
      </body>
    </html>
  );
}
