import type { ReactNode } from "react";
import { TacticalBackground } from "@/components/ui/tactical-background";

type GameCanvasProps = {
  scale: number;
  children: ReactNode;
  overlay?: ReactNode;
};

export function GameCanvas({ scale, children, overlay }: GameCanvasProps) {
  return (
    <main className="game-shell">
      <TacticalBackground />
      <div
        className="fixed-stage"
        style={{ "--canvas-scale": scale } as React.CSSProperties}
      >
        {children}
      </div>
      {overlay}
    </main>
  );
}
