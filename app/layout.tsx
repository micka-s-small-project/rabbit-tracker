// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 프로젝트 스타일 파일 경로에 맞게 유지

export const metadata: Metadata = {
  title: "rabbit-tracker",
  description: "A serverless, high-density habit & metric matrix focused on digital detox.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className="antialiased bg-slate-955">
      {children}
      </body>
      </html>
  );
}