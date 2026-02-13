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
        <section className="py-32 bg-white dark:bg-slate-950 px-6 transition-colors duration-500">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-primary dark:text-primary mb-4">Frequently Asked Questions (FAQ)</h2>
                    <p className="text-slate-600 dark:text-slate-400">Everything you need to know about the platform.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-6 flex items-center justify-between text-left hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="font-bold text-slate-900 dark:text-white text-lg">{faq.q}</span>
                                {openIndex === i ? (
                                    <FaMinus className="text-indigo-600 dark:text-white" />
                                ) : (
                                    <FaPlus className="text-slate-400 dark:text-white" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
