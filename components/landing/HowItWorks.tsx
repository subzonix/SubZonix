"use client";

import { motion } from "framer-motion";

const steps = [
    {
        no: "01",
        title: "Setup Inventory",
        desc: "Add your tools and accounts. Set your purchase costs and selling prices once, and let our system handle the inventory tracking for you."
    },
    {
        no: "02",
        title: "Assign Access",
        desc: "Seamlessly link tools to your customers. Record every sale instantly and keep a clean history of who is using which account."
    },
    {
        no: "03",
        title: "Automate Alerts",
        desc: "Stay ahead of expirations. Our system sends automatic renewal reminders to your customers, ensuring consistent recurring revenue."
    },
    {
        no: "04",
        title: "Scale Fast",
        desc: "Take control of your growth. Track your net profits in real-time and manage your entire reselling business from one powerful dashboard."
    }
];

export default function HowItWorks() {
    return (
        <section className="py-24 bg-white dark:bg-black border-y border-slate-100 dark:border-white/5 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
                    {/* Optional connector line for desktop */}
                    <div className="hidden md:block absolute top-[24px] left-0 right-0 h-[1px] bg-slate-200 dark:bg-white/10 -z-10" />

                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex flex-col items-center md:items-start text-center md:text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6 group-hover:border-primary transition-all duration-300 shadow-sm">
                                <span className="text-sm font-black text-primary">{step.no}</span>
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-tight">{step.title}</h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
