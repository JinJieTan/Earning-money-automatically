import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Earner",
  description: "AI Agent 自主创收实验平台"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
