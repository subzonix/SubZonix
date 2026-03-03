"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaYoutube } from "react-icons/fa6";
import VideoModal from "@/components/ui/VideoModal";

const steps = [
    {
        no: "01",
        title: "Setup Inventory",
        desc: "Add your tools and accounts. Set purchase costs and selling prices once — let SubZonix track inventory automatically.",
        color: "from-indigo-500 to-blue-600",
        shadow: "shadow-indigo-500/25",
        lightBg: "bg-indigo-50 dark:bg-indigo-500/10",
        lightBorder: "border-indigo-200 dark:border-indigo-500/20",
    },
    {
        no: "02",
        title: "Assign Access",
        desc: "Link tools to customers instantly. Record every sale and keep a clean history of who uses which account.",
        color: "from-violet-500 to-purple-600",
        shadow: "shadow-violet-500/25",
        lightBg: "bg-violet-50 dark:bg-violet-500/10",
        lightBorder: "border-violet-200 dark:border-violet-500/20",
    },
    {
        no: "03",
        title: "Automate Alerts",
        desc: "Stay ahead of expirations. Automatic renewal reminders keep your customers happy and your revenue consistent.",
        color: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/25",
        lightBg: "bg-amber-50 dark:bg-amber-500/10",
        lightBorder: "border-amber-200 dark:border-amber-500/20",
    },
    {
        no: "04",
        title: "Scale Fast",
        desc: "Track net profits in real-time and manage your entire reselling business from one powerful dashboard.",
        color: "from-green-500 to-emerald-600",
        shadow: "shadow-green-500/25",
        lightBg: "bg-green-50 dark:bg-green-500/10",
        lightBorder: "border-green-200 dark:border-green-500/20",
    }
];

export default function HowItWorks() {
    const [videoOpen, setVideoOpen] = useState(false);
    const YOUTUBE_VIDEO_ID = "y8mHzXid0oI";

    return (
        <section className="py-28 bg-slate-50 dark:bg-card border-y border-slate-100 dark:border-white/5 relative overflow-hidden transition-colors duration-500">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(99,102,241,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-200 dark:border-indigo-500/20">
                        How It Works
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                        Up & running in{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">
                            4 simple steps
                        </span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                        Get your subscription business fully automated in minutes, not months.
                    </p>
                </motion.div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {/* Dashed connector – desktop only */}
                    <div className="hidden lg:block absolute top-10 left-[7%] right-[20%] h-px border-t-2 border-dashed border-slate-200 dark:border-white/10 -z-10" />

                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.12, duration: 0.5 }}
                            whileHover={{ y: -4 }}
                            className="flex flex-col items-center lg:items-start text-center lg:text-left group"
                        >
                            {/* Step circle */}
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-xl ${step.shadow} group-hover:scale-105 transition-transform duration-300`}>
                                <span className="text-2xl font-black text-white">{step.no}</span>
                            </div>

                            {/* Content card */}
                            <div className={`rounded-2xl p-5 ${step.lightBg} border ${step.lightBorder} w-full`}>
                                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{step.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Watch Demo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-14 flex justify-center"
                >
                    <button
                        onClick={() => setVideoOpen(true)}
                        className="flex items-center gap-4 px-7 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 group hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                            <FaYoutube size={20} />
                        </div>
                        <div className="text-left">
                            <span className="block text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Watch Demo</span>
                            <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium">See SubZonix in 2 minutes</span>
                        </div>
                    </button>
                </motion.div>
            </div>

            <VideoModal
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                title="SubZonix Demo"
                youtubeVideoId={YOUTUBE_VIDEO_ID}
            />
        </section>
    );
}
