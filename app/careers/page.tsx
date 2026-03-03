"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <LandingNavbar />
            <main className="max-w-7xl mx-auto px-6 py-32 mt-20">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">Careers at SubZonix</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
                    Join our team and help us build the future of digital reselling automation.
                </p>
                <div className="p-12 rounded-[3rem] bg-indigo-600/5 border border-indigo-600/10 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">No Openings Currently</h2>
                    <p className="text-slate-600 dark:text-slate-400">Check back later or send your CV to support@subzonix.cloud</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
