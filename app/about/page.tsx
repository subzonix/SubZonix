"use client";

import { motion } from "framer-motion";
import { FaUserShield, FaRocket, FaCode, FaEnvelope, FaGlobe, FaLightbulb, FaHeart, FaShieldHalved } from "react-icons/fa6";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const values = [
    {
        icon: FaUserShield,
        title: "Security First",
        desc: "We prioritize user data and credential protection with enterprise-grade encryption and secure access protocols.",
        color: "from-indigo-500 to-blue-600"
    },
    {
        icon: FaRocket,
        title: "Scale Fast",
        desc: "Our mission is to eliminate manual work. From expiry tracking to profit calculation, we automate the boring stuff.",
        color: "from-violet-500 to-purple-600"
    },
    {
        icon: FaCode,
        title: "Modern Tech",
        desc: "Built on the latest Next.js stack, ensuring lightning-fast performance, SEO optimization, and a fluid user experience.",
        color: "from-emerald-500 to-teal-600"
    },
    {
        icon: FaHeart,
        title: "Customer Centric",
        desc: "We listen to our community. Every feature we build is directly inspired by the needs of real-world resellers.",
        color: "from-rose-500 to-pink-600"
    }
];

export default function AboutPage() {
    const { appName } = useAuth();

    return (
        <div className="min-h-screen bg-white dark:bg-background transition-colors duration-500">
            <CustomCursor />
            <LandingNavbar />

            {/* Hero Section */}
            <section className="pt-48 pb-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest"
                    >
                        ✦ &nbsp; About {appName || "SubZonix"} &nbsp; ✦
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tight leading-[1.1]"
                    >
                        We build tools for the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">Digital Economy.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        {appName || "SubZonix"} was created with one goal in mind: to empower digital entrepreneurs by automating the manual chaos of the reselling business.
                    </motion.p>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                        Our Mission: <br />
                        <span className="text-indigo-600">Zero Friction.</span>
                    </h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        The reselling business is growing faster than ever, but most resellers are still stuck in the "Excel age." We saw brilliant sellers lose customers because of a simple missed renewal or a deleted spreadsheet.
                    </p>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        We decided to build a platform that handles the boring, repetitive tasks—inventory management, customer tracking, and automated reminders—so you can focus on building your empire.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                            <div className="text-2xl font-black text-indigo-600 mb-1">500+</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-wrap">Active Resellers</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                            <div className="text-2xl font-black text-violet-600 mb-1">1M+</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-wrap">Sales Managed</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center p-12 border border-indigo-200/50 dark:border-white/10 overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="grid grid-cols-2 gap-6 relative z-10 w-full h-full">
                            {[FaGlobe, FaLightbulb, FaShieldHalved, FaRocket].map((Icon, i) => (
                                <div key={i} className={`rounded-3xl bg-white dark:bg-black p-8 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/10 transform transition-all duration-500 hover:scale-110 ${i % 2 === 0 ? "hover:-rotate-3" : "hover:rotate-3"}`}>
                                    <Icon className={i % 2 === 0 ? "text-indigo-500" : "text-violet-500"} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Floating decoration */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </motion.div>
            </section>

            {/* Values Grid */}
            <section className="py-24 bg-slate-50 dark:bg-card border-y border-slate-100 dark:border-white/5 overflow-hidden transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Our Core Values</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                            The principles that guide every feature we build and every reseller we support.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="p-8 rounded-[2.5rem] bg-white dark:bg-background border border-slate-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <v.icon className="text-2xl" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{v.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {v.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Contact Section */}
            <SectionCursorGlow>
                <section className="py-24 px-6 relative overflow-hidden bg-white dark:bg-background transition-colors duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="text-left">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                Have questions? <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">We're here to help.</span>
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                                Whether you're a solo reseller just starting out or a large-scale agency, our team is ready to help you optimize your tool reselling operations.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-600/25"
                            >
                                <FaEnvelope /> Contact Support
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: "24/7 Monitoring", desc: "Our systems and servers are monitored around the clock for maximum uptime." },
                                { title: "Dedicated Support", desc: "Our expert support team is always just a WhatsApp message away." },
                                { title: "Custom Development", desc: "We constantly update and refine features based on your direct feedback." }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                                >
                                    <h4 className="font-black text-xs uppercase tracking-widest text-indigo-500 mb-2">{item.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </SectionCursorGlow>

            <Footer />
        </div>
    );
}
