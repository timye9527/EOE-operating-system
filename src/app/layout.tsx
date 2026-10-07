import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav, TopBar } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "EOE Club OS", template: "%s · EOE Club OS" },
  description: "EOE 中文演讲俱乐部的内部入口：例会、成长百科、官员工作台、运营记录。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <TopBar />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-16 md:pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
