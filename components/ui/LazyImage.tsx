"use client";

import React from "react";
import Image from "next/image";

export default function LazyImage({ src, alt, className, width, height }: any) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt || "Image"}
        width={width || 500}
        height={height || 300}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
