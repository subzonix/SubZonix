"use client";

import Link from "next/link";
import { FaTwitter, FaInstagram, FaLinkedin, FaGithub, FaPaperPlane, FaArrowRight } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
    const { appName, appLogoUrl, accentColor, supportEmail } = useAuth();
    const footerLinks = {
        product: [
            { label: "Features", href: "/#features" },
            { label: "How it Works", href: "/how-it-works" },
            { label: "Pricing", href: "/#plans" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Watch Demo", href: "/how-it-works?play=1" },
        ],
        company: [
            { label: "About Us", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "Contact", href: "/contact" },
        ],
        legal: [
            { label: "Privacy Policy", href: "/about" },
            { label: "Terms of Service", href: "/about" },
        ],
    };

    const socialLinks = [
        { icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
        { icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
        { icon: FaLinkedin, href: "https://linkedin.com", label: "LinkedIn" },
        { icon: FaGithub, href: "https://github.com", label: "GitHub" },
    ];

    return (
        <footer className="bg-white dark:bg-background border-t border-slate-200 dark:border-white/10 pt-20 pb-10 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl translate-y-1/2" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <Link href="/" className="flex items-center gap-2 mb-6 group w-fit">
                            {appLogoUrl ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center">
                                    <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:rotate-12 transition-transform duration-300 text-white text-lg font-black"
                                    style={{ backgroundColor: accentColor || "#4f46e5" }}
                                >
                                    {(appName?.[0] || "S").toUpperCase()}
                                </div>
                            )}
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                {appName || "SubZonix"}
                            </span>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-sm text-sm">
                            {appName || "SubZonix"} is an all-in-one platform for digital resellers to automate inventory, track profits, and scale securely.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3 mb-8">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-white/10"
                                >
                                    <social.icon size={14} />
                                </a>
                            ))}
                        </div>

                        {/* Contact badge */}
                        {supportEmail && (
                            <a
                                href={`mailto:${supportEmail}`}
                                className="inline-flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                            >
                                <FaPaperPlane size={10} />
                                {supportEmail}
                            </a>
                        )}
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2 md:col-span-1">
                        <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        onClick={(e) => {
                                            if (link.href.startsWith("/#")) {
                                                const id = link.href.split("#")[1];
                                                const element = document.getElementById(id);
                                                if (element) {
                                                    e.preventDefault();
                                                    element.scrollIntoView({ behavior: "smooth" });
                                                    window.history.pushState(null, "", link.href);
                                                }
                                            }
                                        }}
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center gap-1.5 group"
                                    >
                                        <FaArrowRight size={8} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2.5 group-hover:ml-0 text-indigo-500" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-1">
                        <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center gap-1.5 group"
                                    >
                                        <FaArrowRight size={8} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2.5 group-hover:ml-0 text-indigo-500" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-4 md:col-span-2">
                        <h4 className="font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest text-xs">Stay Updated</h4>
                        <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm leading-relaxed">
                            Get the latest features and reselling tips delivered to your inbox.
                        </p>
                        <form className="relative" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-4 pr-14 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-105"
                            >
                                <FaPaperPlane className="text-xs" />
                            </button>
                        </form>
                        <p className="text-xs text-slate-400 dark:text-slate-600 mt-3">No spam. Unsubscribe anytime.</p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-400 dark:text-slate-600 text-sm">
                        © {new Date().getFullYear()} <span className="font-semibold text-slate-600 dark:text-slate-400">{appName || "SubZonix"}</span>. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {footerLinks.legal.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-white transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
