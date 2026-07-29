import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValorantBuild",
  description: "ValorantBuild 无畏契约皮肤构建器",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
