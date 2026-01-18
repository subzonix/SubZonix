"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FaChartPie, FaCirclePlus, FaClockRotateLeft, FaUserClock,
    FaShopLock, FaList, FaChartLine, FaGear, FaRightFromBracket,
    FaFileCsv, FaBoxesStacked, FaShop, FaMessage, FaUserGroup
} from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { useSales } from "@/context/SalesContext";
import clsx from "clsx";

const NAV_ITEMS = [
    // { header: "CORE" },
    { label: "Dashboard", href: "/dashboard", icon: FaChartPie },
    { label: "New Sale", href: "/dashboard/new-sale", icon: FaCirclePlus },
    { label: "Expiry Alerts", href: "/dashboard/expiry", icon: FaClockRotateLeft, badge: "expiry" },
    { header: "FINANCE" },
    { label: "Client Pending", href: "/dashboard/pending", icon: FaUserClock, badge: "clientPending" },
    { label: "Vendors", href: "/dashboard/vendors", icon: FaBuilding, badge: "vendorDue" },
    { label: "Inventory", href: "/dashboard/inventory", icon: FaBoxesStacked },
    { header: "E-COMMERCE" },
    { label: "Mart", href: "/dashboard/shop", icon: FaShop },
    { header: "RECORDS" },
    { label: "Sales History", href: "/dashboard/history", icon: FaList },
    { label: "Customers", href: "/dashboard/customers", icon: FaUserGroup },
    { label: "Analytics", href: "/dashboard/analytics", icon: FaChartLine },
    { header: "SYSTEM" },
    { label: "Settings", href: "/dashboard/settings", icon: FaGear },
];

import { motion } from "framer-motion";
import { FaUserShield, FaBuilding } from "react-icons/fa6"; // Import admin icon
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";

// ... NAV_ITEMS ...

export default function Sidebar({ mobileOpen, setMobileOpen, collapsed }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void, collapsed?: boolean }) {
    const pathname = usePathname();
    const { counts } = useSales();
    const { role, planFeatures, appName, appLogoUrl } = useAuth(); // Get user role, features and branding

    return (
        <>
            <motion.aside
                initial={false}
                animate={{
                    width: mobileOpen ? 280 : (collapsed ? 80 : 256),
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 150, damping: 20 }}
                className={clsx(
                    "fixed md:static inset-y-0 left-0 z-50 bg-slate-900 text-slate-100 flex flex-col shadow-2xl overflow-hidden md:translate-x-0 transition-[transform] duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className={clsx("py-6 border-b border-slate-800 transition-all duration-300", collapsed ? "px-0 flex justify-center" : "px-5")}>
                    <div className="flex items-center gap-3">
                        {appLogoUrl ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                                <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-indigo-500/20">
                                <span className="font-bold text-white uppercase italic text-lg">{appName?.[0]}</span>
                            </div>
                        )}
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex-1 overflow-hidden whitespace-nowrap"
                            >
                                <div className="text-sm font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{appName}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{role === 'owner' ? 'Owner Panel' : 'User Panel'}</div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className={clsx("flex-1 overflow-y-auto py-6 space-y-1.5 custom-scrollbar transition-all duration-300", collapsed ? "px-2" : "px-4")}>
                    {NAV_ITEMS.map((item, idx) => {
                        if (item.header) {
                            if (collapsed) return <div key={idx} className="h-px bg-slate-800/50 my-2 mx-4" />;
                            return (
                                <div key={idx} className="mt-2 mb-2 text-[10px] uppercase tracking-widest text-slate-600 px-2 font-black">
                                    {item.header}
                                </div>
                            );
                        }

                        const Icon = item.icon!;
                        const isActive = pathname === item.href;

                        // Badge Logic
                        let badgeValue = 0;
                        let badgeColor = "";

                        if (item.badge === "expiry") {
                            badgeValue = counts.expiry;
                            badgeColor = "bg-rose-500 text-white";
                        } else if (item.badge === "clientPending") {
                            badgeValue = counts.clientPending;
                            badgeColor = "bg-amber-400 text-black";
                        } else if (item.badge === "vendorDue") {
                            badgeValue = counts.vendorDue;
                            badgeColor = "bg-rose-600 text-white";
                        }

                        // Feature Guard Check
                        const featureMap: Record<string, string> = {
                            "/dashboard": "dashboard",
                            "/dashboard/new-sale": "newSale",
                            "/dashboard/expiry": "expiry",
                            "/dashboard/pending": "pending",
                            "/dashboard/vendors": "vendors",
                            "/dashboard/inventory": "inventory",
                            "/dashboard/history": "history",
                            "/dashboard/customers": "customers",
                            "/dashboard/analytics": "analytics",
                            "/dashboard/settings": "settings"
                        };

                        const featureKey = featureMap[item.href!];

                        if (role !== "owner" && featureKey && planFeatures && (planFeatures as any)[featureKey] === false) {
                            return null;
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                                className={clsx(
                                    "flex items-center gap-3 py-3 rounded-2xl text-[13px] transition-all duration-200 group relative",
                                    collapsed ? "justify-center px-0" : "px-3",
                                    isActive
                                        ? "bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                                )}
                            >
                                <Icon className={clsx("w-4 h-4 transition-colors shrink-0", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                                {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 truncate">{item.label}</motion.span>}
                                {!collapsed && badgeValue > 0 && (
                                    <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-lg font-black min-w-[18px] text-center shadow-sm", badgeColor)}>
                                        {badgeValue}
                                    </span>
                                )}
                                {collapsed && badgeValue > 0 && (
                                    <span className={clsx("absolute top-2 right-2 w-2 h-2 rounded-full", badgeColor.split(' ')[0])} />
                                )}
                            </Link>
                        );
                    })}

                    {/* Admin Link Removed - Owner has separate layout */}
                </nav>

                {/* Footer Area */}
                <div className="p-4 border-t border-slate-800 space-y-4">
                    <div className="text-center">
                        {!collapsed && <div className="text-[8px] text-slate-600 uppercase tracking-[0.2em] font-black mb-1">Infrastructure</div>}
                        <div className={clsx("flex items-center justify-center gap-1.5", collapsed && "flex-col")}>
                            {!collapsed && <span className="text-[10px] text-slate-400 font-medium">Powered by</span>}
                            <span className={clsx("text-[10px] text-indigo-500 font-black tracking-tight", collapsed && "text-[8px]")}>{appName}</span>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}
