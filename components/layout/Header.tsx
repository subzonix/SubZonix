"use client";

import { FaBars, FaMoon, FaSun, FaUser, FaRightFromBracket, FaChevronDown, FaGem, FaArrowUp, FaMessage } from "react-icons/fa6";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import Link from "next/link";
import NotificationBanner from "@/components/admin/NotificationBanner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Header({ onMenuClick, onSidebarToggle, sidebarCollapsed, hideNotifications = false }: { onMenuClick: () => void, onSidebarToggle?: () => void, sidebarCollapsed?: boolean, hideNotifications?: boolean }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [appName, setAppName] = useState("SubZonix");
    const profileRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { user, planName, salesLimit, currentSalesCount } = useAuth();

    useEffect(() => {
        setMounted(true);
        const loadAppName = async () => {
            const snap = await getDoc(doc(db, "settings", "app_config"));
            if (snap.exists()) setAppName(snap.data().appName || "SubZonix");
        };
        loadAppName();

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getTitle = () => {
        if (pathname.includes("new-sale")) return "Add New Sale";
        if (pathname.includes("expiry")) return "Expiry Alerts";
        if (pathname.includes("pending")) return "Pending Clients";
        if (pathname.includes("history")) return "Sales History";
        if (pathname.includes("vendors")) return "Vendors & Dues Management";
        if (pathname.includes("inventory")) return "Inventory Management";
        if (pathname.includes("analytics")) return "Advanced Analytics";
        if (pathname.includes("settings")) return "Settings";
        if (pathname.startsWith("/owner")) return "Owner Dashboard";
        return "Dashboard Overview";
    };

    if (!mounted) {
        return (
            <header className="flex items-center justify-between px-6 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 transition-colors">
                <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            </header>
        );
    }

    const isDark = resolvedTheme === "dark";
    const toggleTheme = () => setTheme(isDark ? "light" : "dark");
    const handleLogout = () => signOut(auth);

    const showSaveReminder = pathname.includes('/settings');

    return (
        <div className="flex flex-col">
            {!hideNotifications && <NotificationBanner />}
            <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-[var(--card)] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3">
                    <button onClick={onMenuClick} className="md:hidden text-slate-600 dark:text-slate-200 text-xl hover:text-indigo-500 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <FaBars />
                    </button>
                    {onSidebarToggle && (
                        <button
                            onClick={onSidebarToggle}
                            className="hidden md:flex items-center justify-center p-2 -ml-2 mr-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                            aria-label="Toggle Sidebar"
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <motion.div
                                initial={false}
                                animate={sidebarCollapsed ? "closed" : "open"}
                                className="w-5 h-5 flex flex-col justify-center items-center gap-1.5"
                            >
                                <motion.span
                                    variants={{
                                        closed: { rotate: 0, y: 0, width: 20 },
                                        open: { rotate: 45, y: 6, width: 20 },
                                    }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="h-0.5 bg-current rounded-full origin-center"
                                />
                                <motion.span
                                    variants={{
                                        closed: { opacity: 1, x: 0, width: 20 },
                                        open: { opacity: 0, x: -10, width: 0 },
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="h-0.5 bg-current rounded-full"
                                />
                                <motion.span
                                    variants={{
                                        closed: { rotate: 0, y: 0, width: 20 },
                                        open: { rotate: -45, y: -6, width: 20 },
                                    }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="h-0.5 bg-current rounded-full origin-center"
                                />
                            </motion.div>
                        </button>
                    )}
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-[var(--foreground)]">{getTitle()}</h1>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className="group w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-300 active:scale-95"
                    >
                        <div className="relative w-4 h-4 flex items-center justify-center">
                            <FaSun className={clsx("absolute text-amber-400 transition-all duration-500 transform", isDark ? "rotate-0 opacity-100 scale-100" : "rotate-180 opacity-0 scale-50")} />
                            <FaMoon className={clsx("absolute text-indigo-500 transition-all duration-500 transform", !isDark ? "rotate-0 opacity-100 scale-100" : "-rotate-180 opacity-0 scale-50")} />
                        </div>
                    </button>

                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 relative group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 relative">
                                <span className="font-bold text-[10px]">{(user?.email?.[0] || "A").toUpperCase()}</span>
                                {planName && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                                        <FaGem className="text-[6px] text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="hidden sm:flex flex-col items-start -space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Account</span>
                                <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 uppercase">
                                    {planName || "Free"}
                                </span>
                            </div>
                            <FaChevronDown className={clsx("text-[10px] text-slate-400 transition-transform duration-300", showProfileMenu && "rotate-180")} />
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                                    <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user?.email}</p>
                                    {planName && (
                                        <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md w-fit">
                                            <FaGem className="text-[10px] text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider">{planName}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Usage Analytics</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-slate-500">Sales Usage</span>
                                            <span className="font-black text-indigo-500">{currentSalesCount || 0} / {salesLimit || "∞"}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "h-full transition-all duration-500 ease-out",
                                                    (salesLimit && currentSalesCount && (currentSalesCount / salesLimit) > 0.9) ? "bg-rose-500" : "bg-indigo-500"
                                                )}
                                                style={{ width: `${salesLimit ? Math.min(100, ((currentSalesCount || 0) / salesLimit) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <Link
                                        href="/dashboard/plans"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition"
                                    >
                                        <div className="w-7 h-7 flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                                            <FaArrowUp className="text-[11px]" />
                                        </div>
                                        Upgrade Plan
                                    </Link>
                                    <div className="h-px bg-[var(--border)] my-1 mx-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition"
                                    >
                                        <div className="w-7 h-7 flex items-center justify-center bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                                            <FaRightFromBracket className="text-[11px]" />
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {showSaveReminder && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500 px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest backdrop-blur-sm sticky top-0 z-20">
                    💾 Don't forget to click the SAVE button to save your changes!
                </div>
            )
            }
        </div >
    );
}
