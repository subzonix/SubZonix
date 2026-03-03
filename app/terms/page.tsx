"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <LandingNavbar />
            <main className="max-w-4xl mx-auto px-6 py-32 mt-20">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-400">
                    <p>Last updated: February 18, 2026</p>
                    <p>Welcome to SubZonix. By using our service, you agree to these terms.</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">1. Acceptance of Terms</h2>
                    <p>By accessing or using SubZonix, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">2. Use License</h2>
                    <p>Permission is granted to temporarily use the services provided by SubZonix for personal or commercial business management.</p>
                    <p>[Detailed terms content goes here...]</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
