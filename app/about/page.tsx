"use client";

import { useMemo } from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import { motion } from "framer-motion";
import { FaUserShield, FaRocket, FaCode, FaEnvelope } from "react-icons/fa6";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import Footer from "@/components/landing/Footer";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";
import { useAuth } from "@/context/AuthContext";

export default function AboutPage() {
    const { appName, supportEmail } = useAuth();
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
            <LandingNavbar />

            {/* Hero */}
            <section className="pt-48 pb-20 px-6 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1]"
                >
                    Building the Future of <br />
                    <span className="text-indigo-500">Digital Reselling.</span>
                </motion.h1>
                <div className="max-w-2xl mx-auto">
                    <TextGenerateEffect
                        words={`${appName || "SubsGrow"} empowers digital entrepreneurs to automate, scale, and manage their tool resale business with bank-grade security and premium efficiency.`}
                        className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium"
                    />
                </div>
            </section>

            {/* Values Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: FaUserShield,
                            title: "Security First",
                            desc: "We prioritize user data and credential protection with enterprise-grade encryption and secure access protocols."
                        },
                        {
                            icon: FaRocket,
                            title: "Automation",
                            desc: "Our mission is to eliminate manual work. From expiry tracking to profit calculation, we automate the boring stuff."
                        },
                        {
                            icon: FaCode,
                            title: "Modern Tech",
                            desc: "Built on the latest Next.js stack, ensuring lightning-fast performance, SEO optimization, and a fluid user experience."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-zinc-50 dark:bg-neutral-900 py-8 px-6 rounded-[2rem] hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300"
                        >
                            <div className="w-12 h-12 bg-white dark:bg-black rounded-xl flex items-center justify-center text-indigo-500 mb-6 text-xl shadow-sm border border-slate-100 dark:border-white/10">
                                <item.icon />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-background py-24 border-y border-border">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="text-left">
                        <h2 className="text-3xl md:text-4xl font-black mb-6">Terms & Policies</h2>
                        <p className="text-base text-muted-foreground mb-8 font-medium leading-relaxed">
                            We are committed to transparency and your privacy. Our platform is built on trust and secure management of your business data.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                <h4 className="font-bold text-sm uppercase tracking-widest text-indigo-500 mb-1">Privacy Policy</h4>
                                <p className="text-xs text-muted-foreground">Your data is yours. We encrypt all credentials and never share your financial or customer data with third parties.</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                <h4 className="font-bold text-sm uppercase tracking-widest text-indigo-500 mb-1">Terms of Service</h4>
                                <p className="text-xs text-muted-foreground">{appName || "SubsGrow"} is a management platform. Users are responsible for complying with the terms of the tools they resell.</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <h2 className="text-3xl md:text-4xl font-black mb-6">Get in Touch</h2>
                        <p className="text-base text-muted-foreground mb-10 font-medium">
                            Have questions or want to partner with us? Reach out.
                        </p>
                        <a
                            href="mailto:support@tapntools.com"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-500 transition-all hover:scale-105 shadow-xl shadow-indigo-600/20"
                        >
                            <FaEnvelope /> Contact Support
                        </a>
                    </div>
                </div>
            </section>

            <SectionCursorGlow>
                <Footer />
            </SectionCursorGlow>
        </div>
    );
}
