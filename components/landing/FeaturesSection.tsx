"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
    FaBoxOpen,
    FaUsers,
    FaBell,
    FaClockRotateLeft,
    FaLock,
    FaDesktop,
} from "react-icons/fa6";
import { motion } from "framer-motion";

export default function FeaturesSection() {
    return (
        <section id="features" className="scroll-mt-32 py-32 bg-slate-50 dark:bg-background px-6 relative overflow-hidden transition-colors duration-500">
            {/* Background decor */}
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-200 dark:border-indigo-500/20">
                        Features
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
                        Everything You{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">
                            Need.
                        </span>
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-xl max-w-2xl mx-auto uppercase tracking-widest font-bold">
                        Everything you need to manage your digital reselling empire in one place.
                    </p>
                </motion.div>

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
    );
}

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
        title: "Message Templates",
        description: "Create and save custom templates for renewals, payments, and receipts.",
        header: <FeatureImage src="/screenshots/sale1.png" alt="Message Templates" />,
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
