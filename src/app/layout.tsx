import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimPilot - ניהול תביעות חכם",
  description: "מערכת ניהול תביעות ביטוח לסוכנים עצמאיים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
