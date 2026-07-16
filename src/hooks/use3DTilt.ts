import { useState, useRef, MouseEvent } from "react";

export function use3DTilt(maxTilt = 10, maxGlare = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1;
    const normalizedY = (y / rect.height) * 2 - 1;

    setTilt({
      x: normalizedY * -maxTilt,
      y: normalizedX * maxTilt,
    });

    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50 });
  };

  return {
    ref,
    tilt,
    glare,
    isHovered,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    maxGlare,
  };
}
