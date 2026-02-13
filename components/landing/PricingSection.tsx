"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plan, PlanFeatures } from "@/types";
import { FaCheck, FaXmark, FaGem, FaBuilding, FaWhatsapp, FaArrowLeft, FaCircleCheck } from "react-icons/fa6";
import clsx from "clsx";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function PricingSection({ appConfig }: { appConfig: any }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
    const [planCategory, setPlanCategory] = useState<"personal" | "business">("personal");

    // Request Modal State
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", whatsapp: "" });
    const [submitting, setSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const plansSnap = await getDocs(collection(db, "plans"));
                const plansData = plansSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Plan))
                    .filter(p => p.isPublic !== false); // Filter out private plans
                plansData.sort((a, b) => (a.salesLimit || 0) - (b.salesLimit || 0));
                setPlans(plansData);
            } catch (error) {
                console.error("Error loading plans:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPlans();
    }, []);

    const handleRequestPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setShowRequestModal(true);
    };

    const handleSubmitRequest = async () => {
        if (!formData.name || !formData.email || !formData.whatsapp) {
            alert("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "notifications"), {
                type: "public_plan_request",
                isPublicRequest: true,
                name: formData.name,
                email: formData.email,
                whatsapp: formData.whatsapp,
                planId: selectedPlan?.id,
                planName: selectedPlan?.name,
                status: "unread",
                createdAt: serverTimestamp(),
                message: `Public user ${formData.name} requested ${selectedPlan?.name} plan. Email: ${formData.email}, WhatsApp: ${formData.whatsapp}`
            });

            // DO NOT close modal, show success state instead
            setRequestSuccess(true);
            setSubmitting(false); // Stop loading

        } catch (error: any) {
            alert("Error submitting request: " + error.message);
            setSubmitting(false);
        }
    };

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

    const displayedPlans = plans
        .filter(p => (p.category || 'personal') === planCategory)
        .slice(0, 3);

    const marketingTitleForIndex = (idx: number) => {
        if (planCategory === "business") return "Business";
        if (idx === 0) return "Starter";
        if (idx === 1) return "Pro";
        return "Business";
    };

    const marketingDescriptionForIndex = (idx: number) => {
        if (planCategory === "business" || idx >= 2) {
            return "Staff accounts, priority support, advanced analytics, custom limits.";
        }
        if (idx === 0) {
            return "For new resellers — Core dashboard, limited monthly sales, email support.";
        }
        return "Unlimited sales, inventory management, WhatsApp reminders, and analytics.";
    };

    const shouldShowPrice = (plan: Plan) => typeof plan.price === "number" && plan.price > 0;

    return (
        <section id="plans" className="scroll-mt-32 py-32 bg-background relative transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">Simple Pricing</h2>
                    <p className="text-muted-foreground text-lg">
                        Start with a <span className="text-primary font-bold">7-day free trial</span> on any plan.
                    </p>
                </motion.div>

                {/* Toggles */}
                <div className="flex flex-col items-center gap-6 mb-16">
                    <div className="bg-secondary p-1.5 rounded-2xl border border-border flex items-center gap-1">
                        {["personal", "business"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setPlanCategory(cat as any)}
                                className={clsx(
                                    "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                    planCategory === cat ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm font-bold">
                        <span className={billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}>Monthly</span>
                        <button
                            onClick={() => setBillingPeriod(p => p === "monthly" ? "yearly" : "monthly")}
                            className="w-14 h-8 bg-secondary rounded-full border border-border relative px-1 transition-colors"
                        >
                            <div className={clsx(
                                "w-6 h-6 bg-primary rounded-full transition-transform duration-300",
                                billingPeriod === "yearly" ? "translate-x-6" : ""
                            )} />
                        </button>
                        <span className={billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}>
                            Yearly <span className="text-primary text-[10px] ml-1">SAVE 20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                            <MorphingSquare message="Loading Plans..." className="bg-primary" />
                        </div>
                    ) : (
                        displayedPlans.map((plan, i) => {
                            const isBestValue = i === 1;
                            const marketingTitle = marketingTitleForIndex(i);
                            const marketingDesc = marketingDescriptionForIndex(i);
                            const isContactSales = !!plan.isContactOnly || marketingTitle === "Business" || !shouldShowPrice(plan);

                            const CardContent = (
                                <div className={clsx(
                                    "relative p-8 rounded-[2rem] border transition-all duration-300 flex flex-col h-full",
                                    isBestValue ? "bg-card border-transparent" : "bg-card/50 border-border hover:border-primary/30"
                                )}>
                                    {isBestValue && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest z-20">
                                            Best Value
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-foreground mb-3">{marketingTitle}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {marketingDesc}
                                        </p>
                                        {shouldShowPrice(plan) && (
                                            <div className="flex items-baseline gap-1 mt-5">
                                                <span className="text-4xl font-black text-foreground">
                                                    ₹{billingPeriod === "monthly" ? plan.price : Math.floor((plan.price * 12) * 0.8)}
                                                </span>
                                                <span className="text-muted-foreground font-bold text-sm">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {FEATURE_ORDER.map(({ key, label }) => {
                                            const isEnabled = plan.planFeatures?.[key as keyof PlanFeatures];
                                            return (
                                                <li key={key} className="flex items-center gap-3 text-sm">
                                                    {isEnabled ? (
                                                        <FaCheck className="text-primary text-xs shrink-0" />
                                                    ) : (
                                                        <FaXmark className="text-muted text-xs shrink-0" />
                                                    )}
                                                    <span className={clsx(
                                                        "transition-colors",
                                                        isEnabled ? "text-foreground" : "text-muted-foreground line-through"
                                                    )}>
                                                        {label}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>

                                    <button
                                        onClick={() => handleRequestPlan(plan)}
                                        className={clsx(
                                            "w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95",
                                            isBestValue ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-transparent border border-border text-foreground hover:bg-secondary"
                                        )}
                                    >
                                        {isContactSales ? "Contact Sales" : "Start Free Trial"}
                                    </button>
                                </div>
                            );

                            return (
                                <div key={plan.id} className={clsx("h-full", isBestValue && "z-10 scale-105")}>
                                    {isBestValue ? (
                                        <BackgroundGradient className="rounded-[2rem] h-full bg-card" containerClassName="h-full">
                                            {CardContent}
                                        </BackgroundGradient>
                                    ) : (
                                        CardContent
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-10 text-center text-xs text-muted-foreground">
                    Plans and feature limits are managed by the platform owner and may vary. Start a 7-day free trial to evaluate.
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                    >
                        {!requestSuccess ? (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl transition-colors"
                            >
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
                                >
                                    <FaXmark className="text-lg" />
                                </button>

                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                                        <FaGem className="text-3xl" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Join {selectedPlan?.name}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Fill in your details to request access</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {/* Form Fields */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. john@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. +1 234 567 8900"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRequestModal(false)}
                                        className="flex-1 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await handleSubmitRequest();
                                            setRequestSuccess(true);
                                        }}
                                        disabled={submitting}
                                        className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Sending..." : "Submit Request"}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative transition-colors"
                            >
                                <button
                                    onClick={() => { setShowRequestModal(false); setRequestSuccess(false); }}
                                    className="absolute top-6 right-6 w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
                                >
                                    <FaXmark className="text-lg" />
                                </button>

                                <FaCircleCheck className="text-7xl text-indigo-600 mx-auto mb-8" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2">Order Requested!</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                                    Your request has been sent to the owner. Please complete the payment to receive your credentials.
                                </p>

                                <div className="bg-slate-50 dark:bg-black rounded-[2rem] p-8 text-left space-y-4 mb-10 border border-slate-100 dark:border-white/10 transition-colors">
                                    <h4 className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <FaBuilding /> Owner Payment Info
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Bank Name</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{appConfig?.bankName || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Account No</span>
                                            <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">{appConfig?.accountNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">IBAN</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{appConfig?.iban || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Holder</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{appConfig?.accountHolder || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {appConfig?.ownerWhatsApp && (
                                    <a
                                        href={`https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hi, I requested the ${selectedPlan?.name} plan. Here is my payment proof.`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl mb-4 hover:shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-primary/20"
                                    >
                                        <FaWhatsapp className="text-xl" /> Send Proof on WhatsApp
                                    </a>
                                )}

                                <button
                                    onClick={() => { setShowRequestModal(false); setRequestSuccess(false); }}
                                    className="w-full btn-secondary transition-all shadow-xl shadow-slate-200 dark:shadow-black/30"
                                >
                                    <FaArrowLeft className="text-xl" />
                                    Go Back
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
