"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaGem, FaCheck, FaWhatsapp, FaBuilding, FaCircleInfo, FaArrowLeft, FaXmark, FaCircleCheck, FaHashtag, FaGlobe, FaUser, FaBuildingColumns, FaShield, FaPaperPlane } from "react-icons/fa6";
import { MorphingSquare } from "@/components/ui/morphing-square";
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
    const [requestSuccess, setRequestSuccess] = useState(false);

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
                userEmail: user?.email || "Unknown",
                userWhatsApp: userWhatsApp,
                type: "plan_request",
                planId: selectedPlanForReq.id,
                planName: selectedPlanForReq.name,
                status: "Pending",
                createdAt: serverTimestamp(),
                requestedAt: Date.now(),
                message: `User ${user?.email || 'Unknown'} requested upgrade to ${selectedPlanForReq.name}. WhatsApp: ${userWhatsApp || 'Included in message'}`
            });

            // Show success dialog with payment details
            setShowWhatsAppModal(false);
            setRequestSuccess(true);
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        } finally {
            setRequesting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <MorphingSquare message="Loading Plans..." />
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

            {/* Order Success Modal */}
            {requestSuccess && (
                <div className="fixed inset-0 z-[300] flex  justify-center p-4  backdrop-blur-md">
                    <div className="absolute inset-0 bg-black/20"></div>

                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-900/40 border border-white/30 animate-in zoom-in-95 fade-in duration-300">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-400 to-violet-400"></div>
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-300/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300/10 rounded-full blur-3xl"></div>

                        {/* Scrollable content container */}
                        <div className="overflow-y-auto max-h-[calc(90vh-2rem)] custom-scrollbar">
                            <div className="p-6 md:p-10">
                                {/* Success Icon */}
                                <div className="relative mb-3 flex justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-xl rounded-full"></div>
                                    <div className="relative">
                                        <FaCircleCheck className="text-6xl md:text-7xl text-emerald-500 drop-shadow-lg" />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <FaCheck className="text-xs text-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="mb-3 text-center">
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-3 border border-emerald-100 shadow-sm">
                                        <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></span>
                                        Payment Required
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-tight">
                                        Order Requested
                                        <span className="block text-xl text-emerald-600 font-semibold mt-1">Successfully!</span>
                                    </h2>
                                    <p className="text-gray-500 text-sm md:text-base font-medium max-w-sm mx-auto leading-relaxed">
                                        Your request for <span className="font-bold text-indigo-600">{selectedPlanForReq?.name}</span> has been sent. Complete payment to activate your plan.
                                    </p>
                                </div>

                                {/* Payment Info Card */}
                                <div className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl md:rounded-3xl p-6 md:p-8 text-left mb-10 border border-gray-200/80 shadow-lg shadow-gray-200/30 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl shadow-sm">
                                                <FaBuilding className="text-indigo-600 text-base" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs text-gray-700 font-bold uppercase tracking-wider">
                                                    Owner Payment Details
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Secure & Verified</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Bank Name */}
                                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                                    <FaBuildingColumns className="text-xs text-gray-400" />
                                                    Bank Name
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 truncate max-w-[180px] px-3 py-1.5 bg-gray-100/50 rounded-lg">
                                                    {appConfig?.bankName || "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Account Number */}
                                        <div className="group hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                                    <FaHashtag className="text-xs text-gray-400" />
                                                    Account No.
                                                </span>
                                                <span className="text-base font-mono font-black text-indigo-700 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                                    {appConfig?.accountNumber || "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* IBAN */}
                                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                                    <FaGlobe className="text-xs text-gray-400" />
                                                    IBAN
                                                </span>
                                                <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100/50 px-3 py-2 rounded-lg border border-gray-200">
                                                    {appConfig?.iban || "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Account Holder */}
                                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                                    <FaUser className="text-xs text-gray-400" />
                                                    Account Holder
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-50 to-white px-3 py-2 rounded-lg border border-gray-200">
                                                    {appConfig?.accountHolder || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4 px-1">
                                    {appConfig?.ownerWhatsApp && (
                                        <a
                                            href={`https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hi, I requested the ${selectedPlanForReq?.name} plan. Here is my payment proof.\n\nEmail: ${user?.email}\nWhatsApp: ${userWhatsApp}`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group block w-full py-4 bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#25D366] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                                        >
                                            <div className="relative">
                                                <FaWhatsapp className="text-xl" />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <span>Send Payment Proof</span>
                                            <FaPaperPlane className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                        </a>
                                    )}

                                    <button
                                        onClick={() => setRequestSuccess(false)}
                                        className="group w-full py-4 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-300 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-800 flex items-center justify-center gap-2"
                                    >
                                        <FaArrowLeft className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                        <span>Back to Plans</span>
                                    </button>

                                    {/* Helper Text */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-[11px] text-gray-400 font-medium text-center">
                                            <FaShield className="inline mr-1.5 text-gray-300" />
                                            Secure payment • Manual activation • 24/7 support
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setRequestSuccess(false)}
                            className="absolute top-4 right-4 btn-delete rounded-full transition-all duration-200 z-10"
                        >
                            <FaXmark className="text-xs" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
