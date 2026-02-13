"use client";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa6";
import LazyImage from "@/components/ui/LazyImage";
import ParallaxSection from "@/components/ui/ParallaxSection";
import { useAuth } from "@/context/AuthContext";

const testimonials = [
    {
        quote:
            "SubZonix transformed how I manage reselling — no more spreadsheets and instant expiry reminders.",
        name: "Alex Rivera",
        title: "Digital Reseller",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        isSample: true,
    },
    {
        quote:
            "Shared-cost tracking and profit calculation made my workflow faster and more reliable.",
        name: "Sarah Chen",
        title: "Software Vendor",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face",
        isSample: true,
    },
    {
        quote:
            "Clean UI, fast workflow, and expiry reminders that actually keep me organized.",
        name: "Marcus Johnson",
        title: "Tech Entrepreneur",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        isSample: true,
    },
    {
        quote:
            "Inventory and customer history in one place makes my day-to-day selling much easier.",
        name: "Emily Davis",
        title: "SaaS Reseller",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        isSample: true,
    },
];

export default function TestimonialsSection() {
    const { brandDisclaimer } = useAuth();
    const hasSample = testimonials.some(t => t.isSample);

    return (
        <ParallaxSection speed={0.3} className="py-24 bg-slate-50 dark:bg-black relative overflow-hidden transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-slate-900 rounded-full mb-6 shadow-lg shadow-indigo-500/30"
                    >
                        <FaQuoteLeft className="text-white text-xl" />
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                        Loved by Resellers
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our community has to say about {useAuth().appName || "SubZonix"}.
                    </p>
                </motion.div>

                <div className="relative flex flex-col items-center justify-center overflow-hidden">
                    <InfiniteMovingCards
                        items={testimonials}
                        direction="right"
                        speed="slow"
                        className="bg-transparent"
                    />
                    {(hasSample || !!brandDisclaimer) && (
                        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                            {hasSample && (
                                <div>Note: Some testimonials are sample content for demo purposes.</div>
                            )}
                            {!!brandDisclaimer && (
                                <div>{brandDisclaimer}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ParallaxSection>
    );
}
