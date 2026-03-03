"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <LandingNavbar />
            <main className="max-w-7xl mx-auto px-6 py-32 mt-20">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">Blog</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
                    Coming Soon! We're preparing insightful articles and updates for our community.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}
