import type { Metadata } from "next";
import { LoadoutDemo } from "./loadout";

export const metadata: Metadata = {
  title: "ValorantBuild",
  description: "选择皮肤、炫彩与挂饰，构建你的无畏契约装备。",
};

export default function Home() {
  return <LoadoutDemo />;
}
