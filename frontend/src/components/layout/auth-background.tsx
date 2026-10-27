"use client";

import { useEffect, useRef } from "react";

export function AuthBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particleCount = 40;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className =
        "absolute rounded-full pointer-events-none bg-primary/20";
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);
      particles.push(particle);

      const duration = (Math.random() * 10 + 10) * 1000;
      particle.animate(
        [
          { transform: "translate(0, 0)", opacity: "0" },
          {
            transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`,
            opacity: "0.5",
          },
          {
            transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px)`,
            opacity: "0",
          },
        ],
        {
          duration,
          iterations: Number.POSITIVE_INFINITY,
          easing: "ease-in-out",
        },
      );
    }

    return () => {
      for (const particle of particles) {
        particle.remove();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 grid-background opacity-20" />
      <div className="absolute top-[-10%] right-[-10%] size-[500px] voice-sphere" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[400px] voice-sphere-secondary" />
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
