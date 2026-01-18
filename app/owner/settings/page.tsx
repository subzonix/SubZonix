"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaFloppyDisk, FaUpload, FaWhatsapp, FaBuilding, FaPalette } from "react-icons/fa6";
import clsx from "clsx";

export default function OwnerSettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [settings, setSettings] = useState({
        ownerWhatsApp: "",
        bankName: "",
        accountNumber: "",
        iban: "",
        accountHolder: "",
        appName: "Tapn Tools",
        appLogoUrl: "",
        accentColor: "#4f46e5"
    });

    useEffect(() => {
        const load = async () => {
            const snap = await getDoc(doc(db, "settings", "app_config"));
            if (snap.exists()) {
                setSettings(prev => ({ ...prev, ...snap.data() }));
            }
        };
        load();
    }, []);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-xl font-black text-white uppercase italic tracking-widest">General App Configuration</h2>
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
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                        <h3 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <FaPalette className="text-indigo-500" /> App Branding
                        </h3>
                        <div className="space-y-5">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group mb-4">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500">
                                        {settings.appLogoUrl ? (
                                            <img src={settings.appLogoUrl} alt="App Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <FaBuilding className="text-3xl text-slate-700" />
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer">
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

                            <Input
                                label="App Dashboard Name"
                                placeholder="e.g. Tapn Tools"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                icon={FaBuilding}
                            />

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
                        </div>
                    </Card>
                </div>

                {/* Contact & Account Section */}
                <div className="space-y-6">
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                        <h3 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
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

                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                        <h3 className="text-sm font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
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
                </div>
            </div>
        </div>
    );
}
