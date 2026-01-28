"use client";

import React from "react";

export default function SectionCursorGlow({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 z-30 transition duration-300" />
      {children}
    </div>
  );
}
