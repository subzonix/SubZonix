"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
    FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus,
    FaRightToBracket, FaCheck, FaPaperPlane, FaShop,
    FaBolt, FaUsers, FaBell, FaChartLine, FaArrowLeft
} from "react-icons/fa6";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Turnstile from "react-turnstile";

const features = [
    { icon: FaBolt, label: "Instant Expiry Tracking", color: "text-amber-400" },
    { icon: FaUsers, label: "Shared Account Management", color: "text-indigo-400" },
    { icon: FaChartLine, label: "Auto Profit Calculation", color: "text-emerald-400" },
    { icon: FaBell, label: "Smart Renewal Alerts", color: "text-rose-400" },
];

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [companyName, setCompanyName] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const { appName } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (mode !== "forgot" && !turnstileToken) {
            setError("Please verify you are a human");
            setLoading(false);
            return;
        }

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        try {
            if (mode === "login") {
                try {
                    const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                    const user = userCred.user;
                    const { getDoc, setDoc, doc } = await import("firebase/firestore");
                    const { db } = await import("@/lib/firebase");
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);
                    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
                    const currentEmail = trimmedEmail.toLowerCase();
                    const isOwner = currentEmail === ownerEmail;
                    if (isOwner) {
                        await setDoc(userRef, {
                            email: trimmedEmail, role: "owner", status: "active",
                            createdAt: userDoc.exists() ? userDoc.data().createdAt : Date.now(),
                            profile: { name: userDoc.exists() ? (userDoc.data().profile?.name || "Admin") : "Admin", email: trimmedEmail, plan: "premium", createdAt: userDoc.exists() ? (userDoc.data().profile?.createdAt || Date.now()) : Date.now() }
                        }, { merge: true });
                        await setDoc(doc(db, "users", user.uid, "settings", "general"), { companyName: appName || "SubZonix", updatedAt: Date.now() }, { merge: true });
                    } else if (!userDoc.exists()) {
                        await setDoc(userRef, { email: trimmedEmail, role: "user", status: "active", createdAt: Date.now(), profile: { name: "User", email: trimmedEmail, plan: "free_trial_plan", createdAt: Date.now() } });
                        await setDoc(doc(db, "users", user.uid, "settings", "general"), { companyName: appName || "SubZonix", updatedAt: Date.now() }, { merge: true });
                    }
                    router.push("/dashboard");
                } catch (loginError: any) {
                    const errorCode = loginError.code;
                    const isOwnerEmail = trimmedEmail.toLowerCase() === process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
                    if (isOwnerEmail && (errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password")) {
                        try {
                            const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                            const user = userCred.user;
                            const { setDoc, doc } = await import("firebase/firestore");
                            const { db } = await import("@/lib/firebase");
                            await setDoc(doc(db, "users", user.uid), { email: trimmedEmail, role: "owner", status: "active", createdAt: Date.now(), profile: { name: "Owner", email: trimmedEmail, plan: "premium", createdAt: Date.now() }, companyName: appName || "SubZonix" });
                            await setDoc(doc(db, "users", user.uid, "settings", "general"), { companyName: appName || "SubZonix", updatedAt: Date.now() }, { merge: true });
                            router.push("/dashboard");
                            return;
                        } catch (createError: any) {
                            if (createError.code === "auth/email-already-in-use") throw new Error("Invalid password for Admin account.");
                            throw createError;
                        }
                    }
                    if (errorCode === "auth/invalid-credential" || errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") throw new Error("Invalid email or password.");
                    throw loginError;
                }
            } else if (mode === "register") {
                if (trimmedPassword !== confirmPass.trim()) throw new Error("Passwords do not match");
                if (!companyName.trim()) throw new Error("Company Name is required");
                const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                const user = userCred.user;
                const { setDoc, doc, getDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const isOwner = trimmedEmail.toLowerCase() === process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
                let planId = isOwner ? "premium" : "free_trial_plan";
                let planName = isOwner ? "Premium" : "Free Trial";
                let salesLimit = isOwner ? 1000000 : 50;
                let durationMonths = 1;
                if (!isOwner) {
                    try {
                        const configSnap = await getDoc(doc(db, "settings", "app_config"));
                        if (configSnap.exists()) {
                            const config = configSnap.data();
                            if (config.defaultSignupPlanId) {
                                const planSnap = await getDoc(doc(db, "plans", config.defaultSignupPlanId));
                                if (planSnap.exists()) { const planData = planSnap.data(); planId = config.defaultSignupPlanId; planName = planData.name; salesLimit = planData.salesLimit; }
                            }
                            if (config.trialDurationMonths !== undefined) durationMonths = config.trialDurationMonths;
                        }
                    } catch (e) { console.error("Error fetching signup config:", e); }
                }
                const expiryDate = Date.now() + (durationMonths * 30 * 24 * 60 * 60 * 1000);
                await setDoc(doc(db, "users", user.uid), { email: trimmedEmail, role: isOwner ? "owner" : "user", status: "active", createdAt: Date.now(), planId, planName, salesLimit, planExpiry: expiryDate, currentSalesCount: 0, companyName });
                await setDoc(doc(db, "users", user.uid, "settings", "general"), { companyName, updatedAt: Date.now() }, { merge: true });
                router.push("/dashboard");
            } else if (mode === "forgot") {
                await sendPasswordResetEmail(auth, trimmedEmail);
                setSuccess("Password reset link sent to your email.");
                setLoading(false);
                return;
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setLoading(false);
        }
    };

    const inputBase = "w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-foreground";

    return (
        <div className="h-screen flex overflow-hidden bg-background text-foreground transition-colors duration-500">

            {/* ── LEFT PANEL (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col justify-between bg-slate-900 dark:bg-slate-950 p-12">
                {/* Gradient blobs */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.3),transparent_55%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.2),transparent_55%)]" />
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Brand */}
                    <Link href="/" className="inline-flex items-center gap-3 mb-auto group w-fit">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                            <BrandLogo size="sm" showIcon={true} collapsed={true} />
                        </div>
                        <span className="text-xl font-black text-white">{appName || "SubZonix"}</span>
                    </Link>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col justify-center py-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Trusted by Resellers</span>
                            </div>

                            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
                                Your subscription<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                    business, automated.
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                                Track customers, expiry dates, renewals, and profits — all in one powerful dashboard built for subscription sellers.
                            </p>

                            {/* 2x2 Feature Box Cards */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {features.map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <f.icon className={`text-lg ${f.color}`} />
                                        </div>
                                        <p className="text-white text-sm font-bold leading-snug">{f.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                                {[
                                    { value: "500+", label: "Active Resellers" },
                                    { value: "99.9%", label: "Uptime" },
                                    { value: "24h", label: "Support" },
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-2xl font-black text-white">{stat.value}</p>
                                        <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — Auth Form ── */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden">
                        <FaArrowLeft className="text-xs" />
                        Home
                    </Link>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Form area — centered */}
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-[380px]">

                        {/* Mobile brand */}
                        <div className="flex flex-col items-center mb-7 lg:hidden">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden mb-3">
                                <BrandLogo size="md" showIcon={true} collapsed={true} />
                            </div>
                            <BrandLogo size="sm" showIcon={false} />
                        </div>

                        {/* Heading */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="mb-6"
                            >
                                <h1 className="text-2xl font-black text-foreground mb-1">
                                    {mode === "login" && "Welcome back 👋"}
                                    {mode === "register" && "Create account"}
                                    {mode === "forgot" && "Reset password"}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {mode === "login" && "Sign in to your dashboard"}
                                    {mode === "register" && "Start your free trial today"}
                                    {mode === "forgot" && "We'll send you a reset link"}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Alerts */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                className="mb-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs border border-red-200 dark:border-red-500/20">
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs border border-emerald-200 dark:border-emerald-500/20">
                                {success}
                            </motion.div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {/* Company Name */}
                            {mode === "register" && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Company Name</label>
                                    <div className="relative">
                                        <FaShop className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs" />
                                        <input type="text" required className={inputBase} placeholder="My Awesome Tools" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs" />
                                    <input type="email" required className={inputBase} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>

                            {/* Password */}
                            {mode !== "forgot" && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Password</label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs" />
                                        <input type={showPass ? "text" : "password"} required className={`${inputBase} pr-10`} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPass ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password */}
                            {mode === "register" && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs" />
                                        <input type="password" required className={inputBase} placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Turnstile */}
                            {mode !== "forgot" && (
                                <div className="flex justify-center my-4 overflow-hidden rounded-lg h-[65px]">
                                    <Turnstile
                                        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                                        onVerify={(token) => setTurnstileToken(token)}
                                        theme="light"
                                    />
                                </div>
                            )}

                            {/* Forgot link */}
                            {mode === "login" && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    <>
                                        {mode === "login" && <><FaRightToBracket /><span>Sign In</span></>}
                                        {mode === "register" && <><FaCheck /><span>Create Account</span></>}
                                        {mode === "forgot" && <><FaPaperPlane /><span>Send Reset Link</span></>}
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-background text-muted-foreground">
                                    {mode === "login" ? `New to ${appName || "SubZonix"}?` : "Already have an account?"}
                                </span>
                            </div>
                        </div>

                        {/* Mode switcher */}
                        {mode === "login" ? (
                            <button onClick={() => setMode("register")}
                                className="w-full py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
                                <FaUserPlus className="text-xs" />
                                Create Free Account
                            </button>
                        ) : (
                            <div className="text-center">
                                <button onClick={() => setMode("login")} className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                                    ← Back to Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
