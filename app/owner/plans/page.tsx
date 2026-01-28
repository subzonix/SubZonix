"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaPlus, FaTrash, FaPen, FaCircleCheck, FaCircleXmark, FaToggleOn, FaToggleOff } from "react-icons/fa6";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { Plan, PlanFeatures } from "@/types";
import clsx from "clsx";

const DEFAULT_PLAN_FEATURES: PlanFeatures = {
    export: true,
    pdf: true,
    whatsappAlerts: true,
    editReminders: true,
    support: true,
    exportPreference: true,
    importData: true,
    dateRangeFilter: true,
    // Page Access Defaults
    dashboard: true,
    newSale: true,
    expiry: true,
    pending: true,
    vendors: true,
    inventory: true,
    history: true,
    customers: true,
    analytics: true,
    settings: true,
    mart: true,
    customBranding: true,
};

export default function PlansManagementPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPlan, setNewPlan] = useState({
        name: "",
        salesLimit: 100,
        price: 0,
        yearlyDiscount: 20,
        level: 1,
        isContactOnly: false,
        isPublic: true,
        category: 'personal',
        dataRetentionMonths: 0,
        features: [] as string[],
        planFeatures: { ...DEFAULT_PLAN_FEATURES }
    });
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [featureInput, setFeatureInput] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "plans"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
            setPlans(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleAddFeature = () => {
        if (!featureInput.trim()) return;
        if (editingPlan) {
            setEditingPlan({ ...editingPlan, features: [...(editingPlan.features || []), featureInput.trim()] });
        } else {
            setNewPlan({ ...newPlan, features: [...newPlan.features, featureInput.trim()] });
        }
        setFeatureInput("");
    };

    const handleRemoveFeature = (idx: number) => {
        if (editingPlan) {
            const f = [...(editingPlan.features || [])];
            f.splice(idx, 1);
            setEditingPlan({ ...editingPlan, features: f });
        } else {
            const f = [...newPlan.features];
            f.splice(idx, 1);
            setNewPlan({ ...newPlan, features: f });
        }
    };

    const handleAddPlan = async () => {
        if (!newPlan.name.trim()) return showToast("Plan name is required", "error");
        try {
            await addDoc(collection(db, "plans"), newPlan);
            setNewPlan({
                name: "", salesLimit: 100, price: 0, yearlyDiscount: 20, level: plans.length + 1,
                isContactOnly: false, isPublic: true, category: 'personal', dataRetentionMonths: 0, features: [], planFeatures: { ...DEFAULT_PLAN_FEATURES }
            });
            showToast("Plan added successfully", "success");
        } catch (e: any) {
            showToast("Error adding plan: " + e.message, "error");
        }
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;
        try {
            await updateDoc(doc(db, "plans", editingPlan.id), {
                name: editingPlan.name,
                salesLimit: editingPlan.salesLimit,
                price: editingPlan.price,
                yearlyDiscount: editingPlan.yearlyDiscount || 0,
                level: editingPlan.level || 0,
                isContactOnly: editingPlan.isContactOnly || false,
                isPublic: editingPlan.isPublic ?? true,
                category: editingPlan.category || 'personal',
                dataRetentionMonths: (editingPlan as any).dataRetentionMonths || 0,
                features: editingPlan.features || [],
                planFeatures: editingPlan.planFeatures || DEFAULT_PLAN_FEATURES
            });
            setEditingPlan(null);
            showToast("Plan updated", "success");
        } catch (e: any) {
            showToast("Error updating plan: " + e.message, "error");
        }
    };

    const handleTogglePlanFeature = (featureKey: keyof PlanFeatures) => {
        if (editingPlan) {
            setEditingPlan({
                ...editingPlan,
                planFeatures: {
                    ...(editingPlan.planFeatures || DEFAULT_PLAN_FEATURES),
                    [featureKey]: !(editingPlan.planFeatures?.[featureKey] ?? true)
                }
            });
        } else {
            setNewPlan({
                ...newPlan,
                planFeatures: {
                    ...(newPlan.planFeatures || DEFAULT_PLAN_FEATURES),
                    [featureKey]: !(newPlan.planFeatures?.[featureKey] ?? true)
                }
            });
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            await deleteDoc(doc(db, "plans", id));
            showToast("Plan deleted", "success");
        } catch (e: any) {
            showToast("Error deleting: " + e.message, "error");
        }
    };

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-xl shadow-black/5 dark:shadow-black/40">
                <div>
                    <h1 className="text-xl font-black text-foreground uppercase italic tracking-widest">Plans Management</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure what users see on their upgrade page</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-4 space-y-5 bg-card border-border h-fit sticky top-24">
                    <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        {editingPlan ? <FaPen /> : <FaPlus />}
                        {editingPlan ? "Edit Subscription Plan" : "Create New Plan"}
                    </h2>

                    <div className="space-y-4">
                        <Input
                            label="Plan Name"
                            value={editingPlan ? editingPlan.name : newPlan.name}
                            onChange={(e) => editingPlan ? setEditingPlan({ ...editingPlan, name: e.target.value }) : setNewPlan({ ...newPlan, name: e.target.value })}
                            placeholder="e.g. Starter, Premium, Pro"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Monthly Price (Rs.)"
                                type="number"
                                value={editingPlan ? editingPlan.price : newPlan.price}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    editingPlan ? setEditingPlan({ ...editingPlan, price: val }) : setNewPlan({ ...newPlan, price: val })
                                }}
                            />
                            <Input
                                label="Sales Details Limit"
                                type="number"
                                value={editingPlan ? editingPlan.salesLimit : newPlan.salesLimit}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    editingPlan ? setEditingPlan({ ...editingPlan, salesLimit: val }) : setNewPlan({ ...newPlan, salesLimit: val })
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-1">Data Retention</label>
                            <select
                                value={editingPlan ? ((editingPlan as any).dataRetentionMonths ?? 0) : (newPlan as any).dataRetentionMonths}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    editingPlan ? setEditingPlan({ ...(editingPlan as any), dataRetentionMonths: val } as any) : setNewPlan({ ...(newPlan as any), dataRetentionMonths: val } as any)
                                }}
                                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            >
                                <option value={0}>Disabled</option>
                                <option value={1}>1 month</option>
                                <option value={2}>2 months</option>
                                <option value={3}>3 months</option>
                                <option value={6}>6 months</option>
                                <option value={12}>1 year</option>
                                <option value={24}>2 years</option>
                                <option value={60}>5 years</option>
                            </select>
                            <p className="text-[9px] text-slate-500 pl-1">Controls which retention options users can select. Disabled hides retention for that plan.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Yearly Discount (%)"
                                type="number"
                                value={editingPlan ? editingPlan.yearlyDiscount : newPlan.yearlyDiscount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    editingPlan ? setEditingPlan({ ...editingPlan, yearlyDiscount: val }) : setNewPlan({ ...newPlan, yearlyDiscount: val })
                                }}
                            />
                            <Input
                                label="Plan Level (Hierarchy)"
                                type="number"
                                value={editingPlan ? editingPlan.level : newPlan.level}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    editingPlan ? setEditingPlan({ ...editingPlan, level: val }) : setNewPlan({ ...newPlan, level: val })
                                }}
                                placeholder="1 = Starter, 2 = Pro..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-1">Plan Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => editingPlan ? setEditingPlan({ ...editingPlan, category: "personal" }) : setNewPlan({ ...newPlan, category: "personal" })}
                                    className={clsx(
                                        "py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                                        (editingPlan ? editingPlan.category === "personal" : newPlan.category === "personal" || !newPlan.category)
                                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                                            : "bg-muted/60 border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    Personal
                                </button>
                                <button
                                    onClick={() => editingPlan ? setEditingPlan({ ...editingPlan, category: "business" }) : setNewPlan({ ...newPlan, category: "business" })}
                                    className={clsx(
                                        "py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                                        (editingPlan ? editingPlan.category === "business" : newPlan.category === "business")
                                            ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                            : "bg-muted/60 border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    Business
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-1">Plan Type</label>
                            <button
                                onClick={() => editingPlan ? setEditingPlan({ ...editingPlan, isContactOnly: !editingPlan.isContactOnly }) : setNewPlan({ ...newPlan, isContactOnly: !newPlan.isContactOnly })}
                                className={clsx(
                                    "w-full py-2.5 rounded-xl border flex items-center justify-between px-4 transition-all text-[10px] font-bold uppercase tracking-widest",
                                    (editingPlan ? editingPlan.isContactOnly : newPlan.isContactOnly)
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                )}
                            >
                                <span>{(editingPlan ? editingPlan.isContactOnly : newPlan.isContactOnly) ? "Enterprise (Contact Only)" : "Standard (Payable)"}</span>
                                {(editingPlan ? editingPlan.isContactOnly : newPlan.isContactOnly) ? <FaToggleOn className="text-sm" /> : <FaToggleOff className="text-sm" />}
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-1">Visibility</label>
                            <button
                                onClick={() => editingPlan ? setEditingPlan({ ...editingPlan, isPublic: !(editingPlan.isPublic ?? true) }) : setNewPlan({ ...newPlan, isPublic: !newPlan.isPublic })}
                                className={clsx(
                                    "w-full py-2.5 rounded-xl border flex items-center justify-between px-4 transition-all text-[10px] font-bold uppercase tracking-widest",
                                    (editingPlan ? (editingPlan.isPublic ?? true) : newPlan.isPublic)
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                        : "bg-muted/60 border-border text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <span>{(editingPlan ? (editingPlan.isPublic ?? true) : newPlan.isPublic) ? "Publicly Visible" : "Hidden (Private)"}</span>
                                {(editingPlan ? (editingPlan.isPublic ?? true) : newPlan.isPublic) ? <FaToggleOn className="text-sm" /> : <FaToggleOff className="text-sm" />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Features</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    placeholder="Add a feature..."
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddFeature()}
                                />
                                <button onClick={handleAddFeature} className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all">
                                    <FaPlus className="text-xs" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(editingPlan ? editingPlan.features : newPlan.features)?.map((f, i) => (
                                    <span key={i} className="px-2 py-1 bg-muted/60 border border-border rounded-lg text-[10px] text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 group">
                                        {f}
                                        <button onClick={() => handleRemoveFeature(i)} className="text-slate-500 hover:text-rose-500 transition-colors">
                                            <FaCircleXmark />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <label className="block text-[10px] text-slate-500 mb-2 uppercase font-black tracking-widest pl-1">Functional Features</label>
                        <div className="space-y-2 mb-6">
                            {[
                                { key: 'export' as keyof PlanFeatures, label: 'Export Data' },
                                { key: 'pdf' as keyof PlanFeatures, label: 'PDF Generation' },
                                { key: 'whatsappAlerts' as keyof PlanFeatures, label: 'WhatsApp Alerts' },
                                { key: 'editReminders' as keyof PlanFeatures, label: 'Edit Reminders' },
                                { key: 'support' as keyof PlanFeatures, label: 'Support Access' },
                                { key: 'exportPreference' as keyof PlanFeatures, label: 'Export Preferences' },
                                { key: 'importData' as keyof PlanFeatures, label: 'Import Data' },
                                { key: 'dateRangeFilter' as keyof PlanFeatures, label: 'Date Range Filters' },
                            ].map(({ key, label }) => {
                                const isEnabled = editingPlan
                                    ? (editingPlan.planFeatures?.[key] ?? true)
                                    : (newPlan.planFeatures?.[key] ?? true);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleTogglePlanFeature(key)}
                                        className="w-full flex items-center justify-between p-2 bg-muted/60 hover:bg-muted border border-border rounded-lg transition cursor-pointer group"
                                    >
                                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium group-hover:text-foreground transition-colors">{label}</span>
                                        {isEnabled ? (
                                            <FaToggleOn className="text-xl text-emerald-500" />
                                        ) : (
                                            <FaToggleOff className="text-xl text-slate-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <label className="block text-[10px] text-slate-500 mb-2 uppercase font-black tracking-widest pl-1">Page Access Control</label>
                        <div className="space-y-2">
                            {[
                                { key: 'dashboard' as keyof PlanFeatures, label: 'Dashboard Overview' },
                                { key: 'newSale' as keyof PlanFeatures, label: 'New Sale Page' },
                                { key: 'expiry' as keyof PlanFeatures, label: 'Expiry Alerts Page' },
                                { key: 'pending' as keyof PlanFeatures, label: 'Pending Payments Page' },
                                { key: 'vendors' as keyof PlanFeatures, label: 'Vendors Page' },
                                { key: 'inventory' as keyof PlanFeatures, label: 'Inventory Page' },
                                { key: 'history' as keyof PlanFeatures, label: 'Sales History Page' },
                                { key: 'customers' as keyof PlanFeatures, label: 'Customers Page' },
                                { key: 'analytics' as keyof PlanFeatures, label: 'Analytics Page' },
                                { key: 'settings' as keyof PlanFeatures, label: 'Settings Page' },
                                { key: 'mart' as keyof PlanFeatures, label: 'Public Mart/Shop Page' },
                                { key: 'customBranding' as keyof PlanFeatures, label: 'Custom Branding (Logo)' },
                            ].map(({ key, label }) => {
                                const isEnabled = editingPlan
                                    ? (editingPlan.planFeatures?.[key] ?? true)
                                    : (newPlan.planFeatures?.[key] ?? true);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleTogglePlanFeature(key)}
                                        className="w-full flex items-center justify-between p-2 bg-muted/60 hover:bg-muted border border-border rounded-lg transition cursor-pointer group"
                                    >
                                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium group-hover:text-foreground transition-colors">{label}</span>
                                        {isEnabled ? (
                                            <FaToggleOn className="text-xl text-emerald-500" />
                                        ) : (
                                            <FaToggleOff className="text-xl text-slate-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-border">
                        {editingPlan && (
                            <Button variant="outline" className="flex-1" onClick={() => { setEditingPlan(null); setFeatureInput(""); }}>Cancel</Button>
                        )}
                        <Button className="flex-1" onClick={editingPlan ? handleUpdatePlan : handleAddPlan}>
                            {editingPlan ? "Update Plan" : "Create Plan"}
                        </Button>
                    </div>
                </Card>

                {/* List Section */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center text-slate-500 animate-pulse font-bold uppercase tracking-widest">Loading Plans...</div>
                        ) : plans.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border flex flex-col items-center gap-4">
                                <FaPlus className="text-3xl opacity-20" />
                                <p className="font-bold uppercase tracking-widest">No plans defined yet.</p>
                            </div>
                        ) : (
                            plans.map(plan => (
                                <Card key={plan.id} className="bg-card border-border group hover:border-indigo-500/30 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-black/40 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-foreground uppercase tracking-widest italic">{plan.name}</h3>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-xl font-black text-indigo-400">₹{plan.price}</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">/ Month</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingPlan(plan)} className="p-2 bg-muted/60 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-muted rounded-xl transition cursor-pointer border border-border"><FaPen className="text-xs" /></button>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-muted/60 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-muted rounded-xl transition cursor-pointer border border-border"><FaTrash className="text-xs" /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-border rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Sales Limit</p>
                                                <p className="font-black text-emerald-500 text-sm whitespace-nowrap">{plan.salesLimit} ORD</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-border rounded-xl text-center">
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Level {plan.level}</p>
                                                <p className="text-[10px] text-amber-500 font-black uppercase">{plan.isContactOnly ? "Enterprise" : "Standard"}</p>
                                            </div>
                                        </div>
                                        {(plan.yearlyDiscount || 0) > 0 && (
                                            <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-md text-center">
                                                Yearly Discount: {plan.yearlyDiscount}% Off
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                                            {plan.features?.slice(0, 4).map((f, i) => (
                                                <span key={i} className="text-[10px] text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md border border-border">
                                                    <FaCircleCheck className="text-indigo-500 text-[8px]" /> {f}
                                                </span>
                                            ))}
                                            {(plan.features?.length || 0) > 4 && (
                                                <span className="text-[10px] text-slate-500 font-bold">+{plan.features.length - 4} more</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <FaCircleCheck className="text-xl" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Impact of Changes</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                Changes made here reflect immediately on the user-facing "View Plans" page. Ensure the sales limit matches your hosting/operation costs as users will be automatically paused upon reaching these limits.
                            </p>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
