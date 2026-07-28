import type { Metadata } from "next";
import { requireChatGPTUser } from "./chatgpt-auth";
import { LoadoutDemo } from "./loadout-demo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ValorantBuild",
  description: "选择皮肤、炫彩与挂饰，构建你的无畏契约装备。",
};

export default async function Home() {
  await requireChatGPTUser("/");
  return <LoadoutDemo />;
}
