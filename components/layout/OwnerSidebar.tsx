"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaChartPie, FaBell, FaRightFromBracket, FaGem, FaChartLine, FaUsers, FaGear, FaHeadset } from "react-icons/fa6";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/owner", icon: FaChartPie },
    { label: "User Management", href: "/owner/users", icon: FaUsers },
    { label: "Plans Management", href: "/owner/plans", icon: FaGem },
    { label: "Vendor Directory", href: "/owner/vendors", icon: FaUsers },
    { label: "Support Queries", href: "/owner/support", icon: FaHeadset },
    { label: "Advanced Analytics", href: "/owner/analytics", icon: FaChartLine },
    { label: "Settings", href: "/owner/settings", icon: FaGear },
    { label: "Notifications", href: "/owner/notifications", icon: FaBell },
];

export default function OwnerSidebar({ mobileOpen, setMobileOpen, collapsed }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void, collapsed?: boolean }) {
    const pathname = usePathname();
    const { logout } = useAuth();

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
                    "fixed top-0 left-0 bottom-0 bg-[#0f172a] border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 overflow-hidden",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className={clsx("h-16 flex items-center border-b border-slate-800 transition-all duration-300", collapsed ? "px-0 justify-center" : "px-6")}>
                    <div className={clsx("font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent truncate uppercase italic", collapsed ? "text-xl" : "text-xl")}>
                        {collapsed ? "OP" : "OWNER PANEL"}
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
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
                                pathname === item.href ? "bg-amber-500/20 text-amber-500 shadow-lg ring-1 ring-amber-500/30" : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700/50"
                            )}>
                                <item.icon className="text-sm" />
                            </div>
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="truncate"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
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
