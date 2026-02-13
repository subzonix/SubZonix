"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaChartPie, FaBell, FaRightFromBracket, FaGem, FaChartLine, FaUsers, FaGear, FaHeadset, FaShieldHalved } from "react-icons/fa6";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { BrandLogo } from "@/components/ui/BrandLogo";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/owner", icon: FaChartPie },
    { label: "User Management", href: "/owner/users", icon: FaUsers },
    { label: "Plans Management", href: "/owner/plans", icon: FaGem },
    { label: "Vendor Directory", href: "/owner/vendors", icon: FaUsers },
    { label: "Support Queries", href: "/owner/support", icon: FaHeadset },
    { label: "Advanced Analytics", href: "/owner/analytics", icon: FaChartLine },
    { label: "Settings", href: "/owner/settings", icon: FaGear },
    { label: "Notifications", href: "/owner/notifications", icon: FaBell },
    { label: "Retention Review", href: "/owner/retention", icon: FaShieldHalved },
];

export default function OwnerSidebar({ mobileOpen, setMobileOpen, collapsed }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void, collapsed?: boolean }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const [unreadCounts, setUnreadCounts] = useState({ support: 0, notifications: 0 });

    useEffect(() => {
        if (!user) return;

        // Support Queries Count
        const qSupport = query(collection(db, "support_queries"), where("status", "==", "unread"));
        const unsubSupport = onSnapshot(qSupport, (snap) => {
            setUnreadCounts(prev => ({ ...prev, support: snap.size }));
        });

        // Notifications (Plan Requests) Count
        const qNotif = query(collection(db, "notifications"), where("type", "==", "plan_request"));
        const unsubNotif = onSnapshot(qNotif, (snap) => {
            setUnreadCounts(prev => ({ ...prev, notifications: snap.size }));
        });

        return () => {
            unsubSupport();
            unsubNotif();
        };
    }, [user]);

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: mobileOpen ? 280 : (collapsed ? 80 : 256),
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 150, damping: 20 }}
                className={clsx(
                    "fixed top-0 left-0 bottom-0 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] border-r border-[hsl(var(--sidebar-border))] z-50 flex flex-col shadow-2xl dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 md:translate-x-0 overflow-hidden",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className={clsx("border-b border-[hsl(var(--sidebar-border))] transition-all duration-300", collapsed ? "px-0 flex justify-center h-16 items-center" : "px-6 py-6 min-h-[80px] flex items-center")}>
                    <div className="flex items-center gap-2.5">
                        <BrandLogo size="md" showIcon={true} collapsed={true} />
                        {!collapsed && (
                            <div className="flex flex-col leading-none">
                                <BrandLogo size="sm" showIcon={false} />
                                <span className="text-[9px] uppercase tracking-widest text-[hsl(var(--sidebar-muted))] font-black opacity-80 mt-1 ml-0.5">
                                    Owner Panel
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className={clsx("flex-1 space-y-2 overflow-y-auto custom-scrollbar p-4 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            title={collapsed ? item.label : undefined}
                            className={clsx(
                                "flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                collapsed ? "justify-center px-0" : "px-4",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-fg))]"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
                                pathname === item.href ? "bg-primary/15 text-primary shadow-lg ring-1 ring-primary/15" : "bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-muted))] group-hover:text-[hsl(var(--sidebar-fg))]"
                            )}>
                                <item.icon className="text-sm" />
                            </div>
                            {!collapsed && (
                                <div className="flex-1 flex justify-between items-center overflow-hidden">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="truncate"
                                    >
                                        {item.label}
                                    </motion.span>

                                    {/* Badge Logic */}
                                    {item.label === "Support Queries" && unreadCounts.support > 0 && (
                                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-lg font-black min-w-[18px] text-center shadow-lg shadow-indigo-600/20 mr-2">
                                            {unreadCounts.support}
                                        </span>
                                    )}
                                    {item.label === "Notifications" && unreadCounts.notifications > 0 && (
                                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-lg font-black min-w-[18px] text-center shadow-lg shadow-indigo-600/20 mr-2">
                                            {unreadCounts.notifications}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
                    <button
                        onClick={logout}
                        className={clsx(
                            "w-full flex items-center gap-2 py-2 rounded-lg text-xs font-bold transition border group",
                            collapsed ? "justify-center px-0 bg-red-500/10 text-red-500 border-red-500/20" : "px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-red-500/20"
                        )}
                    >
                        <FaRightFromBracket className="shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
