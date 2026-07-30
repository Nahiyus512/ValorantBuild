import { useEffect, useState } from "react";

export function useFixedCanvasScale(width = 1920, height = 1080): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [height, width]);

  return scale;
}
