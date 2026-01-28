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
        <section id="features" className="scroll-mt-32 py-32 bg-slate-50 dark:bg-black px-6 relative overflow-hidden transition-colors duration-500">
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
                        Everything You Need.
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
        icon: <FaDesktop className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
    {
        title: "Smart Analytics",
        description: "Deep insights into your sales, profits, and growth.",
        header: <FeatureImage src="/screenshots/analytics.png" alt="Smart Analytics" />,
        icon: <FaUsers className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
    {
        title: "Expiry Reminders",
        description: "Automated alerts to ensure never miss a renewal.",
        header: <FeatureImage src="/screenshots/sale1.png" alt="Expiry Reminders" />,
        icon: <FaBell className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
    {
        title: "Sub Mart",
        description: "One-click ordering for premium digital tools.",
        header: <FeatureImage src="/screenshots/mart.png" alt="Sub Mart" />,
        icon: <FaBoxOpen className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
    {
        title: "Purchase History",
        description: "Complete track record of every sale and transaction.",
        header: <FeatureImage src="/screenshots/history.png" alt="Purchase History" />,
        icon: <FaClockRotateLeft className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
    {
        title: "Settings & Branding",
        description: "Customize your dashboard name, colors, and logo.",
        header: <FeatureImage src="/screenshots/settings.png" alt="Settings & Branding" />,
        icon: <FaLock className="h-4 w-4 text-slate-500 dark:text-slate-300" />,
    },
];
