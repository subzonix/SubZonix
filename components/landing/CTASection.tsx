"use client";

import { FaArrowRight } from "react-icons/fa6";
import Link from "next/link";

export default function CTASection() {
    return (
        <section className="py-32 relative overflow-hidden bg-white dark:bg-transparent transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-black dark:to-indigo-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/20 dark:via-black dark:to-black opacity-50" />

            <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
                    Start growing your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-600 dark:from-indigo-400 dark:to-rose-400">business today.</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="#plans"
                        className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl text-base font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        Get Started <FaArrowRight />
                    </Link>
                </div>
            </div>
        </section>
    );
}
