"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plan } from "@/types";
import { FaGem, FaCheck, FaWhatsapp, FaXmark, FaArrowRight, FaEnvelope, FaUser, FaStar, FaShieldHalved, FaChartLine, FaCircleCheck, FaBuilding } from "react-icons/fa6";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function HomePage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", whatsapp: "" });
    const [submitting, setSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [appConfig, setAppConfig] = useState<any>(null);
    const router = useRouter();
    const { user } = useAuth();
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
    const [planCategory, setPlanCategory] = useState<"personal" | "business">("personal");

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
            return;
        }

        const loadData = async () => {
            try {
                // Load Plans
                const plansSnap = await getDocs(collection(db, "plans"));
                const plansData = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
                plansData.sort((a, b) => (a.salesLimit || 0) - (b.salesLimit || 0));
                setPlans(plansData);

                // Load App Config
                const configSnap = await getDoc(doc(db, "settings", "app_config"));
                if (configSnap.exists()) {
                    setAppConfig(configSnap.data());
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

    return (
        <div className="h-screen overflow-y-auto custom-scrollbar bg-slate-950 text-white selection:bg-indigo-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                            {appConfig?.appLogoUrl ? (
                                <img src={appConfig.appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <FaGem className="text-white text-lg" />
                            )}
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">{appConfig?.appName || "Loading..."}</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#home" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Home</a>
                        <a href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Features</a>
                        <a href="#plans" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</a>
                        <Link
                            href="/login"
                            className="px-6 py-2.5 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-sm font-black uppercase tracking-wider transition-all transform hover:scale-105"
                        >
                            Login
                        </Link>
                    </div>
                    <Link href="/login" className="md:hidden px-4 py-2 bg-white text-slate-950 rounded-lg text-sm font-bold">
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div id="home">
                <HeroGeometric
                    badge="Next Generation Sales Management"
                    title1="Scale Your Business"
                    title2="Without Limits"
                    description="The all-in-one platform for inventory tracking, customer relationships, and financial analytics. Built for modern businesses."
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <a
                            href="#plans"
                            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-base font-black uppercase tracking-wider shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            Get Started <FaArrowRight />
                        </a>
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-white rounded-2xl text-base font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                        >
                            Live Demo
                        </Link>
                    </div>
                </HeroGeometric>
            </div>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Built for Growth</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Powerful features to help you manage every aspect of your operations</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: FaChartLine,
                                title: "Smart Analytics",
                                desc: "Visualize your revenue, profit margins, and sales trends with beautiful interactive charts.",
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                icon: FaUser,
                                title: "CRM Integration",
                                desc: "Keep detailed records of all your customers, their purchase history, and preferences.",
                                color: "from-purple-500 to-pink-500"
                            },
                            {
                                icon: FaShieldHalved,
                                title: "Secure Data",
                                desc: "Enterprise-grade security ensures your sensitive business data is always protected.",
                                color: "from-amber-500 to-orange-500"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl hover:bg-slate-800/50 hover:border-white/10 transition-all duration-300 hover:-translate-y-2"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="text-2xl text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section id="plans" className="py-32 px-6 bg-slate-950/50 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Simple, Transparent Pricing</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that fits your business scale</p>
                    </motion.div>

                    {/* Switches */}
                    <div className="flex flex-col items-center gap-6 mb-16">
                        {/* Category Switcher */}
                        <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex items-center gap-1">
                            <button
                                onClick={() => setPlanCategory("personal")}
                                className={clsx(
                                    "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    planCategory === "personal" ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Personal
                            </button>
                            <button
                                onClick={() => setPlanCategory("business")}
                                className={clsx(
                                    "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    planCategory === "business" ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Business
                            </button>
                        </div>

                        {/* Billing Switcher */}
                        <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex items-center gap-1">
                            <button
                                onClick={() => setBillingPeriod("monthly")}
                                className={clsx(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    billingPeriod === "monthly" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingPeriod("yearly")}
                                className={clsx(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                                    billingPeriod === "yearly" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Yearly
                                <span className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full shadow-lg animate-bounce">20% OFF</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Plans...</p>
                            </div>
                        ) : (
                            plans.filter(p => (p.category || 'personal') === planCategory).map((plan, i) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`relative p-8 rounded-3xl border transition-all duration-300 group
                                        ${i === 1
                                            ? "bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-10"
                                            : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-800/60"
                                        }
                                    `}
                                >
                                    {i === 1 && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/30">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                                                <FaStar className="text-[10px]" /> Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            {plan.name}
                                        </h3>
                                        {plan.isContactOnly ? (
                                            <div className="text-4xl font-black text-white py-2">Contact Us</div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black text-white">
                                                        ₹{billingPeriod === "monthly"
                                                            ? plan.price
                                                            : Math.floor((plan.price * 12) * (1 - (plan.yearlyDiscount || 20) / 100))
                                                        }
                                                    </span>
                                                    <span className="text-slate-500 font-bold text-sm">/ {billingPeriod === "monthly" ? "mo" : "yr"}</span>
                                                </div>
                                                {billingPeriod === "yearly" && (
                                                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                                        Save {plan.yearlyDiscount || 20}% yearly
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Limit</span>
                                                <span className="text-indigo-400 font-black">{plan.salesLimit}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-3/4 rounded-full opacity-50" />
                                            </div>
                                        </div>

                                        <ul className="space-y-4">
                                            {(plan.features || ["Full Dashboard Access", "24/7 Support", "Secure Backups", "Mobile Access"]).slice(0, 5).map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                                                    <FaCheck className="text-emerald-500 mt-1 shrink-0" />
                                                    <span className="leading-tight">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => handleRequestPlan(plan)}
                                        className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95
                                            ${i === 1
                                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                                : "bg-white text-slate-900 hover:bg-slate-200"
                                            }
                                        `}
                                    >
                                        Get Started
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-slate-950 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                            <FaGem className="text-indigo-400 text-sm" />
                        </div>
                        <span className="text-lg font-bold text-slate-300">{appConfig?.appName || "Admin Console"}</span>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                        © 2026 {appConfig?.appName || "Admin Console"}. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors"><FaWhatsapp className="text-lg" /></a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors"><FaEnvelope className="text-lg" /></a>
                    </div>
                </div>
            </footer>

            {/* Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                    >
                        {!requestSuccess ? (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl shadow-indigo-500/10"
                            >
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
                                >
                                    <FaXmark className="text-lg" />
                                </button>

                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                                        <FaGem className="text-3xl" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Join {selectedPlan?.name}</h3>
                                    <p className="text-slate-400 text-sm">Fill in your details to request access</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {/* Form Fields */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. john@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. +1 234 567 8900"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRequestModal(false)}
                                        className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-colors uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await handleSubmitRequest();
                                            setRequestSuccess(true);
                                        }}
                                        disabled={submitting}
                                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="bg-white rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative"
                            >
                                <button
                                    onClick={() => { setShowRequestModal(false); setRequestSuccess(false); }}
                                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                                >
                                    <FaXmark className="text-lg" />
                                </button>

                                <FaCircleCheck className="text-7xl text-emerald-500 mx-auto mb-8" />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Order Requested!</h2>
                                <p className="text-slate-500 text-sm font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                                    Your request has been sent to the owner. Please complete the payment to receive your credentials.
                                </p>

                                <div className="bg-slate-50 rounded-[2rem] p-8 text-left space-y-4 mb-10 border border-slate-100">
                                    <h4 className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <FaBuilding /> Owner Payment Info
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Bank Name</span>
                                            <span className="text-xs font-black text-slate-800">{appConfig?.bankName || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Account No</span>
                                            <span className="text-sm font-mono font-black text-indigo-600">{appConfig?.accountNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">IBAN</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">{appConfig?.iban || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Holder</span>
                                            <span className="text-xs font-black text-slate-800">{appConfig?.accountHolder || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {appConfig?.ownerWhatsApp && (
                                    <a
                                        href={`https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hi, I requested the ${selectedPlan?.name} plan. Here is my payment proof.`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full py-4 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl mb-4 hover:shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FaWhatsapp className="text-xl" /> Send Proof on WhatsApp
                                    </a>
                                )}

                                <button
                                    onClick={() => { setShowRequestModal(false); setRequestSuccess(false); }}
                                    className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    Back to Plans
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
