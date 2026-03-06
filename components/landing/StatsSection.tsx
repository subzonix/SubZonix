"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FaUsers, FaChartLine, FaBell, FaRocket } from "react-icons/fa6";

// Animated count-up hook
function useCountUp(target: number, duration = 2000, active = false) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!active) return;
        let start: number | null = null;
        const raf = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }, [active, target, duration]);
    return val;
}

const stats = [
    {
        icon: FaUsers,
        target: 500,
        suffix: "+",
        label: "Active Resellers",
        sub: "Trust SubZonix daily",
        color: "indigo",
        gradient: "from-indigo-500 to-blue-600",
    },
    {
        icon: FaChartLine,
        target: 98,
        suffix: "%",
        label: "Profit Accuracy",
        sub: "Real-time calculation",
        color: "violet",
        gradient: "from-violet-500 to-purple-600",
    },
    {
        icon: FaBell,
        target: 0,
        suffix: "",
        label: "Missed Renewals",
        sub: "With auto-reminders",
        color: "green",
        gradient: "from-green-500 to-emerald-600",
    },
    {
        icon: FaRocket,
        target: 10,
        suffix: "x",
        label: "Faster Operations",
        sub: "Compared to Excel",
        color: "amber",
        gradient: "from-amber-500 to-orange-600",
    },
];

function Stat({ s, index }: { s: typeof stats[0]; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    const count = useCountUp(s.target, 1800, inView);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12, duration: 0.5 }}
            className="relative group flex flex-col items-center text-center p-1"
        >
            {/* Icon circle */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                <s.icon className="text-2xl text-white" />
            </div>

            {/* Big number */}
            <div className={`text-5xl md:text-6xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-br ${s.gradient} leading-none mb-2`}>
                {count}{s.suffix}
            </div>

            {/* Label */}
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                {s.label}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{s.sub}</p>

            {/* Divider for desktop layout */}
            {index < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-10 w-px h-20 bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent" />
            )}
        </motion.div>
    );
}

export default function StatsSection() {
    return (
        <section className="py-20 bg-white dark:bg-background relative overflow-hidden transition-colors duration-500 border-y border-slate-100 dark:border-white/5">
            {/* Subtle BG */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_50%,rgba(99,102,241,0.04),transparent)] pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {/* Section label */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-12"
                >
                    ✦ &nbsp; By The Numbers &nbsp; ✦
                </motion.p>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4">
                    {stats.map((s, i) => <Stat key={i} s={s} index={i} />)}
                </div>

                {/* Bottom trust bar */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
                >
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        🌍 Trusted by resellers in
                    </p>
                    <div className="flex items-center gap-2">
                        {[
                            { flag: "🇵🇰", country: "Pakistan" },
                            { flag: "🇮🇳", country: "India" },
                            { flag: "🇧🇩", country: "Bangladesh" },
                            { flag: "🇻🇳", country: "Vietnam" },
                            { flag: "🇰🇷", country: "Korea" },
                        ].map((c, i) => (

                            <span
                                key={i}
                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                            >
                                {c.flag} {c.country}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
