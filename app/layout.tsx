import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
      <Analytics /> {/* 2. Inject it here right below your main content */}
      </body>
      </html>
  );
}