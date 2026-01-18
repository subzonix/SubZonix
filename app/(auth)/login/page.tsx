"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaKey, FaUserPlus, FaRightToBracket, FaCheck, FaPaperPlane, FaShop } from "react-icons/fa6";
import { useRouter } from "next/navigation";

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
    const [globalAppName, setGlobalAppName] = useState("Tapn Tools");

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const snap = await getDoc(doc(db, "settings", "app_config"));
                if (snap.exists() && snap.data().appName) {
                    setGlobalAppName(snap.data().appName);
                }
            } catch (err) {
                console.error("Error loading config:", err);
            }
        };
        fetchConfig();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (mode === "login") {
                try {
                    const userCred = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCred.user;

                    // Check if profile exists, recreate if missing
                    const { getDoc, setDoc, doc } = await import("firebase/firestore");
                    const { db } = await import("@/lib/firebase");
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    if (!userDoc.exists()) {
                        const isOwner = email === process.env.NEXT_PUBLIC_OWNER_EMAIL;
                        await setDoc(userRef, {
                            email,
                            role: isOwner ? "owner" : "user",
                            status: isOwner ? "active" : "pending",
                            createdAt: Date.now(),
                            profile: {
                                name: "Admin",
                                email: email,
                                plan: "free",
                                createdAt: Date.now()
                            }
                        });

                        // Re-initialize Settings
                        await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                            companyName: globalAppName,
                            updatedAt: Date.now()
                        }, { merge: true });
                    }

                    router.push("/dashboard");
                } catch (loginError: any) {
                    const isOwnerEmail = email === process.env.NEXT_PUBLIC_OWNER_EMAIL;
                    if (isOwnerEmail && loginError.code === "auth/user-not-found") {
                        try {
                            const userCred = await createUserWithEmailAndPassword(auth, email, password);
                            const user = userCred.user;
                            const { setDoc, doc } = await import("firebase/firestore");
                            const { db } = await import("@/lib/firebase");

                            await setDoc(doc(db, "users", user.uid), {
                                email,
                                role: "owner",
                                status: "active",
                                createdAt: Date.now(),
                                profile: { name: "Owner", email: email, plan: "premium", createdAt: Date.now() },
                                companyName: globalAppName
                            });

                            await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                                companyName: globalAppName,
                                updatedAt: Date.now()
                            }, { merge: true });

                            router.push("/dashboard");
                            return;
                        } catch (createError) {
                            throw loginError;
                        }
                    }
                    throw loginError;
                }
            } else if (mode === "register") {
                if (password !== confirmPass) throw new Error("Passwords do not match");
                if (!companyName.trim()) throw new Error("Company Name is required");

                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCred.user;
                const { setDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");

                const isOwner = email === process.env.NEXT_PUBLIC_OWNER_EMAIL;
                await setDoc(doc(db, "users", user.uid), {
                    email,
                    role: isOwner ? "owner" : "user",
                    status: isOwner ? "active" : "pending",
                    createdAt: Date.now(),
                    profile: { name: companyName, email: email, plan: "free", createdAt: Date.now() },
                    companyName
                });

                await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                    companyName: companyName,
                    updatedAt: Date.now()
                }, { merge: true });

                router.push("/dashboard");
            } else if (mode === "forgot") {
                await sendPasswordResetEmail(auth, email);
                setSuccess("Password reset link sent to your email.");
                setLoading(false);
                return;
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 rounded-3xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-md">
                {/* Background Decor */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#6366f1]/30 rounded-full blur-3xl animate-pulse"></div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl mx-auto mb-4 border-2 border-[#6366f1]/50">
                        {/* Placeholder Logo if image missing */}
                        <div className="text-2xl font-bold text-white">{globalAppName[0] || "T"}</div>
                    </div>
                    <h1 className="text-center text-2xl font-semibold text-slate-50">{globalAppName}</h1>
                    <p className="text-center text-xs text-slate-400 mb-6">AI-Powered Cloud Sales Console</p>

                    {error && <div className="mb-4 bg-red-500/20 text-red-100 p-3 rounded-lg text-xs border border-red-500/50">{error}</div>}
                    {success && <div className="mb-4 bg-emerald-500/20 text-emerald-100 p-3 rounded-lg text-xs border border-emerald-500/50">{success}</div>}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Company Name - Register Only */}
                        {mode === "register" && (
                            <div>
                                <label className="block text-slate-300 text-[11px] mb-1">Company Name</label>
                                <div className="relative">
                                    <FaShop className="absolute left-3 top-3 text-slate-500 text-xs" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                        placeholder="My Awesome Tools"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field - All Modes */}
                        <div>
                            <label className="block text-slate-300 text-[11px] mb-1">
                                {mode === "register" ? "New Admin Email" : mode === "forgot" ? "Recovery Email" : "Admin Email"}
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-3 text-slate-500 text-xs" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field - Login & Register */}
                        {mode !== "forgot" && (
                            <div>
                                <label className="block text-slate-300 text-[11px] mb-1">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-slate-500 text-xs" />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                                        {showPass ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password - Register Only */}
                        {mode === "register" && (
                            <div>
                                <label className="block text-slate-300 text-[11px] mb-1">Confirm Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-slate-500 text-xs" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Links - Login Only */}
                        {mode === "login" && (
                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-800 accent-indigo-500" />
                                    <span className="text-slate-300 hover:text-white transition">Remember me</span>
                                </label>
                                <button type="button" onClick={() => setMode("forgot")} className="text-indigo-400 hover:underline hover:text-indigo-300 text-[11px] font-semibold transition">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-1 text-white text-xs font-semibold py-2.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:brightness-110 hover:-translate-y-0.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                     ${mode === "forgot" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gradient-to-r from-[#4f46e5] to-[#6366f1]"}`}
                        >
                            {loading ? (
                                <span>Processing...</span>
                            ) : (
                                <>
                                    {mode === "login" && <><FaRightToBracket /> <span>Login to Dashboard</span></>}
                                    {mode === "register" && <><FaCheck /> <span>Create Account</span></>}
                                    {mode === "forgot" && <><FaPaperPlane /> <span>Send Reset Link</span></>}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mode Switcher */}
                    <div className="mt-6 border-t border-slate-700 pt-3 text-center">
                        {mode === "login" ? (
                            <button onClick={() => setMode("register")} className="text-[11px] text-indigo-400 font-bold hover:underline hover:text-indigo-300 transition">
                                Need an account? Register
                            </button>
                        ) : (
                            <button onClick={() => setMode("login")} className="text-[11px] text-slate-300 hover:text-white transition">
                                Back to Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
