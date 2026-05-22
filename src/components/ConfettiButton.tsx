"use client";
import React from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ConfettiButton({ children, className, ...props }: Props) {
  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#14b8a6", "#0d9488", "#facc15", "#fb923c"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });

      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  return (
    <button
      onClick={(e) => {
        triggerConfetti();
        if (props.onClick) props.onClick(e);
      }}
      className={cn(
        "flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-300",
        "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-900",
        "shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:-translate-y-1",
        className
      )}
      {...props}
    >
      <PartyPopper className="w-5 h-5" />
      {children}
    </button>
  );
}
