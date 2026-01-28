"use client";

import { FaToolbox, FaCloud, FaUsers, FaLock, FaChartLine, FaBell } from "react-icons/fa6";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const logos = [
    { icon: FaToolbox, name: "Subscriptions" },
    { icon: FaUsers, name: "Shared Accounts" },
    { icon: FaBell, name: "Expiry Alerts" },
    { icon: FaChartLine, name: "Profit Tracking" },
    { icon: FaLock, name: "Secure Access" },
    { icon: FaCloud, name: "Cloud Sync" },
];

export default function LogoMarquee() {
    return (
        <div className="py-10 bg-white dark:bg-black border-y border-slate-100 dark:border-white/5 overflow-hidden transition-colors duration-500 relative flex flex-col items-center justify-center antialiased">
            <div className="max-w-7xl mx-auto px-6 mb-6 text-center z-10">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Popular Tools Managed</p>
            </div>
            <InfiniteMovingCards
                items={logos}
                direction="right"
                speed="slow"
                className="bg-transparent"
            />
        </div>
    );
}
