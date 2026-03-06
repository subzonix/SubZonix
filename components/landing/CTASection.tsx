"use client";

import { motion } from "framer-motion";
import { FaArrowRight, FaRocket, FaStar, FaFire } from "react-icons/fa6";
import Link from "next/link";

interface CTASectionProps {
    plansEnabled?: boolean | null;
}

export default function CTASection({ plansEnabled = true }: CTASectionProps) {
    return (
        <section className="py-28 relative overflow-hidden bg-white dark:bg-background transition-colors duration-500">
            {/* Layered background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/30 dark:via-background dark:to-violet-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]" />

            {/* Orbs */}
            <div className="absolute top-1/4 left-1/6 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/6 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Badge - hidden when plans disabled */}
                    {plansEnabled && (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-200 dark:border-indigo-500/20">
                            <FaFire className="text-orange-500 text-xs" /> Limited Time — Free Trial
                        </span>
                    )}

                    {/* Stars */}
                    <div className="flex items-center justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className="text-amber-400 text-base" />
                        ))}
                        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">Loved by 500+ resellers</span>
                    </div>

                    {/* Heading */}
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-5 tracking-tight leading-tight">
                        Ready to grow your<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 dark:from-indigo-400 dark:via-violet-400 dark:to-rose-400">
                            subscription empire?
                        </span>
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        Join hundreds of digital resellers who automated their business, stopped missing renewals, and finally know their profits.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={plansEnabled ? "#plans" : "/login"}
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <FaRocket className="group-hover:rotate-12 transition-transform" />
                            {plansEnabled ? "Start Free Trial" : "Get Started"}
                        </Link>
                        <Link
                            href="/how-it-works?play=1"
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-white/5 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 hover:shadow-md"
                        >
                            Watch Demo <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Trust line */}
                    <p className="mt-7 text-xs text-slate-400 dark:text-slate-600 font-semibold tracking-wide">
                        ✓ No credit card required &nbsp;·&nbsp; ✓ Cancel anytime &nbsp;·&nbsp; ✓ Instant access
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
