"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { InteractiveButton } from "@/components/ui/InteractiveButton";
import { motion } from "framer-motion";

export default function HeroSection() {
    return (
        <div id="home">
            <HeroGeometric
                badge="Enterprise-Grade Management"
                title1="Grow your subscription business with"
                title2="SubZonix"
                description="Track customers, expiry dates, renewals, and profits — all in one powerful dashboard built for subscription sellers."
            >
                <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-white/40 mb-8 leading-relaxed font-medium dark:font-light tracking-wide max-w-6xl mx-auto px-4 -mt-4">
                    Stop managing subscriptions in Excel and WhatsApp manually. <br className="hidden md:block" />
                    Run your business professionally with SubZonix.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <InteractiveButton href="#plans" variant="primary">
                        Start Free Trial
                    </InteractiveButton>
                    <InteractiveButton href="/how-it-works?play=1" variant="secondary">
                        Watch Demo
                    </InteractiveButton>
                </div>
            </HeroGeometric>
        </div>
    );
}
