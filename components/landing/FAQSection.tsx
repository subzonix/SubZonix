"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus } from "react-icons/fa6";
import clsx from "clsx";

const faqs = [
    {
        q: "Is my data secure?",
        a: "Yes. Sensitive data is protected using Firebase security rules and encryption for stored credentials. Follow secure admin practices when sharing owner access."
    },
    {
        q: "Can I manage shared accounts?",
        a: "Yes. SubZonix supports shared accounts with automatic cost-splitting and usage tracking."
    },
    {
        q: "Does it calculate profit automatically?",
        a: "Yes. Enter tool cost and selling price; SubZonix will compute profit and per-user cost shares."
    },
    {
        q: "Can I cancel anytime?",
        a: "Yes. You can upgrade, downgrade, or cancel a plan at any time. Owner-set billing terms apply for owner-managed plans."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-32 bg-white dark:bg-card px-6 relative overflow-hidden transition-colors duration-500">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-200 dark:border-indigo-500/20">
                        FAQ
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">Questions</span></h2>
                    <p className="text-slate-600 dark:text-slate-400">Everything you need to know about the platform.</p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 }}
                            className={clsx(
                                "border rounded-2xl overflow-hidden transition-all duration-300",
                                openIndex === i
                                    ? "bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20 shadow-md shadow-indigo-500/10"
                                    : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:shadow-md"
                            )}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-6 flex items-center justify-between text-left transition-colors"
                            >
                                <span className="font-bold text-slate-900 dark:text-white text-base pr-4">{faq.q}</span>
                                <div className={clsx(
                                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                                    openIndex === i
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50"
                                )}>
                                    {openIndex === i ? <FaMinus size={10} /> : <FaPlus size={10} />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
