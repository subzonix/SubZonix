"use client";

import { motion } from "framer-motion";
import {
    FaToolbox, FaCloud, FaUsers, FaLock, FaChartLine,
    FaBell, FaStore, FaMoneyBill, FaShieldHalved, FaBolt
} from "react-icons/fa6";

const features = [
    { icon: FaToolbox, name: "Subscriptions", color: "text-indigo-500" },
    { icon: FaUsers, name: "Shared Accounts", color: "text-violet-500" },
    { icon: FaBell, name: "Expiry Alerts", color: "text-amber-500" },
    { icon: FaChartLine, name: "Profit Tracking", color: "text-green-500" },
    { icon: FaLock, name: "Secure Access", color: "text-rose-500" },
    { icon: FaCloud, name: "Cloud Sync", color: "text-blue-500" },
    { icon: FaStore, name: "Sub Mart", color: "text-orange-500" },
    { icon: FaMoneyBill, name: "Revenue Reports", color: "text-emerald-500" },
    { icon: FaShieldHalved, name: "Data Protection", color: "text-purple-500" },
    { icon: FaBolt, name: "Automation", color: "text-yellow-500" },
];

export default function LogoMarquee() {
    return (
        <div className="relative py-10 bg-white dark:bg-background border-y border-slate-100 dark:border-white/5 overflow-hidden transition-colors duration-500">
            {/* Left & Right fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white dark:from-background to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white dark:from-background to-transparent z-10" />

            {/* Label */}
            <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 mb-6"
            >
                ✦ &nbsp; Everything Your Business Needs &nbsp; ✦
            </motion.p>

            {/* Scrolling track */}
            <div className="flex overflow-hidden">
                <div className="flex animate-marquee gap-6 whitespace-nowrap">
                    {[...features, ...features].map((f, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all duration-300 hover:shadow-md group shrink-0"
                        >
                            <f.icon className={`text-lg ${f.color} group-hover:scale-110 transition-transform duration-300`} />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{f.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
