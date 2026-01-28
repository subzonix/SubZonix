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
    const { planFeatures, role, isStaff, staffPermissions } = useAuth();

    // Owner always has access to all features (unless it's a plan limit, but normally owner is unrestricted by role, restricted by plan)
    // Actually, Owner is restricted by Plan.

    // Check if feature is enabled in user's plan (applies to Owner and Staff)
    const planHasAccess = planFeatures?.[feature] ?? false;

    // If Staff, check staff permissions
    let staffHasAccess = true;
    if (isStaff && staffPermissions) {
        staffHasAccess = checkStaffAccess(feature, staffPermissions);
    }

    const hasAccess = planHasAccess && staffHasAccess;

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="relative w-full h-full min-h-[50vh] overflow-hidden rounded-2xl">
                {/* Blurred Content */}
                <div className="filter blur-md pointer-events-none select-none opacity-50 absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    {children}
                </div>

                {/* Lock Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full min-h-[50vh]">
                    <div className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center max-w-md mx-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 ring-4 ring-amber-500/5">
                            <FaLock className="text-3xl text-amber-500" />
                        </div>
                        <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight mb-2">
                            Feature Locked
                        </h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
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
                </div>
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
        settings: "Settings Page",
        mart: "Public Mart Page",
        customBranding: "Custom Branding"
    };
    return names[feature] || feature;
}

function checkStaffAccess(feature: keyof PlanFeatures, permissions: any): boolean {
    switch (feature) {
        case "dashboard": return permissions.sales?.read;
        case "newSale": return permissions.sales?.write;
        case "expiry": return permissions.sales?.read;
        case "pending": return permissions.sales?.read;
        case "vendors": return permissions.inventory?.read;
        case "inventory": return permissions.inventory?.read;
        case "history": return permissions.sales?.read; // History needs sales read
        case "customers": return permissions.customers?.read;
        case "analytics": return permissions.analytics?.read;
        case "settings": return permissions.settings?.read;
        case "mart": return true;
        default: return true;
    }
}
