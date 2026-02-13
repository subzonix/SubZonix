"use client";

import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { FaPlus, FaUserPlus, FaChartLine, FaYoutube, FaUsers } from "react-icons/fa6";
import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import VideoModal from "@/components/ui/VideoModal";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";
import { useAuth } from "@/context/AuthContext";

export default function HowItWorks() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <HowItWorksContent />
        </Suspense>
    );
}

function HowItWorksContent() {
    const [videoOpen, setVideoOpen] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("play") === "1") {
            setVideoOpen(true);
        }
    }, [searchParams]);
    const YOUTUBE_VIDEO_ID = "y8mHzXid0oI"; // From: https://youtu.be/y8mHzXid0oI?si=tDPK-Bczoe5-u1Ne

    const { appName } = useAuth(); // Move hook to top level

    const content = useMemo(
        () => [
            {
                title: "01. Add Tool",
                description:
                    "Start by inputting your tool details. Define the cost price, selling price, and add your inventory login credentials once. Our system encrypts everything with bank-grade security.",
                content: (
                    <div className="h-full w-full flex items-center justify-center text-indigo-500 rounded-md">
                        <FaPlus className="text-6xl drop-shadow-md" />
                    </div>
                ),
            },
            {
                title: "02. Assign Customer",
                description:
                    "When you make a sale, simply select a customer from your list or add a new one. Assign them the tool access instantly. We handle the credential delivery and access tracking.",
                content: (
                    <div className="h-full w-full flex items-center justify-center text-indigo-500 rounded-md">
                        <FaUserPlus className="text-6xl drop-shadow-md" />
                    </div>
                ),
            },
            {
                title: "03. Track Profit",
                description:
                    "Sit back and watch. The system automatically calculates your profit margins per sale, tracks subscription expiry dates, and even sends WhatsApp reminders to your customers.",
                content: (
                    <div className="h-full w-full flex items-center justify-center text-indigo-500 rounded-md">
                        <FaChartLine className="text-6xl drop-shadow-md" />
                    </div>
                ),
            },
            {
                title: "04. Manage Team",
                description:
                    "Scale your operation by adding staff members. Control their access with granular permissions for inventory, sales, and settings while you keep the master view.",
                content: (
                    <div className="h-full w-full flex items-center justify-center text-indigo-500 rounded-md">
                        <FaUsers className="text-6xl drop-shadow-md" />
                    </div>
                ),
            },
            {
                title: "05. Watch Demo",
                description:
                    `See the platform in action. Watch a quick walkthrough to understand how ${appName || "SubZonix"} can revolutionize your reselling business.`,
                content: (
                    <button
                        type="button"
                        onClick={() => setVideoOpen(true)}
                        className="h-full w-full rounded-md shadow-2xl relative overflow-hidden group bg-slate-950"
                    >
                        <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.50),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(15,23,42,0.35),transparent_55%)]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FaYoutube className="text-3xl text-indigo-400" />
                            </div>
                            <span className="text-xl font-black mb-2">Watch Full Demo</span>
                            <span className="text-sm text-white/70 font-medium">
                                Click to play (opens in a modal)
                            </span>
                        </div>
                    </button>
                ),
            },
        ],
        [appName]
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500">
            <CustomCursor />
            <LandingNavbar />

            <SectionCursorGlow>
                <section className="pt-32 pb-20 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">How It Works</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                                Automation in four simple steps.
                            </p>
                        </motion.div>
                    </div>

                    <StickyScroll content={content} />
                </section>
            </SectionCursorGlow>

            <SectionCursorGlow>
                <Footer />
            </SectionCursorGlow>

            <VideoModal
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                title={`${appName || "SubZonix"} Demo`}
                youtubeVideoId={YOUTUBE_VIDEO_ID}
            />
        </div>
    );
}
