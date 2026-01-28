"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const HoverEffect = ({
    items,
    className,
}: {
    items: {
        title: string;
        description: string;
        icon?: React.ElementType;
    }[];
    className?: string;
}) => {
    let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10",
                className
            )}
        >
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="relative group block p-2 h-full w-full gsap-stagger-card"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <AnimatePresence>
                        {hoveredIndex === idx && (
                            <motion.span
                                className="absolute inset-0 h-full w-full bg-indigo-100 dark:bg-slate-800/[0.8] block rounded-3xl"
                                layoutId="hoverBackground"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    transition: { duration: 0.15 },
                                }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.15, delay: 0.2 },
                                }}
                            />
                        )}
                    </AnimatePresence>
                    <div className="rounded-2xl h-full w-full p-6 overflow-hidden bg-white dark:bg-black border border-slate-200 dark:border-white/[0.2] group-hover:border-slate-300 dark:group-hover:border-slate-700 relative z-20 transition-colors duration-500">
                        <div className="relative z-50">
                            <div className="p-4">
                                {item.icon && (
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                                        <item.icon className="text-2xl" />
                                    </div>
                                )}
                                <h4 className="text-slate-900 dark:text-zinc-100 font-bold tracking-wide mt-4">
                                    {item.title}
                                </h4>
                                <p className="mt-8 text-slate-600 dark:text-zinc-400 tracking-wide leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
