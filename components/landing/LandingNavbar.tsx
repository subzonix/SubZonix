"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import ThemeToggle from "./ThemeToggle";
import clsx from "clsx";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, appName, appLogoUrl, accentColor } = useAuth();

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Home", href: "/#home" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "Pricing", href: "/#plans" },
        { label: "About", href: "/about" },
        
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={clsx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    scrolled ? "py-4" : "py-6"
                )}
            >
                <div className={clsx(
                    "max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 relative",
                    scrolled
                        ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-full shadow-lg shadow-black/5 py-3 pr-3 pl-6 mx-4 md:mx-auto"
                        : "bg-transparent"
                )}>
                    <Link href="/" className="flex items-center gap-2 z-50 relative group">
                        <BrandLogo size="md" showIcon={true} />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full" style={{ backgroundColor: accentColor || "#4f46e5" }} />
                                </Link>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                        <div className="flex items-center gap-4">
                            <ThemeToggle />

                            <Link
                                href={user ? "/dashboard" : "/login"}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                            >
                                {user ? "Dashboard" : "Login"}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-4 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-900 dark:text-white z-50 relative"
                        >
                            {mobileMenuOpen ? <FaXmark size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>

                    {/* Scroll Progress Indicator (Only visible when scrolled and navbar is active) */}
                    {scrolled && (
                        <motion.div
                            className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-indigo-500 to-slate-900 dark:to-white origin-left rounded-full"
                            style={{ scaleX }}
                        />
                    )}
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 md:hidden"
                    >
                        {navLinks.map((link, i) => (
                            <motion.div
                                key={link.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-3xl font-black text-slate-900 dark:text-white tracking-tight hover:text-indigo-600 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            </motion.div>
                        ))}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link
                                href={user ? "/dashboard" : "/login"}
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xl font-bold shadow-xl shadow-indigo-600/20"
                            >
                                {user ? "Go to Dashboard" : "Login"}
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
