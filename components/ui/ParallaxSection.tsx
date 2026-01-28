"use client";

import React from "react";

export default function ParallaxSection({ children, className, speed = 0.5 }: { children: React.ReactNode, className?: string, speed?: number }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
