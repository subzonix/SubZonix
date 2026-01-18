"use client";

import { useAuth } from "@/context/AuthContext";
import { PlanFeatures } from "@/types";
import { FaLock, FaArrowUp } from "react-icons/fa6";
import Link from "next/link";

interface PlanFeatureGuardProps {
    feature: keyof PlanFeatures;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function PlanFeatureGuard({ feature, children, fallback }: PlanFeatureGuardProps) {
    const { planFeatures, role } = useAuth();

    // Owner always has access to all features
    if (role === "owner") {
        return <>{children}</>;
    }

    // Check if feature is enabled in user's plan
    const hasAccess = planFeatures?.[feature] ?? false;

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <FaLock className="text-3xl text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight mb-2">
                    Feature Locked
                </h3>
                <p className="text-sm text-slate-500 text-center mb-6 max-w-md">
                    The <span className="font-bold text-amber-500">{getFeatureName(feature)}</span> feature is not included in your current plan.
                    <br />
                    Upgrade to unlock this premium feature.
                </p>
                <Link
                    href="/dashboard/plans"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                    <FaArrowUp className="text-base" />
                    Upgrade Plan
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}

function getFeatureName(feature: keyof PlanFeatures): string {
    const names: Record<keyof PlanFeatures, string> = {
        export: "Export Data",
        pdf: "PDF Generation",
        whatsappAlerts: "WhatsApp Alerts",
        editReminders: "Edit Reminders",
        support: "Support Access",
        exportPreference: "Export Preferences",
        importData: "Import Data",
        dateRangeFilter: "Date Range Filters",
        // Page Access
        dashboard: "Dashboard",
        newSale: "New Sale Page",
        expiry: "Expiry Alerts",
        pending: "Pending Sales",
        vendors: "Vendors Page",
        inventory: "Inventory Management",
        history: "Sale History",
        customers: "Customer Analytics",
        analytics: "Business Analytics",
        settings: "Settings Page"
    };
    return names[feature] || feature;
}
