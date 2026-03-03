"use client";

import { motion } from "framer-motion";
import { FaFileExcel, FaWhatsapp, FaClock, FaMoneyBillWave, FaTriangleExclamation } from "react-icons/fa6";

const pains = [
    {
        icon: FaFileExcel,
        title: "Excel Chaos",
        desc: "Spreadsheets crash, formulas break, data goes missing — and a single wrong cell can wipe your sales history.",
        color: "from-red-500 to-rose-600",
        glow: "shadow-red-500/20",
        bg: "from-red-500/8 to-rose-500/5",
        border: "border-red-500/20",
        tag: "Time Waster",
        tagColor: "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400",
        delay: 0.1
    },
    {
        icon: FaWhatsapp,
        title: "Manual Follow-ups",
        desc: "Sending 50 WhatsApp reminders by hand every month wastes hours and you still miss customers.",
        color: "from-green-500 to-emerald-600",
        glow: "shadow-green-500/20",
        bg: "from-green-500/8 to-emerald-500/5",
        border: "border-green-500/20",
        tag: "Energy Drain",
        tagColor: "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400",
        delay: 0.2
    },
    {
        icon: FaClock,
        title: "Missed Renewals",
        desc: "One forgotten renewal = one lost customer. No system means inconsistent revenue and angry clients.",
        color: "from-amber-500 to-orange-600",
        glow: "shadow-amber-500/20",
        bg: "from-amber-500/8 to-orange-500/5",
        border: "border-amber-500/20",
        tag: "Lost Revenue",
        tagColor: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        delay: 0.3
    },
    {
        icon: FaMoneyBillWave,
        title: "Hidden Profit Leaks",
        desc: "Without real-time tracking, shared costs are split wrong and your actual margin stays a mystery.",
        color: "from-indigo-500 to-blue-600",
        glow: "shadow-indigo-500/20",
        bg: "from-indigo-500/8 to-blue-500/5",
        border: "border-indigo-500/20",
        tag: "Profit Killer",
        tagColor: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        delay: 0.4
    }
];

export default function PainPoints() {
    return (
        <section className="py-28 bg-white dark:bg-background relative overflow-hidden transition-colors duration-500">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(239,68,68,0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(239,68,68,0.08),transparent)] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-red-400/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 mb-6 border border-red-200 dark:border-red-500/20">
                        <FaTriangleExclamation className="text-xs" /> The Problem
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-5 tracking-tight leading-tight">
                        Still managing your business<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                            the hard way?
                        </span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                        Every minute spent on manual tasks is money left on the table. Here's what's holding you back.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {pains.map((pain, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: pain.delay, duration: 0.5 }}
                            whileHover={{ y: -6 }}
                            className={`relative group overflow-hidden rounded-3xl border ${pain.border} bg-gradient-to-br ${pain.bg} p-7 transition-all duration-300 hover:shadow-2xl ${pain.glow}`}
                        >
                            {/* Corner glow */}
                            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${pain.color} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity duration-500`} />

                            {/* Tag */}
                            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-5 ${pain.tagColor} border ${pain.border}`}>
                                {pain.tag}
                            </span>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pain.color} flex items-center justify-center mb-5 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <pain.icon className="text-xl" />
                            </div>

                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">{pain.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {pain.desc}
                            </p>

                            {/* Bottom accent */}
                            <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${pain.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl`} />
                        </motion.div>
                    ))}
                </div>

                {/* Divider callout */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-semibold">
                        Sound familiar? <span className="text-indigo-600 dark:text-indigo-400 font-black">SubZonix fixes all of it →</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
