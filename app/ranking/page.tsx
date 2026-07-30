import type { Metadata } from "next";
import { RankingBuilder } from "@/features/ranking/ranking-builder";

export const metadata: Metadata = {
  title: "排行 - ValorantBuild",
  description: "为你的武器皮肤排行，从夯到拉。",
};

export default function RankingPage() {
  return <RankingBuilder />;
}
