"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { FaFloppyDisk, FaKey, FaUpload, FaTrash, FaLink, FaCircleInfo, FaGear, FaArrowRight, FaFileCsv, FaMessage, FaGem, FaChartLine, FaHeadset, FaShop, FaPalette } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useTheme } from "next-themes";
import { useToast } from "@/context/ToastContext";

import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import clsx from "clsx";

function SettingsAccordionCard({
    title,
    icon: Icon,
    iconClassName,
    open,
    onToggle,
    children,
}: {
    title: string;
    icon: any;
    iconClassName?: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <Card className="p-0 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className={clsx(
                    "w-full flex justify-between items-center p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    open ? "bg-muted/30" : "hover:bg-muted/30"
                )}
            >
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Icon className={iconClassName || "text-primary"} /> {title}
                </h3>
                <FaArrowRight className={clsx("text-xs transition-transform duration-300 text-muted-foreground", open ? "rotate-90" : "rotate-0")} />
            </button>
            <div className={clsx("grid transition-all duration-300 ease-in-out", open ? "grid-rows-[1fr] border-t border-border" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                    <div className={clsx(open ? "p-4" : "p-0")}>{children}</div>
                </div>
            </div>
        </Card>
    );
}

export default function SettingsPage() {
    const { user, merchantId, planName, salesLimit, currentSalesCount, planFeatures, sidebarMode, setSidebarMode, dataRetentionMonths } = useAuth();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { showToast, confirm } = useToast();
    const [expandedSections, setExpandedSections] = useState({
        branding: true,
        plan: false,
        security: false,
        export: false,
        system: false,
        interface: false,
        quick: false
    });
    const [settings, setSettings] = useState({
        companyName: "",
        slogan: "",
        logoUrl: "",
        companyPhone: "",
        accountNumber: "",
        iban: "",
        bankName: "",
        accountHolder: "",
        shopEnabled: true,
        exportPreferences: {
            "Activation Date": true,
            "Client": true,
            "Number": true,
            "Tool Name": true,
            "Duration": true,
            "Expiry Date": true,

            "Type": true,
            "Plan": true,
            "Email": true,
            "Password": true,
            "Profile Name": true,
            "Profile PIN": true,
            "Vendor": true,
            "Cost": true,
            "Sale": true,
            "Profit": true
        } as Record<string, boolean>
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [savingSidebarMode, setSavingSidebarMode] = useState(false);
    const [sidebarModeLocal, setSidebarModeLocal] = useState<"auto" | "light" | "dark">(sidebarMode || "auto");
    const [savingRetention, setSavingRetention] = useState(false);
    const [dataRetentionMonthsLocal, setDataRetentionMonthsLocal] = useState<number>(0);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedSettings, setLastSavedSettings] = useState("");

    useEffect(() => {
        const load = async () => {
            if (!merchantId) return;
            const snap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
            if (snap.exists()) {
                const data = snap.data();
                const loadedSettings = {
                    ...settings,
                    companyName: data.companyName || "",
                    slogan: data.slogan || "",
                    companyPhone: data.companyPhone || "",
                    accountNumber: data.accountNumber || "",
                    iban: data.iban || "",
                    bankName: data.bankName || "",
                    accountHolder: data.accountHolder || "",
                    shopEnabled: data.shopEnabled !== false,
                    exportPreferences: { ...settings.exportPreferences, ...data.exportPreferences },
                };
                setSettings(loadedSettings);
                setLastSavedSettings(JSON.stringify(loadedSettings));
                setIsDirty(false);

                const mode = (data.sidebarMode === "light" || data.sidebarMode === "dark" || data.sidebarMode === "auto") ? data.sidebarMode : "auto";
                setSidebarModeLocal(mode);
                setSidebarMode(mode);

                const rm = Number(data.dataRetentionMonths || 0);
                setDataRetentionMonthsLocal(Number.isFinite(rm) ? rm : 0);
            } else {
                setLastSavedSettings(JSON.stringify(settings));
                setSidebarModeLocal("auto");
                setSidebarMode("auto");
                setDataRetentionMonthsLocal(0);
            }
        };
        load();
    }, [merchantId]);

    useEffect(() => {
        if (!sidebarMode) return;
        setSidebarModeLocal(sidebarMode);
    }, [sidebarMode]);

    useEffect(() => {
        if (!lastSavedSettings) return;
        const current = JSON.stringify(settings);
        setIsDirty(current !== lastSavedSettings);
    }, [settings, lastSavedSettings]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const handleSave = async () => {
        if (!merchantId) return;
        setLoading(true);
        try {
            const companySlug = slugify(settings.companyName);

            await setDoc(doc(db, "users", merchantId, "settings", "general"), settings, { merge: true });
            await setDoc(doc(db, "users", merchantId), { companySlug }, { merge: true });

            if (companySlug) {
                await setDoc(doc(db, "slugs", companySlug), { uid: merchantId });
            }

            setLastSavedSettings(JSON.stringify(settings));
            setIsDirty(false);
            showToast("Settings saved successfully!", "success");
        } catch (e: any) {
            showToast("Error: " + e.message, "error");
        }
        setLoading(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            if (settings.logoUrl && settings.logoUrl.includes("firebasestorage")) {
                try {
                    const oldRef = ref(storage, settings.logoUrl);
                    await deleteObject(oldRef);
                } catch (err) {
                    console.error("Old logo delete failed", err);
                }
            }

            const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                null,
                (error) => { showToast("Upload failed: " + error.message, "error"); setUploading(false); },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setSettings({ ...settings, logoUrl: downloadURL });
                    setUploading(false);
                    showToast("Logo uploaded! Click Save to confirm.", "success");
                }
            );
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
            setUploading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        const ok = await confirm({
            title: "Send Reset Password Email?",
            message: `Send password reset email to ${user?.email || 'your email'}? You will be logged out to complete this action.`,
            confirmText: "Send Reset Email",
            variant: "primary"
        });

        try {
            if (ok) {
                await sendPasswordResetEmail(auth, user?.email || "");
                showToast("Password reset email sent!", "success");
            }
        } catch (e: any) {
            showToast("Error: " + e.message, "error");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Account Health</p>
                            <h3 className="text-lg font-black text-foreground">{(salesLimit && currentSalesCount && currentSalesCount > salesLimit * 0.9) ? "Critical" : "Good"}</h3>
                        </div>
                        <div className={clsx("p-2 rounded-xl", (salesLimit && currentSalesCount && currentSalesCount > salesLimit * 0.9) ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                            <FaCircleInfo className="text-sm" />
                        </div>
                    </div>
                    <div className="mt-3 relative z-10">
                        {(salesLimit && currentSalesCount) ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={clsx("h-full", currentSalesCount > salesLimit * 0.9 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (currentSalesCount / salesLimit) * 100)}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">{Math.round((currentSalesCount / salesLimit) * 100)}%</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400">Unlimited Capacity</p>
                        )}
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Active Plan</p>
                            <h3 className="text-lg font-black text-indigo-500 truncate max-w-[140px] uppercase italic">{planName || "Trial"}</h3>
                        </div>
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <FaGem className="text-sm" />
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400 font-medium relative z-10">
                        {dataRetentionMonths ? `${dataRetentionMonths} Months Retention` : "No Retention Policy"}
                    </p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Public Shop</p>
                            <h3 className="text-lg font-black text-foreground">{settings.shopEnabled ? "Active" : "Disabled"}</h3>
                        </div>
                        <div className={clsx("p-2 rounded-xl", settings.shopEnabled ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500")}>
                            <FaShop className="text-sm" />
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400 font-medium relative z-10">
                        {settings.companyName ? "Share link with clients" : "Set name to enable link"}
                    </p>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Branding</p>
                            <h3 className="text-lg font-black text-foreground">{settings.logoUrl ? "Custom" : "Standard"}</h3>
                        </div>
                        <div className={clsx("p-2 rounded-xl", settings.logoUrl ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500")}>
                            <FaPalette className="text-sm" />
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400 font-medium relative z-10">
                        Applies to App Header & PDFs
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold">General Settings</h2>
                    <p className="text-[10px] text-slate-500">Branding and security preferences</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <FaCircleInfo className="text-[10px]" /> Unsaved Changes
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!isDirty || loading || uploading}
                        className={clsx(
                            !isDirty && "opacity-60"
                        )}
                    >
                        <FaFloppyDisk className="mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <SettingsAccordionCard
                        title="Branding & Finance"
                        icon={FaCircleInfo}
                        open={expandedSections.branding}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, branding: !prev.branding }))}
                    >
                        <div className="space-y-5">
                            <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                {settings.logoUrl ? (
                                    <div className="space-y-4 flex flex-col items-center">
                                        <div className="relative group">
                                            <img src={settings.logoUrl} alt="Logo" className="w-32 h-32 object-contain rounded-2xl shadow-xl bg-white p-3 border border-border" />
                                            <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
                                                <button
                                                    onClick={async () => {
                                                        const ok = await confirm({
                                                            title: "Remove Logo",
                                                            message: "Are you sure you want to remove the current logo?",
                                                            confirmText: "Remove Logo",
                                                            variant: "danger"
                                                        });
                                                        if (ok) setSettings({ ...settings, logoUrl: "" });
                                                    }}
                                                    className="bg-rose-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition cursor-pointer"
                                                    title="Remove Logo"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logo Active</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-3xl text-slate-400 mb-6 border border-border shadow-inner">
                                            <FaCircleInfo className="text-2xl opacity-20" />
                                        </div>
                                        <div className="text-center space-y-3">
                                            <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] p-3.5 px-8 rounded-2xl bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 border border-slate-300">
                                                <FaUpload /> Select Logo File
                                            </span>
                                            <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                                Upload Disabled. Use Logo URL field below.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Manual Logo URL (Alternative)"
                                    placeholder="https://example.com/logo.png"
                                    value={settings.logoUrl}
                                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                    icon={FaLink}
                                />
                                <Input
                                    label="Full Company Name (for PDF & Shop Link)"
                                    placeholder="Enter company name"
                                    value={settings.companyName}
                                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                />
                                <Input
                                    label="Company Slogan (Optional)"
                                    placeholder="Enter company slogan"
                                    value={settings.slogan || ""}
                                    onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                                />
                                <Input
                                    label="Company Contact Number"
                                    placeholder="e.g. +92 300 0000000"
                                    value={settings.companyPhone || ""}
                                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                />
                                <Input
                                    label="Bank Name"
                                    placeholder="e.g. State Bank of India"
                                    value={settings.bankName || ""}
                                    onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                                />
                                <Input
                                    label="Account Holder Name"
                                    placeholder="e.g. John Doe"
                                    value={settings.accountHolder || ""}
                                    onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                                />
                                <Input
                                    label="Account Number"
                                    placeholder="e.g. 03256788989"
                                    value={settings.accountNumber}
                                    onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                                />
                                <Input
                                    label="IBAN Number (optional)"
                                    placeholder="e.g. PK36SCBL0000001123456702"
                                    value={settings.iban || ""}
                                    onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                                />
                            </div>
                        </div>
                    </SettingsAccordionCard>

                    <SettingsAccordionCard
                        title="Quick Access"
                        icon={FaLink}
                        iconClassName="text-amber-500"
                        open={expandedSections.quick}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, quick: !prev.quick }))}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Link
                                href="/dashboard/reminders"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FaMessage className="text-sm" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-foreground">Reminders</div>
                                    <div className="text-[10px] text-slate-500">View your active alerts</div>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/plans"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 hover:border-amber-400 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FaGem className="text-sm" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-foreground">Subscriptions</div>
                                    <div className="text-[10px] text-slate-500">Manage your plan</div>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/support"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-400 transition-all group col-span-1 sm:col-span-2"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FaHeadset className="text-sm" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-foreground">Support Center</div>
                                    <div className="text-[10px] text-slate-500">Submit queries and get help</div>
                                </div>
                            </Link>
                        </div>
                    </SettingsAccordionCard>
                </div>

                <div className="space-y-6">
                    {/* Public Shop Link */}
                    <Card className=" border-indigo-500/20 shadow-xl overflow-hidden group p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                    <FaShop className="text-amber-500" /> Public Shop Link
                                </h3>
                                <p className="text-xs text-slate-500 font-medium italic">Share this link with your customers to browse tools</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={clsx("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", settings.shopEnabled ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-800 text-slate-500")}>
                                    {settings.shopEnabled ? "Public" : "Private"}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.shopEnabled}
                                        onChange={(e) => {
                                            setSettings(prev => ({ ...prev, shopEnabled: e.target.checked }));
                                            setIsDirty(true);
                                        }}
                                    />
                                    <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>

                        {!settings.companyName ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                                <FaCircleInfo className="text-amber-500 shrink-0" />
                                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Please set company name first to enable shop link</p>
                            </div>
                        ) : (
                            <div className={clsx("relative group transition-opacity duration-300", !settings.shopEnabled && "opacity-50 grayscale")}>
                                <div className="w-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 h-11 border border-slate-200 dark:border-white/10 rounded-xl px-4 flex items-center text-[10px] font-mono overflow-x-auto whitespace-nowrap scrollbar-hide pr-12 transition-colors">
                                    {typeof window !== 'undefined'
                                        ? `${window.location.origin}/shop/${slugify(settings.companyName)}`
                                        : `/shop/${slugify(settings.companyName)}`}
                                </div>
                                <button
                                    onClick={() => {
                                        if (!settings.shopEnabled) {
                                            showToast("Shop is private. Enable it to share link.", "error");
                                            return;
                                        }
                                        const url = `${window.location.origin}/shop/${slugify(settings.companyName)}`;
                                        navigator.clipboard.writeText(url);
                                        showToast("Link copied to clipboard!", "success");
                                    }}
                                    className="absolute right-2 top-1.5 p-2 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                                >
                                    <FaLink className="text-[10px]" />
                                </button>
                                {!settings.shopEnabled && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Shop Private</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Subscription Plan Overview */}
                    <Card className="bg-gradient-to-br from-slate-600 to-indigo-950/50 border-indigo-500/90 shadow-indigo-500/90 p-0 overflow-hidden">
                        <button
                            onClick={() => setExpandedSections(prev => ({ ...prev, plan: !prev.plan }))}
                            className="rounded-2xl w-full flex justify-between items-center p-4 hover:bg-slate-900/30 transition-colors group"
                        >
                            <div>
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                    <FaGem className="text-amber-500" /> Subscription Plan
                                </h3>
                                <p className="text-xs text-slate-500 font-medium text-left">Your tier and limits</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {planName || "Trial / Free"}
                                </span>
                                <FaArrowRight className={clsx("text-xs transition-transform duration-300 text-indigo-400", expandedSections.plan ? "rotate-90" : "rotate-0")} />
                            </div>
                        </button>
                        <div className={clsx("transition-all duration-300 ease-in-out", expandedSections.plan ? "p-4 max-h-[1000px] border-t border-indigo-500/10" : "max-h-0 opacity-0 overflow-hidden")}>

                            <div className="space-y-6">
                                <div className="p-4 bg-slate-700 rounded-2xl border border-slate-700/30">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Sales Limit Usage</p>
                                            <div className="flex items-center gap-2">
                                                <FaChartLine className="text-indigo-400 text-xs" />
                                                <span className="text-lg font-black text-slate-100">{currentSalesCount || 0} <span className="text-xs text-slate-500 font-medium">/ {salesLimit || "∞"} Sales</span></span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 justify-end">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1 shadow-inner">
                                        <div
                                            className={clsx(
                                                "h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]",
                                                ((currentSalesCount || 0) / (salesLimit || 1)) > 0.9 ? "bg-rose-500" : "bg-indigo-500"
                                            )}
                                            style={{ width: `${Math.min(100, ((currentSalesCount || 0) / (salesLimit || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-2 font-medium">
                                        Account will be automatically paused if you exceed {salesLimit || "unlimited"} sales details.
                                    </p>
                                </div>

                                <div className="bg-indigo-300 border border-indigo-500/10 rounded-xl p-3 flex items-start gap-3">
                                    <FaCircleInfo className="text-indigo-400 text-sm mt-0.5" />
                                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium flex-1">
                                        To upgrade your plan or increase your sales limit, please view our available plans or contact the administrator.
                                    </p>
                                    <Link href="/dashboard/plans" className="shrink-0 flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                                        View Plans <FaArrowRight className="text-[8px]" />
                                    </Link>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-slate-700/50">
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest">Plan Features</p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        {[
                                            { key: 'export', label: 'Export Data' },
                                            { key: 'pdf', label: 'PDF Invoices' },
                                            { key: 'whatsappAlerts', label: 'WhatsApp Alerts' },
                                            { key: 'editReminders', label: 'Custom Reminders' },
                                            { key: 'support', label: 'Priority Support' },
                                            { key: 'exportPreference', label: 'Custom Export' },
                                            { key: 'importData', label: 'Import CSV' },
                                            { key: 'dateRangeFilter', label: 'Date Filters' },
                                        ].map(({ key, label }) => {
                                            const isEnabled = planFeatures?.[key as keyof typeof planFeatures];
                                            return (
                                                <div key={key} className={clsx(
                                                    "flex items-center gap-2",
                                                    isEnabled ? "text-green-300" : "text-black line-through decoration-rose-500/50 decoration-1"
                                                )}>
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full", isEnabled ? "bg-emerald-500" : "bg-red-800")} />
                                                    {label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <SettingsAccordionCard
                        title="Administrative Security"
                        icon={FaKey}
                        iconClassName="text-orange-500"
                        open={expandedSections.security}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, security: !prev.security }))}
                    >
                        <div className="space-y-4">
                            <Input label="Admin Email" value={user?.email || ""} readOnly disabled className="opacity-70" />
                            <div className="p-4 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest mb-2">Password Management</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-slate-500 max-w-[200px]">Send a recovery email to update your admin password.</p>
                                    <Button onClick={handlePasswordReset} variant="secondary" className="min-h-9 px-3 py-1.5 text-[10px]">
                                        Send Reset Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SettingsAccordionCard>

                    <SettingsAccordionCard
                        title="Export Preferences"
                        icon={FaFileCsv}
                        iconClassName="text-emerald-500"
                        open={expandedSections.export}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, export: !prev.export }))}
                    >
                        <div className="space-y-6">
                            <PlanFeatureGuard
                                feature="export"
                                fallback={
                                    <div className="p-6 rounded-2xl border border-border bg-amber-500/5">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <FaKey />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-black text-sm text-foreground">Data Retention Locked</div>
                                                <div className="text-[11px] text-muted-foreground">Upgrade your plan to enable export and automatic retention cleanup.</div>
                                                <Link href="/dashboard/plans" className="inline-flex items-center gap-1 mt-3 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:underline">
                                                    Upgrade Plan <FaArrowRight className="text-[9px]" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                <div className="p-5 rounded-2xl border border-border bg-muted/20">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-black uppercase tracking-widest text-foreground">Data Retention</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                Your plan retains data for <span className="font-bold">{(dataRetentionMonths ?? 0)} month(s)</span>. Older records are reviewed by the Owner.
                                            </div>
                                            {(dataRetentionMonths ?? 0) > 0 && (
                                                <div className="text-[10px] text-muted-foreground mt-2">
                                                    Oldest kept date: <span className="font-bold">
                                                        {new Date(new Date().setMonth(new Date().getMonth() - (dataRetentionMonths ?? 0))).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <Link href="/dashboard/plans" className="btn-view text-[10px] px-3">Upgrade Plan</Link>
                                    </div>
                                </div>
                            </PlanFeatureGuard>

                            <PlanFeatureGuard
                                feature="exportPreference"
                                fallback={
                                    <div className="p-8 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-3">
                                            <FaKey className="text-xl" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Export Preferences Locked</h3>
                                        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">Upgrade your plan to customize your CSV export columns.</p>
                                        <Link href="/dashboard/plans" className="text-xs font-black text-amber-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                            Upgrade Plan <FaArrowRight className="text-[9px]" />
                                        </Link>
                                    </div>
                                }
                            >
                                <div className="space-y-4">
                                    <div className="p-6 bg-gradient-to-br rounded-2xl border border-border shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <p className="text-xs font-black uppercase tracking-widest">CSV Export Columns</p>
                                            <span className="text-[9px] text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full font-bold">
                                                {Object.values(settings.exportPreferences).filter(Boolean).length}/{Object.keys(settings.exportPreferences).length} Selected
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {Object.keys(settings.exportPreferences).map((field) => (
                                                <label key={field} className="flex items-center gap-3 cursor-pointer group p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                                    <div className="relative inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={settings.exportPreferences[field]}
                                                            onChange={(e) => {
                                                                setSettings({
                                                                    ...settings,
                                                                    exportPreferences: {
                                                                        ...settings.exportPreferences,
                                                                        [field]: e.target.checked
                                                                    }
                                                                });
                                                            }}
                                                        />
                                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{field}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </PlanFeatureGuard>
                        </div>
                    </SettingsAccordionCard>

                    <SettingsAccordionCard
                        title="Interface & Experience"
                        icon={FaPalette}
                        iconClassName="text-indigo-500"
                        open={expandedSections.interface}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, interface: !prev.interface }))}
                    >
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border p-4">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1 h-3 bg-indigo-500 rounded-full" /> Sidebar Appearance Mode
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {([
                                        { key: "auto", label: "Auto Theme" },
                                        { key: "light", label: "Always Light" },
                                        { key: "dark", label: "Always Dark" },
                                    ] as const).map((opt) => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            disabled={savingSidebarMode}
                                            onClick={async () => {
                                                if (!merchantId) return;
                                                setSidebarMode(opt.key);
                                                setSidebarModeLocal(opt.key);
                                                setSavingSidebarMode(true);
                                                try {
                                                    await setDoc(doc(db, "users", merchantId, "settings", "general"), { sidebarMode: opt.key }, { merge: true });
                                                    showToast("Sidebar mode updated", "success");
                                                } catch (e: any) {
                                                    showToast("Error: " + e.message, "error");
                                                } finally {
                                                    setSavingSidebarMode(false);
                                                }
                                            }}
                                            className={clsx(
                                                "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                sidebarModeLocal === opt.key
                                                    ? "bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white border-indigo-500"
                                                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic">
                                    Auto uses the owner’s sidebar colors for light/dark themes. Always Light/Always Dark keeps the sidebar consistent even when you switch theme.
                                </p>
                            </div>
                        </div>
                    </SettingsAccordionCard>

                    <SettingsAccordionCard
                        title="System Preferences"
                        icon={FaGear}
                        iconClassName="text-slate-500"
                        open={expandedSections.system}
                        onToggle={() => setExpandedSections(prev => ({ ...prev, system: !prev.system }))}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition cursor-default border border-border">
                                <div>
                                    <div className="font-bold text-xs text-foreground">Theme Preference</div>
                                    <div className="text-[10px] text-muted-foreground">Switch system appearance</div>
                                </div>
                                <Button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} variant="secondary" className="min-h-9 px-3 py-1.5 text-[10px]">
                                    {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition cursor-default border border-border">
                                <div>
                                    <div className="font-bold text-xs text-rose-600">Clear Cache</div>
                                    <div className="text-[10px] text-muted-foreground">Clear local session data</div>
                                </div>
                                <Button
                                    variant="danger"
                                    className="min-h-9 px-3 py-1.5 text-[10px]"
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: "Clear Cache",
                                            message: "This will clear all local settings and reload the app. Any unsaved data will be lost.",
                                            confirmText: "Reset Now",
                                            variant: "danger"
                                        });
                                        if (ok) {
                                            localStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                >
                                    Reset Now
                                </Button>
                            </div>
                        </div>
                    </SettingsAccordionCard>
                </div>
            </div>
        </div>
    );
}
