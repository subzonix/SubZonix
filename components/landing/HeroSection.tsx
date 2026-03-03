"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { InteractiveButton } from "@/components/ui/InteractiveButton";
import { motion } from "framer-motion";
import { FaShieldHalved, FaUsers, FaChartLine } from "react-icons/fa6";

export default function HeroSection() {
    return (
        <div id="home">
            <HeroGeometric
                badge="Enterprise-Grade Management"
                title1="Grow your subscription business with"
                title2="SubZonix"
                description="Track customers, expiry dates, renewals, and profits — all in one powerful dashboard built for subscription sellers."
            >
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-white/40 mb-8 leading-relaxed font-medium dark:font-light tracking-wide max-w-6xl mx-auto px-4 -mt-4"
                >
                    Stop managing subscriptions in Excel and WhatsApp manually. <br className="hidden md:block" />
                    Run your business professionally with SubZonix.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <InteractiveButton href="#plans" variant="primary">
                        Start Free Trial
                    </InteractiveButton>
                    <InteractiveButton href="/how-it-works?play=1" variant="secondary">
                        Watch Demo
                    </InteractiveButton>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10"
                >
                    {[
                        { icon: FaShieldHalved, label: "Secure & Private" },
                        { icon: FaUsers, label: "Multi-User Support" },
                        { icon: FaChartLine, label: "Real-Time Profits" },
                    ].map((badge, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-500 dark:text-white/30 text-sm font-semibold">
                            <badge.icon className="text-indigo-500 text-base" />
                            <span>{badge.label}</span>
                        </div>
                    ))}
                </motion.div>
            </HeroGeometric>
        </div>
    );
}
