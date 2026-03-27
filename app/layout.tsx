import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thomaths EMS — 教务管理系统",
  description: "多校区教育管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
