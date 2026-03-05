"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if already installed (running in standalone mode)
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as { standalone?: boolean }).standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // SW registration failed silently
            });
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
            setShowBanner(false);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
            setShowBanner(false);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
    };

    if (isInstalled || !showBanner) return null;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.button
                    key="pwa-install-btn"
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={handleInstall}
                    title="Install SubZonix as an app"
                    className="group relative flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-500 dark:text-indigo-400 transition-all duration-200 active:scale-95 overflow-hidden"
                >
                    {/* Subtle shimmer */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                    <div className="relative w-5 h-5 flex-shrink-0">
                        <Image src="/tabicon2.png" alt="SubZonix" fill className="object-contain rounded-sm" />
                    </div>

                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Install App</span>
                        <span className="text-[10px] font-bold hidden sm:block">SubZonix</span>
                    </div>

                    {/* Dismiss × */}
                    <span
                        role="button"
                        aria-label="Dismiss install prompt"
                        className="ml-1 text-[10px] opacity-40 hover:opacity-100 transition-opacity leading-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss();
                        }}
                    >
                        ✕
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
