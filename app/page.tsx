"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaGem } from "react-icons/fa6";
import { AnimatePresence } from "framer-motion";

import HeroSection from "@/components/landing/HeroSection";
import PainPoints from "@/components/landing/PainPoints";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LogoMarquee from "@/components/landing/LogoMarquee";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import StatsSection from "@/components/landing/StatsSection";
import FloatingActionButtons from "@/components/ui/FloatingActionButtons";
import LoadingScreen from "@/components/ui/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import SectionCursorGlow from "@/components/ui/SectionCursorGlow";

import { useLandingAnimations } from "@/hooks/useLandingAnimations";

export default function HomePage() {
    const [appConfig, setAppConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    // Initialize GSAP Animations
    const containerRef = useLandingAnimations();

    useEffect(() => {
        const loadConfig = async () => {
            try {
                // Simulate a minimum loading time for better perceived performance
                const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));

                const configPromise = getDoc(doc(db, "settings", "app_config"));

                const [configSnap] = await Promise.all([configPromise, minLoadTime]);

                if (configSnap.exists()) {
                    setAppConfig(configSnap.data());
                }
            } catch (error) {
                console.error("Error loading config:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    return (
        <ErrorBoundary>
            <CustomCursor />
            <AnimatePresence>
                {loading && <LoadingScreen />}
            </AnimatePresence>

            <div ref={containerRef} className="min-h-screen overflow-y-auto transition-colors duration-500 bg-white dark:bg-black">
                <LandingNavbar />

                <SectionCursorGlow><HeroSection /></SectionCursorGlow>
                <SectionCursorGlow><LogoMarquee /></SectionCursorGlow>
                <SectionCursorGlow><StatsSection /></SectionCursorGlow>
                <SectionCursorGlow><FeaturesSection /></SectionCursorGlow>
                <SectionCursorGlow><HowItWorks /></SectionCursorGlow>
                <SectionCursorGlow><PainPoints /></SectionCursorGlow>
                <SectionCursorGlow><SolutionSection /></SectionCursorGlow>
                <SectionCursorGlow><TestimonialsSection /></SectionCursorGlow>
                <SectionCursorGlow><PricingSection appConfig={appConfig} /></SectionCursorGlow>
                <SectionCursorGlow><FAQSection /></SectionCursorGlow>
                <SectionCursorGlow><CTASection /></SectionCursorGlow>

                <FloatingActionButtons />
                <SectionCursorGlow><Footer /></SectionCursorGlow>
            </div>
        </ErrorBoundary>
    );
}
