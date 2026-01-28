"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import OwnerSidebar from "@/components/layout/OwnerSidebar";
import Header from "@/components/layout/Header";
import { ToastProvider } from "@/context/ToastContext";
import clsx from "clsx";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user || role !== "owner") {
                router.push("/login");
            }
        }
    }, [user, role, loading, router]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading Owner Panel...</div>;
    if (role !== "owner") return null;

    return (
        <ToastProvider>
            <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
                {/* Sidebar */}
                <OwnerSidebar
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    collapsed={sidebarCollapsed}
                />

                {/* Main Content */}
                <main className={clsx(
                    "flex-1 flex flex-col h-screen transition-all duration-300 overflow-y-auto custom-scrollbar",
                    sidebarCollapsed ? "md:ml-20" : "md:ml-64"
                )}>
                    <Header
                        onMenuClick={() => setMobileOpen(true)}
                        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                        sidebarCollapsed={sidebarCollapsed}
                    />

                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}