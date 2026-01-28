"use client";

import { motion } from "framer-motion";
import { FaBolt, FaChartLine, FaUsers, FaBell } from "react-icons/fa6";

const stats = [
    {
        icon: FaBolt,
        label: "High Volume Ready",
        color: "text-primary"
    },
    {
        icon: FaChartLine,
        label: "Auto Profit Tracking",
        color: "text-foreground"
    },
    {
        icon: FaUsers,
        label: "Shared Accounts",
        color: "text-primary"
    },
    {
        icon: FaBell,
        label: "Instant Expiry Alerts",
        color: "text-foreground"
    }
];

export default function StatsSection() {
    return (
        <section className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-slate-950 relative overflow-hidden transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="text-center group"
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                                className={`text-4xl mb-4 ${stat.color} group-hover:scale-110 transition-transform`}
                            >
                                <stat.icon />
                            </motion.div>
                            <p className="text-sm md:text-base font-black text-foreground leading-snug">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
