import type { Metadata } from "next";
import { LoadoutDemo } from "./loadout-demo";

export const metadata: Metadata = {
  title: "VALO LOADOUT · 无畏契约皮肤构建器",
  description: "选择皮肤、切换炫彩、统计预算并导出你的装备分析图。",
};

export default function Home() {
  return <LoadoutDemo />;
}
