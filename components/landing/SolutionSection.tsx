"use client";

import { motion } from "framer-motion";
import { FaBolt, FaArrowRight, FaCircleCheck as FaCheckCircle } from "react-icons/fa6";
import Link from "next/link";

export default function SolutionSection() {
    const features = [
        { text: "Automated Expiry Tracking", color: "text-indigo-600 dark:text-indigo-400" },
        { text: "Shared Tool Cost-Splitting", color: "text-violet-600 dark:text-violet-400" },
        { text: "Instant Profit Calculation", color: "text-green-600 dark:text-green-400" },
        { text: "Secure Customer History", color: "text-amber-600 dark:text-amber-400" },
    ];

    return (
        <section className="py-28 bg-white dark:bg-background relative overflow-hidden transition-colors duration-500">
            {/* BG blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                {/* Left: Text */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-200 dark:border-indigo-500/20">
                        <FaBolt className="text-xs" /> The Solution
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-5 leading-tight">
                        One Dashboard.{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">
                            Total Control.
                        </span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed max-w-md">
                        Ditch the 5 different apps. See your inventory, expirations, and profits all in one clean dashboard.
                    </p>

                    <ul className="space-y-3 mb-10">
                        {features.map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -12 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                            >
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <FaCheckCircle className={`${item.color} text-sm`} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.text}</span>
                            </motion.li>
                        ))}
                    </ul>

                    <Link
                        href="#plans"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
                    >
                        Start Free <FaArrowRight className="text-xs" />
                    </Link>
                </motion.div>

                {/* Right: Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                >
                    <div className="relative aspect-[4/3] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col group">
                        {/* Window chrome */}
                        <div className="h-12 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center px-5 gap-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <div className="mx-3 flex-1 h-6 bg-slate-100 dark:bg-white/5 rounded-full" />
                        </div>

                        {/* Mock content */}
                        <div className="flex flex-1 gap-0 overflow-hidden">
                            {/* Sidebar mock */}
                            <div className="w-[22%] bg-slate-50 dark:bg-white/3 border-r border-slate-100 dark:border-white/5 p-3 flex flex-col gap-2">
                                {[60, 50, 70, 45, 55].map((w, i) => (
                                    <div key={i} className={`h-6 rounded-lg bg-${i === 0 ? 'indigo' : 'slate'}-${i === 0 ? '500' : '200'} dark:bg-${i === 0 ? 'indigo' : 'white'}/${i === 0 ? '60' : '5'} animate-pulse`} style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
                                ))}
                            </div>

                            {/* Main mock */}
                            <div className="flex-1 p-4 flex flex-col gap-3">
                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { color: 'indigo', label: 'Revenue' },
                                        { color: 'green', label: 'Active' },
                                        { color: 'amber', label: 'Expiring' }
                                    ].map((s, i) => (
                                        <div key={i} className={`rounded-xl p-3 bg-${s.color}-50 dark:bg-${s.color}-500/10 border border-${s.color}-100 dark:border-${s.color}-500/15`}>
                                            <div className={`w-6 h-1.5 bg-${s.color}-400 rounded-full mb-2 animate-pulse`} />
                                            <div className={`w-10 h-3 bg-${s.color}-300/60 rounded-full animate-pulse`} />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart mock */}
                                <div className="flex-1 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3 relative overflow-hidden">
                                    <div className="flex items-end gap-1.5 h-full pt-6 pb-1">
                                        {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                                            <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500/60 to-violet-500/30 animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Table mock */}
                                <div className="flex flex-col gap-1.5">
                                    {[90, 75, 60].map((w, i) => (
                                        <div key={i} className="h-6 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute bottom-5 right-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transform rotate-[-2deg] group-hover:rotate-0 transition-transform duration-300">
                            ⚡ Live Automation
                        </div>
                    </div>

                    {/* Glow */}
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl -z-10 scale-90 rounded-3xl" />
                </motion.div>
            </div>
        </section>
    );
}
