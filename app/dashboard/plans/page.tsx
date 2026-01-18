"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaGem, FaCheck, FaWhatsapp, FaBuilding, FaCircleInfo, FaArrowLeft, FaXmark } from "react-icons/fa6";
import Link from "next/link";
import clsx from "clsx";

import { PlanFeatures, Plan } from "@/types";

const FEATURE_ORDER = [
    { key: 'dashboard', label: 'Main Dashboard' },
    { key: 'export', label: 'Export Data' },
    { key: 'pdf', label: 'PDF Invoices' },
    { key: 'whatsappAlerts', label: 'WhatsApp Alerts' },
    { key: 'editReminders', label: 'Custom Reminders' },
    { key: 'support', label: 'Priority Support' },
    { key: 'inventory', label: 'Inventory Module' },
    { key: 'analytics', label: 'Advanced Analytics' },
];

export default function PlansPage() {
    const { user, planName } = useAuth();
    const { showToast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [appConfig, setAppConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [selectedPlanForReq, setSelectedPlanForReq] = useState<Plan | null>(null);
    const [userWhatsApp, setUserWhatsApp] = useState("");
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

    useEffect(() => {
        const load = async () => {
            try {
                // Load Plans
                const plansSnap = await getDocs(collection(db, "plans"));
                const plansData = plansSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Plan))
                    .filter(p => p.isPublic !== false); // Hide non-public plans

                plansData.sort((a, b) => (a.level || 0) - (b.level || 0));
                setPlans(plansData);

                // Load App Config (Owner Info)
                const configSnap = await getDoc(doc(db, "settings", "app_config"));
                if (configSnap.exists()) {
                    setAppConfig(configSnap.data());
                }
            } catch (error) {
                console.error("Error loading plans:", error);
                showToast("Failed to load plans", "error");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleRequestUpgrade = (plan: Plan) => {
        setSelectedPlanForReq(plan);
        setShowWhatsAppModal(true);
    };

    const handleConfirmRequest = async () => {
        if (!user || !selectedPlanForReq) return;

        setRequesting(selectedPlanForReq.id);
        try {
            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                userEmail: user.email,
                userWhatsApp: userWhatsApp,
                type: "plan_request",
                planId: selectedPlanForReq.id,
                planName: selectedPlanForReq.name,
                status: "unread",
                createdAt: serverTimestamp(),
                message: `User ${user.email} requested upgrade to ${selectedPlanForReq.name}. WhatsApp: ${userWhatsApp || 'Included in message'}`
            });

            showToast(`Request for ${selectedPlanForReq.name} sent!`, "success");
            setShowWhatsAppModal(false);

            // Redirect to WhatsApp
            if (appConfig?.ownerWhatsApp) {
                const text = encodeURIComponent(`Hi, I would like to upgrade my ${appConfig?.appName || 'Tapn Tools'} account to the ${selectedPlanForReq.name} plan.\n\nEmail: ${user.email}\nWhatsApp: ${userWhatsApp}`);
                const whatsappUrl = `https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}?text=${text}`;
                window.open(whatsappUrl, '_blank');
            }
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        } finally {
            setRequesting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Plans...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <FaArrowLeft className="text-slate-500" />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic">Choose Your Plan</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Upgrade your sales limits and unlock premium capabilities</p>
                </div>
            </div>

            {/* Billing Switcher */}
            <div className="flex justify-center mb-8">
                <div className=" p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                    <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={clsx(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            billingPeriod === "monthly" ? " text-indigo-500 shadow-xl" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingPeriod("yearly")}
                        className={clsx(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                            billingPeriod === "yearly" ? "text-indigo-500 shadow-xl" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Yearly
                        <span className="absolute -top-2 -right-4 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full shadow-lg animate-bounce">20% OFF</span>
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <FaGem className="text-4xl text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No public plans available yet.</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Please contact administration</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={clsx(
                                "relative flex flex-col p-8 transition-all duration-300 border-2",
                                planName === plan.name
                                    ? "border-indigo-500 bg-indigo-500/5 shadow-indigo-500/10 scale-[1.02]"
                                    : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-xl"
                            )}
                        >
                            {planName === plan.name && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/40">
                                    Current Plan
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FaGem className={clsx(planName === plan.name ? "text-indigo-500" : "text-amber-500")} />
                                    {plan.name}
                                </h3>
                                <div className="flex flex-col gap-1 mt-4">
                                    {plan.isContactOnly ? (
                                        <span className="text-2xl font-black text-[var(--foreground)]">Contact Us</span>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-[var(--foreground)]">
                                                    Rs.{billingPeriod === "monthly"
                                                        ? plan.price
                                                        : Math.floor((plan.price * 12) * (1 - (plan.yearlyDiscount || 20) / 100))
                                                    }
                                                </span>
                                                <span className="text-slate-500 text-xs font-bold uppercase">/ {billingPeriod === "monthly" ? "Month" : "Year"}</span>
                                            </div>
                                            {billingPeriod === "yearly" && (
                                                <div className="text-[10px] text-emerald-500 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                                                    Save {plan.yearlyDiscount || 20}% with yearly billing
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Sales Limit</p>
                                    <p className="font-black text-indigo-500">{plan.salesLimit} SALES</p>
                                </div>

                                <ul className="space-y-3">
                                    {FEATURE_ORDER.map(({ key, label }) => {
                                        const isEnabled = plan.planFeatures?.[key as keyof PlanFeatures];
                                        return (
                                            <li key={key} className={clsx(
                                                "flex items-center gap-3 text-xs font-medium transition-colors",
                                                isEnabled ? "text-slate-600 dark:text-slate-500" : "text-slate-500 line-through decoration-rose-500/50"
                                            )}>
                                                <div className={clsx(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                    isEnabled ? "bg-emerald-500/10" : "bg-slate-100 dark:bg-rose-200"
                                                )}>
                                                    {isEnabled ? (
                                                        <FaCheck className="text-[8px] text-emerald-500" />
                                                    ) : (
                                                        <FaXmark className="text-[8px] text-rose-400" />
                                                    )}
                                                </div>
                                                {label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <Button
                                onClick={() => handleRequestUpgrade(plan)}
                                disabled={planName === plan.name || requesting === plan.id}
                                className={clsx("w-full py-4 mt-auto rounded-xl shadow-lg", planName === plan.name ? "opacity-50" : "")}
                                variant={planName === plan.name ? "secondary" : "primary"}
                            >
                                {requesting === plan.id
                                    ? "Processing..."
                                    : planName === plan.name
                                        ? "Current Plan"
                                        : plan.isContactOnly
                                            ? "Contact for Pricing"
                                            : (plan.salesLimit || 0) > (plans.find(p => p.name === planName)?.salesLimit || 0)
                                                ? "Upgrade to this Plan"
                                                : "Switch to this Plan"
                                }
                            </Button>
                        </Card>
                    ))
                )}
            </div>

            {/* Support Info */}
            <div className="grid md:grid-cols-2 gap-6 mt-12">
                <Card className="p-6 bg-slate-800 border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10-bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <FaWhatsapp className="text-[150px] text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <FaWhatsapp /> Instant Contact
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                            Have questions or want a custom plan? Reach out to our owner directly via WhatsApp for instant support.
                        </p>
                        {appConfig?.ownerWhatsApp ? (
                            <a
                                href={`https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                <FaWhatsapp className="text-lg" /> Chat with Owner
                            </a>
                        ) : (
                            <div className="text-[10px] text-slate-500 font-bold uppercase italic">Contact number not set by owner</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 bg-slate-800 border-slate-800 shadow-2xl">
                    <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <FaBuilding /> Payment Information
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                        After requesting an upgrade, please complete the payment to the following account and share the screenshot.
                    </p>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 whitespace-pre-wrap text-[10px] text-slate-300 font-bold font-mono">
                        {appConfig?.accountDetails || "Account details will be visible here after request."}
                    </div>
                </Card>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <FaCircleInfo className="text-xl" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Manual Activation</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Once you request a plan and make the payment, our administrator will manually activate your account within 1-2 hours. You will receive a notification once it's active.
                    </p>
                </div>
            </div>

            {/* WhatsApp Collection Modal */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md border-slate-800 shadow-2xl relative">
                        <button
                            onClick={() => setShowWhatsAppModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            <FaXmark />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                <FaWhatsapp className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-black text-emerald-500/80 uppercase italic tracking-tight">Request Upgrade</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Provide your WhatsApp for easy contact</p>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="WhatsApp Number (With Country Code)"
                                placeholder="e.g. +919000000000"
                                value={userWhatsApp}
                                onChange={(e) => setUserWhatsApp(e.target.value)}
                                icon={FaWhatsapp}
                            />

                            <div className="p-4 bg-indigo-500/20 border border-indigo-500/10 rounded-2xl">
                                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                                    <FaGem className="text-[10px]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Plan Selection</span>
                                </div>
                                <p className="text-xs font-bold">{selectedPlanForReq?.name} Plan — ₹{selectedPlanForReq?.price}/Mo</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowWhatsAppModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 shadow-lg shadow-indigo-500/20"
                                    onClick={handleConfirmRequest}
                                    disabled={!userWhatsApp.trim() || requesting !== null}
                                >
                                    {requesting ? "Sending..." : "Confirm Request"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
