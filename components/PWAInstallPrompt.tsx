"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaDownload, FaTimes } from "react-icons/fa";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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

            // Show modal if not previously dismissed
            const dismissed = localStorage.getItem("pwa_modal_dismissed");
            if (!dismissed) {
                setShowModal(true);
            }
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
            setShowModal(false);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
    };

    if (isInstalled || !showBanner) return null;

    return (
        <>
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

            {mounted && createPortal(
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        localStorage.setItem("pwa_modal_dismissed", "true");
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <FaTimes />
                                </button>

                                <div className="flex flex-col items-center text-center mt-2">
                                    <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 mb-4">
                                        <Image src="/tabicon2.png" alt="SubZonix" fill className="object-cover" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Install SubZonix</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-2">
                                        Install our app on your device for quick access, offline support, and a better experience.
                                    </p>
                                    <div className="w-full flex flex-col gap-2">
                                        <button
                                            onClick={handleInstall}
                                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95"
                                        >
                                            <FaDownload />
                                            Install App Now
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                localStorage.setItem("pwa_modal_dismissed", "true");
                                            }}
                                            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition-colors text-sm active:scale-95"
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
