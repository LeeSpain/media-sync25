import { useEffect, useRef, useState } from "react";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AmbientSpotlight = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (prefersReduced()) return;
    const handle = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setPos({ x: (e.clientX / innerWidth) * 100, y: (e.clientY / innerHeight) * 100 });
    };
    window.addEventListener("pointermove", handle);
    return () => window.removeEventListener("pointermove", handle);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, hsl(var(--spotlight)/0.18), transparent 60%), radial-gradient(800px circle at calc(${pos.x}% + 10%) calc(${pos.y}% + 10%), hsl(var(--spotlight-2)/0.12), transparent 60%)`,
        transition: "var(--transition-smooth)",
      }}
    />
  );
};

export default AmbientSpotlight;
