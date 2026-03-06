"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaWhatsapp, FaMapPin, FaPaperPlane, FaCheck, FaArrowLeft } from "react-icons/fa6";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select } from "@/components/ui/Shared";

const contactInfo = [
    {
        icon: FaEnvelope,
        label: "Email Us",
        value: "support@subzonix.cloud",
        href: "mailto:support@subzonix.cloud",
        color: "from-indigo-500 to-purple-600",
        bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
        icon: FaWhatsapp,
        label: "WhatsApp",
        value: "+447771063739",
        href: "https://wa.me/447771063739",
        color: "from-green-500 to-emerald-600",
        bg: "bg-green-50 dark:bg-green-500/10",
    },
    {
        icon: FaMapPin,
        label: "Location",
        value: "Remote — Worldwide",
        href: "#",
        color: "from-rose-500 to-pink-600",
        bg: "bg-rose-50 dark:bg-rose-500/10",
    },
];

export default function ContactPage() {
    const { appName, supportEmail } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await addDoc(collection(db, "support_queries"), {
                name: form.name,
                userEmail: form.email,
                subject: form.subject,
                query: form.message,
                status: "unread",
                source: "landing_contact_page",
                createdAt: serverTimestamp(),
            });
            setSent(true);
        } catch (err: any) {
            setError("Failed to send message. Please try again later.");
            console.error("Contact Form Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Update contact info with dynamic support email
    const dynamicContactInfo = contactInfo.map((c) =>
        c.label === "Email Us" && supportEmail
            ? { ...c, value: supportEmail, href: `mailto:${supportEmail}` }
            : c
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            <LandingNavbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6 border border-indigo-100 dark:border-indigo-500/20">
                            <FaEnvelope className="text-xs" />
                            Get in Touch
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                            We&apos;d love to{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                                hear from you
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Have a question, feedback, or want to partner with {appName || "SubZonix"}? Our team is here to help.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-12 px-6">
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {dynamicContactInfo.map((item, i) => (
                        <motion.a
                            key={i}
                            href={item.href}
                            target={item.href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -4 }}
                            className={`group p-6 rounded-2xl border border-border ${item.bg} hover:shadow-xl transition-all duration-300 flex items-start gap-4 cursor-pointer`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="font-bold text-foreground">{item.value}</p>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/30 p-8 md:p-12 relative overflow-hidden"
                    >
                        {/* Decorative blob */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12 relative z-10"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
                                    <FaCheck className="text-white text-3xl" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-3">Message Sent!</h3>
                                <p className="text-muted-foreground mb-8">
                                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                                </p>
                                <button
                                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                                >
                                    Send Another
                                </button>
                            </motion.div>
                        ) : (
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-foreground mb-2">Send us a message</h2>
                                <p className="text-muted-foreground text-sm mb-8">Fill in the form and we&apos;ll respond as soon as possible.</p>

                                {error && (
                                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Your Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="you@example.com"
                                                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Subject</label>
                                        <Select
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            className="w-full h-11"
                                        >
                                            <option value="">Select a topic...</option>
                                            <option value="general">General Inquiry</option>
                                            <option value="support">Technical Support</option>
                                            <option value="billing">Billing & Plans</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="feature">Feature Request</option>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Message</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={5}
                                            value={form.message}
                                            onChange={handleChange}
                                            placeholder="Tell us how we can help..."
                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            <>
                                                <FaPaperPlane />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>

                    <div className="text-center mt-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <FaArrowLeft className="text-xs" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
