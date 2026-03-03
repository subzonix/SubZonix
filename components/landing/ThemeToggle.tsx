"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa6";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center h-8 w-14 rounded-full bg-slate-200 dark:bg-slate-800 p-1 cursor-pointer transition-colors duration-300 border border-slate-300 dark:border-slate-700 focus:outline-none shadow-inner group"
            aria-label="Toggle Theme"
        >
            <motion.div
                className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden z-10"
                animate={{
                    x: isDark ? 24 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isDark ? "dark" : "light"}
                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                    >
                        {isDark ? (
                            <FaMoon size={10} className="text-indigo-400" />
                        ) : (
                            <FaSun size={10} className="text-amber-500" />
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Background Icons */}
            <div className="absolute inset-x-2 flex justify-between items-center h-full pointer-events-none px-1">
                <FaSun size={10} className={clsx("transition-all duration-300", isDark ? "text-slate-400 opacity-40" : "opacity-0 scale-50")} />
                <FaMoon size={10} className={clsx("transition-all duration-300", isDark ? "opacity-0 scale-50" : "text-slate-500 opacity-40")} />
            </div>
        </button>
    );
}
