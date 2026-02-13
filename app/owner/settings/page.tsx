"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaFloppyDisk, FaUpload, FaWhatsapp, FaBuilding, FaPalette, FaUserPlus } from "react-icons/fa6";
import { Plan } from "@/types";
import clsx from "clsx";

export default function OwnerSettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [settings, setSettings] = useState({
        ownerWhatsApp: "",
        bankName: "",
        accountNumber: "",
        iban: "",
        accountHolder: "",
        appName: "SubZonix",
        appNamePart1: "Sub",
        appNamePart2: "Zonix",
        colorPart1: "#0066FF",
        colorPart2: "#FF6A00",
        appLogoUrl: "",
        accentColor: "#0066FF",
        themePreset: "indigo",
        sidebarLight: "card",
        sidebarDark: "card",
        defaultSignupPlanId: "free_trial_plan",
        trialDurationMonths: 1
    });

    useEffect(() => {
        const load = async () => {
            // Load App config
            const snap = await getDoc(doc(db, "settings", "app_config"));
            if (snap.exists()) {
                setSettings(prev => ({ ...prev, ...snap.data() }));
            }

            // Load Plans for dropdown
            const plansSnap = await getDocs(collection(db, "plans"));
            const plansData = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
            setPlans(plansData);
        };
        load();
    }, []);

    // Sync appName with dynamic parts whenever they change
    useEffect(() => {
        const part1 = settings.appNamePart1 || "";
        const part2 = settings.appNamePart2 || "";
        if (part1 || part2) {
            setSettings(prev => ({ ...prev, appName: `${part1}${part2}` }));
        }
    }, [settings.appNamePart1, settings.appNamePart2]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, "settings", "app_config"), settings, { merge: true });
            showToast("App Configuration saved successfully!", "success");
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
            const storageRef = ref(storage, `branding/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                null,
                (error) => { showToast("Upload failed: " + error.message, "error"); setUploading(false); },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setSettings({ ...settings, appLogoUrl: downloadURL });
                    setUploading(false);
                    showToast("App Logo uploaded! Click Save to confirm.", "success");
                }
            );
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-xl shadow-black/5 dark:shadow-black/40">
                <div>
                    <h2 className="text-xl font-black text-foreground uppercase italic tracking-widest">General App Configuration</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global settings for all users</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading || uploading}
                    className="w-full md:w-auto px-8"
                >
                    <FaFloppyDisk className="mr-2" /> Save Settings
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Branding Section */}
                <div className="space-y-6">
                    <Card className="p-6 bg-card border-border">
                        <h3 className="text-sm font-black text-muted-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <FaPalette className="text-indigo-500" /> App Branding
                        </h3>
                        <div className="space-y-5">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group mb-4">
                                    <div className="w-24 h-24 rounded-3xl bg-muted/60 border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/40">
                                        {settings.appLogoUrl ? (
                                            <img src={settings.appLogoUrl} alt="App Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <FaBuilding className="text-3xl text-slate-700" />
                                        )}
                                        <div className="absolute inset-0 bg-black/20 dark:bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer">
                                            <label className="cursor-pointer">
                                                <FaUpload className="text-white text-xl" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">App Logo (Sidebar/Header)</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 uppercase font-black tracking-widest">Dashboard Brand Preview</label>
                                <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6">
                                    <div className="flex items-center gap-2 select-none group">
                                        <div className="relative shrink-0 w-8 h-8 md:w-12 md:h-12 overflow-hidden">
                                            {settings.appLogoUrl ? (
                                                <img src={settings.appLogoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                                                    <rect x="10" y="50" width="12" height="35" rx="2" fill="url(#p1GradPreview)" className="opacity-90" />
                                                    <rect x="28" y="35" width="12" height="50" rx="2" fill="url(#p2GradPreview)" className="opacity-90" />
                                                    <rect x="46" y="25" width="12" height="60" rx="2" fill="url(#p2GradPreview)" className="opacity-90" />

                                                    <path
                                                        d="M5 80 C 15 85, 45 85, 75 45 L 85 55 L 90 30 L 65 35 L 75 45"
                                                        fill="none"
                                                        stroke="url(#p2GradPreview)"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="drop-shadow-sm"
                                                    />
                                                    <path
                                                        d="M5 80 C 15 90, 45 95, 85 40"
                                                        fill="none"
                                                        stroke="url(#p1GradPreview)"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        className="opacity-50"
                                                    />

                                                    <defs>
                                                        <linearGradient id="p1GradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor={settings.colorPart1 || "#3b82f6"} />
                                                            <stop offset="100%" stopColor={settings.colorPart1 || "#3b82f6"} stopOpacity={0.8} />
                                                        </linearGradient>
                                                        <linearGradient id="p2GradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor={settings.colorPart2 || "#10b981"} />
                                                            <stop offset="100%" stopColor={settings.colorPart2 || "#10b981"} stopOpacity={0.8} />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="font-black tracking-tighter italic flex items-center leading-none text-2xl md:text-4xl"
                                            style={{
                                                fontFamily: "'Inter', sans-serif",
                                                textShadow: "1px 1px 0px rgba(0,0,0,0.1), 2px 2px 0px rgba(0,0,0,0.05)"
                                            }}>
                                            <span style={{ color: settings.colorPart1 || "#3b82f6" }}>
                                                {settings.appNamePart1 || "Subs"}
                                            </span>
                                            <span style={{ color: settings.colorPart2 || "#10b981" }}>
                                                {settings.appNamePart2 || "Grow"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Input
                                label="App Dashboard Name (Fallback)"
                                placeholder="e.g. SubsGrow"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                icon={FaBuilding}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Name Part 1 (e.g. Subs)"
                                    placeholder="Subs"
                                    value={settings.appNamePart1}
                                    onChange={(e) => setSettings({ ...settings, appNamePart1: e.target.value })}
                                />
                                <Input
                                    label="Color Part 1"
                                    type="color"
                                    value={settings.colorPart1}
                                    onChange={(e) => setSettings({ ...settings, colorPart1: e.target.value })}
                                    className="h-11"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Name Part 2 (e.g. Grow)"
                                    placeholder="Grow"
                                    value={settings.appNamePart2}
                                    onChange={(e) => setSettings({ ...settings, appNamePart2: e.target.value })}
                                />
                                <Input
                                    label="Color Part 2"
                                    type="color"
                                    value={settings.colorPart2}
                                    onChange={(e) => setSettings({ ...settings, colorPart2: e.target.value })}
                                    className="h-11"
                                />
                            </div>

                            <Input
                                label="Logo URL (Optional)"
                                placeholder="https://example.com/logo.png"
                                value={settings.appLogoUrl}
                                onChange={(e) => setSettings({ ...settings, appLogoUrl: e.target.value })}
                                icon={FaUpload}
                            />

                            <Input
                                label="Accent Color (Hex)"
                                placeholder="#4f46e5"
                                value={settings.accentColor}
                                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                                icon={FaPalette}
                            />

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Theme Preset</label>
                                    <select
                                        value={settings.themePreset}
                                        onChange={(e) => {
                                            const preset = e.target.value;
                                            const presetColors: Record<string, string> = {
                                                indigo: "#4f46e5",
                                                emerald: "#10b981",
                                                rose: "#e11d48",
                                                amber: "#f59e0b",
                                                slate: "#0f172a"
                                            };
                                            setSettings(prev => ({
                                                ...prev,
                                                themePreset: preset,
                                                accentColor: presetColors[preset] ?? prev.accentColor
                                            }));
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium"
                                    >
                                        <option value="indigo">Indigo (Default)</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="rose">Rose</option>
                                        <option value="amber">Amber</option>
                                        <option value="slate">Slate</option>
                                    </select>
                                    <p className="text-[9px] text-slate-500 mt-1">Preset updates the accent color; you can still override with a custom hex.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Sidebar (Light Mode)</label>
                                        <select
                                            value={settings.sidebarLight}
                                            onChange={(e) => setSettings(prev => ({ ...prev, sidebarLight: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium"
                                        >
                                            <option value="card">Card</option>
                                            <option value="background">Background</option>
                                            <option value="white">White</option>
                                            <option value="slate">Slate</option>
                                            <option value="black">Black</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Sidebar (Dark Mode)</label>
                                        <select
                                            value={settings.sidebarDark}
                                            onChange={(e) => setSettings(prev => ({ ...prev, sidebarDark: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium"
                                        >
                                            <option value="card">Card</option>
                                            <option value="background">Background</option>
                                            <option value="slate">Slate</option>
                                            <option value="black">Black</option>
                                            <option value="white">White</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Contact & Account Section */}
                <div className="space-y-6">
                    <Card className="p-6 bg-card border-border">
                        <h3 className="text-sm font-black text-muted-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <FaWhatsapp className="text-emerald-500" /> Owner Contact Info
                        </h3>
                        <div className="space-y-5">
                            <Input
                                label="Owner WhatsApp Number"
                                placeholder="+92 300 1234567"
                                value={settings.ownerWhatsApp}
                                onChange={(e) => setSettings({ ...settings, ownerWhatsApp: e.target.value })}
                                icon={FaWhatsapp}
                            />
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <p className="text-[10px] text-emerald-500/80 leading-relaxed font-bold">
                                    Users will see this number when they want to request a plan upgrade or contact support.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-card border-border">
                        <h3 className="text-sm font-black text-muted-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <FaBuilding className="text-amber-500" /> Admin/Owner Account Details
                        </h3>
                        <div className="space-y-4">
                            <Input
                                label="Bank Name / Wallet"
                                placeholder="e.g. Easypaisa / Meezan Bank"
                                value={settings.bankName}
                                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                            />
                            <Input
                                label="Account Holder Name"
                                placeholder="e.g. AbuBakar"
                                value={settings.accountHolder}
                                onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                            />
                            <Input
                                label="Account Number"
                                placeholder="e.g. 03001234567"
                                value={settings.accountNumber}
                                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                            />
                            <Input
                                label="IBAN (Optional)"
                                placeholder="e.g. PK1234567890..."
                                value={settings.iban}
                                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                            />
                            <p className="text-[9px] text-slate-600 italic mt-2">These details will be shown to users when they request a plan upgrade.</p>
                        </div>
                    </Card>

                    <Card className="p-6 bg-card border-border">
                        <h3 className="text-sm font-black text-muted-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <FaUserPlus className="text-indigo-500" /> Registration & Trial
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Default Signup Plan</label>
                                <select
                                    value={settings.defaultSignupPlanId}
                                    onChange={(e) => setSettings({ ...settings, defaultSignupPlanId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                >
                                    <option value="">Select a Plan</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} {!plan.isPublic ? "(Private)" : ""}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-500 mt-1">This plan will be automatically assigned to all new users upon registration.</p>
                            </div>

                            <Input
                                label="Trial Duration (Months)"
                                type="number"
                                placeholder="e.g. 1"
                                value={settings.trialDurationMonths}
                                onChange={(e) => setSettings({ ...settings, trialDurationMonths: parseInt(e.target.value) || 0 })}
                                icon={FaUserPlus}
                            />
                            <p className="text-[9px] text-slate-500">Number of months the auto-assigned plan will remain active before expiring.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
