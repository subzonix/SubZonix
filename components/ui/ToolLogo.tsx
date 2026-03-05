"use client";

import { useState, useEffect } from "react";
import { getToolDomain, getLogoSources } from "@/lib/toolLogos";
import clsx from "clsx";

interface ToolLogoProps {
    /** The tool/service name (e.g. "Netflix", "Canva 4K") */
    name: string;
    /** Optional override image URL — if provided, this is tried first */
    imageUrl?: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    /** Show as square card (for shop/mart views) vs small inline badge */
    variant?: "inline" | "card";
}

const SIZES = {
    xs: "w-5 h-5 text-[8px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
};

const CARD_SIZES = {
    xs: "w-12 h-12",
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-28 h-28",
};

// Deterministic color palette from tool name
const PALETTE = [
    "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300",
    "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300",
    "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300",
    "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
    "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300",
    "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300",
    "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300",
];

function getColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % PALETTE.length;
    return PALETTE[hash];
}

export default function ToolLogo({ name, imageUrl, size = "sm", className, variant = "inline" }: ToolLogoProps) {
    const domain = getToolDomain(name);

    // Build ordered source list: custom URL → Clearbit → Logo.dev → Google favicon
    const allSources: string[] = [];
    if (imageUrl) allSources.push(imageUrl);
    if (domain) allSources.push(...getLogoSources(domain));

    const [srcIndex, setSrcIndex] = useState(0);
    const [failed, setFailed] = useState(false);

    // Reset when name or imageUrl changes
    useEffect(() => {
        setSrcIndex(0);
        setFailed(false);
    }, [name, imageUrl]);

    const handleError = () => {
        const next = srcIndex + 1;
        if (next < allSources.length) {
            setSrcIndex(next);
        } else {
            setFailed(true);
        }
    };

    const sizeClass = variant === "card" ? CARD_SIZES[size] : SIZES[size];
    const initials = name.slice(0, 2).toUpperCase();
    const color = getColor(name);

    if (!failed && allSources.length > 0) {
        if (variant === "card") {
            return (
                <div className={clsx("rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 shrink-0", sizeClass, className)}>
                    <img
                        key={srcIndex}
                        src={allSources[srcIndex]}
                        alt={name}
                        className="w-full h-full object-contain p-2.5"
                        onError={handleError}
                    />
                </div>
            );
        }

        return (
            <div className={clsx("rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 shrink-0", sizeClass, className)}>
                <img
                    key={srcIndex}
                    src={allSources[srcIndex]}
                    alt={name}
                    className="w-full h-full object-contain p-0.5"
                    onError={handleError}
                />
            </div>
        );
    }

    // Fallback: colored initials
    return (
        <div className={clsx("rounded-lg flex items-center justify-center font-black shrink-0", sizeClass, color, className)}>
            {initials}
        </div>
    );
}
