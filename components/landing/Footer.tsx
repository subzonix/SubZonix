"use client";

import Link from "next/link";
import { FaGem, FaTwitter, FaInstagram, FaLinkedin, FaGithub, FaPaperPlane } from "react-icons/fa6";
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
            { label: "Contact", href: `mailto:${supportEmail || "support@example.com"}` },
        ],
        legal: [
            { label: "Privacy Policy", href: "/about" },
            { label: "Terms of Service", href: "/about" },
        ],
    };

    const socialLinks = [
        { icon: FaTwitter, href: "https://twitter.com" },
        { icon: FaInstagram, href: "https://instagram.com" },
        { icon: FaLinkedin, href: "https://linkedin.com" },
        { icon: FaGithub, href: "https://github.com" },
    ];

    return (
        <footer className="bg-white dark:bg-black border-t border-slate-200 dark:border-white/10 pt-20 pb-10 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-900/5 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2" />
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
                                    style={{ backgroundColor: accentColor || "#0066FF" }}
                                >
                                    {(appName?.[0] || "S").toUpperCase()}
                                </div>
                            )}
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                {appName || "SubZonix"}
                            </span>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-sm">
                            {appName || "SubZonix"} is an all-in-one platform for digital resellers to automate inventory, track profits, and scale securely.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-300"
                                >
                                    <social.icon />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2 md:col-span-1">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-1">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-4 md:col-span-2">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6">Stay Updated</h4>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                            Subscribe to our newsletter for the latest features and reselling tips.
                        </p>
                        <form className="relative" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
                            >
                                <FaPaperPlane className="text-xs" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 dark:text-slate-500 text-sm">
                        © {new Date().getFullYear()} {appName || "SubZonix"}. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {footerLinks.legal.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors"
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
