"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showIcon?: boolean;
    collapsed?: boolean;
}

import { useAuth } from "@/context/AuthContext";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showIcon?: boolean;
    collapsed?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
    className,
    size = "md",
    showIcon = true,
    collapsed = false
}) => {
    const { appNamePart1, appNamePart2, colorPart1, colorPart2, appLogoUrl } = useAuth();

    // Provide defaults if context is not yet loaded or values are missing
    const part1 = appNamePart1 || "Subs";
    const part2 = appNamePart2 || "Grow";
    const c1 = colorPart1 || "#3b82f6";
    const c2 = colorPart2 || "#10b981";

    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-4xl",
        xl: "text-6xl md:text-7xl",
    };

    const iconSizes = {
        sm: "w-5 h-5",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16 md:w-20 md:h-20",
    };

    return (
        <div className={cn("flex items-center gap-2 select-none group", className)}>
            {showIcon && (
                <div className={cn("relative shrink-0 transition-transform group-hover:scale-110 duration-500 overflow-hidden", iconSizes[size])}>
                    {appLogoUrl ? (
                        <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        /* Fallback SVG if no image uploaded yet */
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                            {/* Bars */}
                            <rect x="10" y="50" width="12" height="35" rx="2" fill="url(#p1Grad)" className="opacity-90" />
                            <rect x="28" y="35" width="12" height="50" rx="2" fill="url(#p2Grad)" className="opacity-90" />
                            <rect x="46" y="25" width="12" height="60" rx="2" fill="url(#p2Grad)" className="opacity-90" />

                            {/* Swoosh/Arrow */}
                            <path
                                d="M5 80 C 15 85, 45 85, 75 45 L 85 55 L 90 30 L 65 35 L 75 45"
                                fill="none"
                                stroke="url(#p2Grad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-sm"
                            />
                            <path
                                d="M5 80 C 15 90, 45 95, 85 40"
                                fill="none"
                                stroke="url(#p1Grad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                className="opacity-50"
                            />

                            <defs>
                                <linearGradient id="p1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={c1} />
                                    <stop offset="100%" stopColor={c1} stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="p2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={c2} />
                                    <stop offset="100%" stopColor={c2} stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </svg>
                    )}
                </div>
            )}

            {!collapsed && (
                <div className={cn("font-black tracking-tighter italic flex items-center leading-none", sizeClasses[size])}
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        textShadow: "1px 1px 0px rgba(0,0,0,0.1), 2px 2px 0px rgba(0,0,0,0.05)"
                    }}>
                    <span style={{ color: c1 }}>
                        {part1}
                    </span>
                    <span style={{ color: c2 }}>
                        {part2}
                    </span>
                </div>
            )}
        </div>
    );
};
