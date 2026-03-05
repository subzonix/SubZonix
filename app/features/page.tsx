"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { FaBoxOpen, FaUsers, FaBell, FaClockRotateLeft, FaLock, FaDesktop, FaRocket, FaArrowRight } from "react-icons/fa6";
import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const FeatureImage = ({ src, alt }: { src: string; alt: string }) => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group">
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
    </div>
);

const items = [
    {
        title: "Clean Dashboard",
        description: "Fast, simple, and high-performance business hub.",
        header: <FeatureImage src="/screenshots/dashboard.png" alt="Clean Dashboard" />,
        icon: <FaDesktop className="h-4 w-4 text-indigo-500" />,
    },
    {
        title: "Smart Analytics",
        description: "Deep insights into your sales, profits, and growth.",
        header: <FeatureImage src="/screenshots/analytics.png" alt="Smart Analytics" />,
        icon: <FaUsers className="h-4 w-4 text-violet-500" />,
    },
    {
        title: "Expiry Reminders",
        description: "Automated alerts to ensure you never miss a renewal.",
        header: <FeatureImage src="/screenshots/sale1.png" alt="Expiry Reminders" />,
        icon: <FaBell className="h-4 w-4 text-amber-500" />,
    },
    {
        title: "Sub Mart",
        description: "One-click ordering for premium digital tools.",
        header: <FeatureImage src="/screenshots/mart.png" alt="Sub Mart" />,
        icon: <FaBoxOpen className="h-4 w-4 text-green-500" />,
    },
    {
        title: "Purchase History",
        description: "Complete track record of every sale and transaction.",
        header: <FeatureImage src="/screenshots/history.png" alt="Purchase History" />,
        icon: <FaClockRotateLeft className="h-4 w-4 text-rose-500" />,
    },
    {
        title: "Settings & Branding",
        description: "Customize your dashboard name, colors, and logo.",
        header: <FeatureImage src="/screenshots/settings.png" alt="Settings & Branding" />,
        icon: <FaLock className="h-4 w-4 text-slate-500" />,
    },
];

export default function FeaturesPage() {
    const { plansEnabled } = useAuth();
    return (
        <div className="min-h-screen bg-white dark:bg-background transition-colors duration-500">
            <CustomCursor />
            <LandingNavbar />

            {/* Hero */}
            <section className="pt-44 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.07),transparent_50%)] pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest"
                    >
                        <FaRocket className="text-xs" /> Platform Features
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
                    >
                        Everything You{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">Need.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
                    >
                        Manage your entire digital reselling empire from one powerful dashboard — inventory, customers, renewals, and profits.
                    </motion.p>
                </div>
            </section>

            {/* Features Bento Grid */}
            <SectionCursorGlow>
                <section id="features" className="py-16 px-6 bg-slate-50 dark:bg-background relative overflow-hidden transition-colors duration-500">
                    <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="max-w-7xl mx-auto relative z-10">
                        <BentoGrid className="max-w-4xl mx-auto">
                            {items.map((item, i) => (
                                <BentoGridItem
                                    key={i}
                                    title={item.title}
                                    description={item.description}
                                    header={item.header}
                                    icon={item.icon}
                                    className={i === 0 || i === 3 || i === 4 ? "md:col-span-2" : ""}
                                />
                            ))}
                        </BentoGrid>
                    </div>
                </section>
            </SectionCursorGlow>

            {/* CTA */}
            <section className="py-28 px-6">
                <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-14 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
                    <h2 className="text-3xl md:text-5xl font-black mb-5 relative z-10">Ready to start?</h2>
                    <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto relative z-10">
                        Join 500+ resellers who automated their operations with SubZonix.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <Link
                            href={plansEnabled ? "/#plans" : "/login"}
                            className="w-full sm:w-auto px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                        >
                            {plansEnabled ? "View Pricing" : "Get Started"}
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-indigo-700/60 backdrop-blur text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-800 transition-colors"
                        >
                            How It Works <FaArrowRight className="text-xs" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
