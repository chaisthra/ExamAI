import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamNote AI — Last-Day Exam Survival System",
  description: "Convert your question banks and course material into M.Tech-level exam-ready notes in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
