import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div
      className={`bg-dark-800 border border-dark-600 rounded-xl p-4 ${glow ? "glow-border" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
