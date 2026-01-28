"use client";
import { useState, useEffect } from "react";
import { ToastProvider } from "@/context/ToastContext";
import RetentionManager from "@/components/RetentionManager";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    return (
        <ToastProvider>
            <div className="flex h-[100dvh] bg-background transition-colors overflow-hidden">
                <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={sidebarCollapsed} />
                <div className="flex-1 flex flex-col h-full bg-background relative w-full overflow-hidden">
                    <Header
                        onMenuClick={() => setMobileOpen(true)}
                        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                        sidebarCollapsed={sidebarCollapsed}
                    />
                    <RetentionManager />
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6 pb-20 sm:pb-6">
                        <div className="max-w-7xl mx-auto space-y-6 min-h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}

