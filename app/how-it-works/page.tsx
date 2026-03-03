"use client";

import { motion } from "framer-motion";
import { FaPlus, FaUserPlus, FaChartLine, FaYoutube, FaUsers, FaCircleCheck as FaCheckCircle, FaRocket, FaShieldHalved } from "react-icons/fa6";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import VideoModal from "@/components/ui/VideoModal";
import { useState, Suspense } from "react";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";
import Link from "next/link";

const steps = [
    {
        id: "01",
        title: "Setup Your Inventory",
        desc: "Add your tools, accounts, and subscriptions. Define your purchase costs and selling prices. Our system automatically tracks stock levels as you sell.",
        icon: FaPlus,
        color: "from-indigo-500 to-blue-600",
        benefits: ["Single-click entry", "Bulk import support", "Secure credential storage"]
    },
    {
        id: "02",
        title: "Manage Your Customers",
        desc: "Build a professional customer database. Assign tool access instantly with automated credential delivery and history tracking for every user.",
        icon: FaUserPlus,
        color: "from-violet-500 to-purple-600",
        benefits: ["Automated assignments", "Purchase history", "WhatsApp integration"]
    },
    {
        id: "03",
        title: "Automate Expiry Alerts",
        desc: "Never lose a customer to a missed renewal. The system tracks every subscription expiry and sends automatic reminders to you and your clients.",
        icon: FaChartLine,
        color: "from-amber-500 to-orange-600",
        benefits: ["3-day & 1-day alerts", "Custom reminder text", "Higher retention rate"]
    },
    {
        id: "04",
        title: "Scalability & Reports",
        desc: "Get crystal clear insights into your net profits, top-selling tools, and staff performance. Scale your empire without the manual headache.",
        icon: FaUsers,
        color: "from-green-500 to-emerald-600",
        benefits: ["Profit/Loss reports", "Staff permissions", "Multi-device access"]
    }
];

export default function HowItWorks() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <HowItWorksContent />
        </Suspense>
    );
}

function HowItWorksContent() {
    const [videoOpen, setVideoOpen] = useState(false);
    const YOUTUBE_VIDEO_ID = "y8mHzXid0oI";

    return (
        <div className="min-h-screen bg-white dark:bg-background transition-colors duration-500 overflow-x-hidden">
            <CustomCursor />
            <LandingNavbar />

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest"
                    >
                        <FaRocket className="text-xs" /> Seamless Automation
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
                    >
                        Success in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">4 Simple Steps</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
                    >
                        Stop the manual Excel grind. SubZonix automates your inventory, customers, and renewals so you can focus on scaling your profits.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => setVideoOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl"
                        >
                            <FaYoutube className="text-xl" /> Watch Demo
                        </button>
                        <Link
                            href="/#plans"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl shadow-indigo-500/25"
                        >
                            Get Started Now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="space-y-32">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`flex flex-col ${idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-16 items-center`}
                        >
                            {/* Visual Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="flex-1 w-full"
                            >
                                <div className="relative group">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity`} />
                                    <div className="relative aspect-video bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group-hover:border-indigo-500/30 transition-all">
                                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                            <step.icon className="text-4xl" />
                                        </div>
                                        {/* Mockup lines */}
                                        <div className="absolute inset-x-8 bottom-8 h-1/2 flex flex-col gap-3">
                                            <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                                            <div className="h-4 w-1/2 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                                            <div className="h-4 w-full bg-indigo-500/10 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="absolute top-6 left-6 w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center font-black text-xl text-slate-900 dark:text-white shadow-lg">
                                        {step.id}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Content Side */}
                            <motion.div
                                initial={{ opacity: 0, x: idx % 2 === 0 ? 20 : -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex-1"
                            >
                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                    {step.title}
                                </h2>
                                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                    {step.desc}
                                </p>
                                <ul className="space-y-4">
                                    {step.benefits.map((b, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold">
                                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                                                <FaCheckCircle className="text-green-500 text-xs" />
                                            </div>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <SectionCursorGlow>
                <section className="py-32 px-6">
                    <div className="max-w-5xl mx-auto rounded-[3rem] bg-indigo-600 dark:bg-indigo-500 p-12 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />

                        <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to scale your business?</h2>
                        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto relative z-10">
                            Join over 500+ successful resellers who automated their operations with SubZonix.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <Link
                                href="/#plans"
                                className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full sm:w-auto px-10 py-5 bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-800 transition-colors"
                            >
                                Contact Sales
                            </Link>
                        </div>
                        <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-widest">
                            Built with ❤️ for serious digital resellers
                        </p>
                    </div>
                </section>
            </SectionCursorGlow>

            <Footer />

            <VideoModal
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                title="SubZonix Full Demo"
                youtubeVideoId={YOUTUBE_VIDEO_ID}
            />
        </div>
    );
}
