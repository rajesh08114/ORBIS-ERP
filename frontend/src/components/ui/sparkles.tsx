"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SparklesBackground({ className }: { className?: string }) {
  const [sparkles, setSparkles] = useState<{ id: number; top: string; left: string; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate static sparkles on mount to avoid hydration mismatch
    const newSparkles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // 1px to 3px
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }));
    setSparkles(newSparkles);
  }, []);

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-60", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--surface-muted)] to-[var(--background)] opacity-50 mix-blend-overlay" />
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute rounded-full bg-[var(--primary)]"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            boxShadow: `0 0 ${sparkle.size * 3}px var(--primary)`,
            animation: `pulse-sparkle ${sparkle.duration}s ease-in-out ${sparkle.delay}s infinite alternate`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes pulse-sparkle {
          0% { opacity: 0.1; transform: scale(0.8); }
          100% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
