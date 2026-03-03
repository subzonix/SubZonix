"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <LandingNavbar />
            <main className="max-w-4xl mx-auto px-6 py-32 mt-20">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">Privacy Policy</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-400">
                    <p>Last updated: February 18, 2026</p>
                    <p>Your privacy is important to us. It is SubZonix's policy to respect your privacy regarding any information we may collect.</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">Information We Collect</h2>
                    <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
                    <p>[Detailed privacy policy content goes here...]</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
