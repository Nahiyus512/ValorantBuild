import type { Metadata } from "next";
import { LoadoutBuilder } from "@/features/loadout/loadout-builder";

export const metadata: Metadata = {
  title: "ValorantBuild",
  description: "选择皮肤、炫彩与挂饰，构建你的无畏契约装备。",
};

export default function Home() {
  return <LoadoutBuilder />;
}
