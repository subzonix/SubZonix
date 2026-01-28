"use client";

import { motion } from "framer-motion";
import { FaFileExcel, FaWhatsapp, FaClock, FaMoneyBillWave } from "react-icons/fa6";

const pains = [
{
    icon: FaFileExcel,
        title: "Excel Chaos",
            desc: "Spreadsheets break and cause lost sales.",
                delay: 0.1
},
{
    icon: FaWhatsapp,
        title: "Manual Follow-ups",
        desc: "Manual messages waste time and miss renewals.",
                delay: 0.2
},
{
    icon: FaClock,
        title: "Missed Renewals",
            desc: "Forgetting dates means losing customers.",
                delay: 0.3
},
{
    icon: FaMoneyBillWave,
        title: "Lost Profits",
            desc: "Hidden costs eat up your margins.",
                delay: 0.4
}
];

export default function PainPoints() {
    return (
        <section className="py-24 bg-background relative overflow-hidden transition-colors duration-500">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-900/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 tracking-tight">
                        Still running on <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-900 dark:to-slate-200">Excel & Luck?</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Manual tracking is costing you money. It's time to stop the bleeding.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6">
                    {pains.map((pain, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: pain.delay }}
                            className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-primary border border-border relative z-10">
                                <pain.icon className="text-2xl text-primary group-hover:text-primary/80 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">{pain.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed relative z-10">
                                {pain.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
