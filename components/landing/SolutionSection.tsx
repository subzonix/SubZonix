"use client";

import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

export default function SolutionSection() {
    return (
        <section className="py-32 bg-background relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                        One Dashboard. <br />
                        <span className="text-primary">Total Control.</span>
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        Ditch the 5 different apps. See your inventory, expirations, and profits in one simple dashboard.
                    </p>

                    <ul className="space-y-4">
                        {[
                            "Automated Expiry Tracking",
                            "Shared Tool Cost-Splitting",
                            "Instant Profit Calculation",
                            "Secure Customer History"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                                <FaCheckCircle className="text-primary text-lg" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    {/* Abstract Dashboard Placeholder */}
                    <div className="relative aspect-video bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col">
                        {/* Fake Header */}
                        <div className="h-12 border-b border-border bg-secondary/50 flex items-center px-6 gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400/80" />
                            <div className="w-3 h-3 rounded-full bg-indigo-400/80" />
                            <div className="w-3 h-3 rounded-full bg-slate-600/80" />
                        </div>
                        {/* Fake Content */}
                        <div className="p-6 flex-1 flex gap-6">
                            <div className="w-1/4 bg-secondary/50 rounded-2xl h-full animate-pulse opacity-50" />
                            <div className="w-3/4 flex flex-col gap-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-secondary/50 rounded-2xl" />
                                    <div className="h-24 bg-secondary/50 rounded-2xl" />
                                    <div className="h-24 bg-secondary/50 rounded-2xl" />
                                </div>
                                <div className="flex-1 bg-secondary/50 rounded-2xl" />
                            </div>
                        </div>

                        {/* Overlay Badge */}
                        <div className="absolute bottom-6 right-6 bg-foreground text-background px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl transform rotate-[-2deg]">
                            Live Automation
                        </div>
                    </div>

                    {/* Glow behind */}
                    <div className="absolute inset-0 bg-primary/10 blur-3xl -z-10 transform scale-95" />
                </motion.div>
            </div>
        </section>
    );
}
