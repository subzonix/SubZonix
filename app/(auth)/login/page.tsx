"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaKey, FaUserPlus, FaRightToBracket, FaCheck, FaPaperPlane, FaShop } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

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
    const { appName, appLogoUrl, accentColor } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        try {
            if (mode === "login") {
                try {
                    const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                    const user = userCred.user;

                    // Check if profile exists, recreate if missing
                    const { getDoc, setDoc, doc } = await import("firebase/firestore");
                    const { db } = await import("@/lib/firebase");
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    // Start of Admin Fix
                    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
                    const currentEmail = trimmedEmail.toLowerCase();
                    const isOwner = currentEmail === ownerEmail;

                    if (isOwner) {
                        // FORCE update for owner, whether doc exists or not
                        await setDoc(userRef, {
                            email: trimmedEmail, // Keep original casing for display if needed
                            role: "owner",
                            status: "active",
                            createdAt: userDoc.exists() ? userDoc.data().createdAt : Date.now(),
                            profile: {
                                name: userDoc.exists() ? (userDoc.data().profile?.name || "Admin") : "Admin",
                                email: trimmedEmail,
                                plan: "premium", // Owners always get premium/unlimited
                                createdAt: userDoc.exists() ? (userDoc.data().profile?.createdAt || Date.now()) : Date.now()
                            }
                        }, { merge: true });

                        // Also ensure settings exist
                        await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                            companyName: appName || "SubsGrow",
                            updatedAt: Date.now()
                        }, { merge: true });

                    } else if (!userDoc.exists()) {
                        // Normal user creation if doc doesn't exist
                        await setDoc(userRef, {
                            email: trimmedEmail,
                            role: "user",
                            status: "active", // AUTO-VERIFIED
                            createdAt: Date.now(),
                            profile: {
                                name: "User",
                                email: trimmedEmail,
                                plan: "free",
                                createdAt: Date.now()
                            }
                        });

                        // Re-initialize Settings
                        await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                            companyName: appName || "SubsGrow",
                            updatedAt: Date.now()
                        }, { merge: true });
                    }
                    // End of Admin Fix

                    router.push("/dashboard");
                } catch (loginError: any) {
                    // Enhanced Error Handling
                    const errorCode = loginError.code;
                    const isOwnerEmail = trimmedEmail.toLowerCase() === process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();

                    // ADMIN AUTO-CREATION LOGIC
                    // If it's the owner email and we get an error indicating login failed (could be user missing OR wrong password)
                    // We attempt to CREATE the user.
                    if (isOwnerEmail && (errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password")) {
                        try {
                            // Try to create the admin account
                            const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                            const user = userCred.user;
                            const { setDoc, doc } = await import("firebase/firestore");
                            const { db } = await import("@/lib/firebase");

                            // Create Admin Profile
                            await setDoc(doc(db, "users", user.uid), {
                                email: trimmedEmail,
                                role: "owner",
                                status: "active",
                                createdAt: Date.now(),
                                profile: { name: "Owner", email: trimmedEmail, plan: "premium", createdAt: Date.now() },
                                companyName: appName || "SubsGrow"
                            });

                            await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                                companyName: appName || "SubsGrow",
                                updatedAt: Date.now()
                            }, { merge: true });

                            router.push("/dashboard");
                            return;

                        } catch (createError: any) {
                            // If creation failed because email is in use, then the original login error was due to WRONG PASSWORD
                            if (createError.code === "auth/email-already-in-use") {
                                throw new Error("Invalid password for Admin account.");
                            }
                            // Otherwise, it's some other creation error
                            throw createError;
                        }
                    }

                    // NORMAL USER ERROR MESSAGING
                    if (errorCode === "auth/invalid-credential" || errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") {
                        throw new Error("Invalid email or password.");
                    }

                    // Fallback for other errors (network, too-many-requests etc)
                    throw loginError;
                }
            } else if (mode === "register") {
                if (trimmedPassword !== confirmPass.trim()) throw new Error("Passwords do not match");
                if (!companyName.trim()) throw new Error("Company Name is required");

                const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
                const user = userCred.user;
                const { setDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");

                const isOwner = trimmedEmail.toLowerCase() === process.env.NEXT_PUBLIC_OWNER_EMAIL?.toLowerCase();
                await setDoc(doc(db, "users", user.uid), {
                    email: trimmedEmail,
                    role: isOwner ? "owner" : "user",
                    status: "active", // AUTO-VERIFIED
                    createdAt: Date.now(),
                    profile: { name: companyName, email: trimmedEmail, plan: "free", createdAt: Date.now() },
                    companyName
                });

                await setDoc(doc(db, "users", user.uid, "settings", "general"), {
                    companyName: companyName,
                    updatedAt: Date.now()
                }, { merge: true });

                router.push("/dashboard");
            } else if (mode === "forgot") {
                await sendPasswordResetEmail(auth, trimmedEmail);
                setSuccess("Password reset link sent to your email.");
                setLoading(false);
                return;
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "An error occurred during authentication");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(15,23,42,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.20),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.06),transparent_55%)]" />
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 p-8 relative overflow-hidden backdrop-blur-sm z-10 transition-colors duration-500">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center overflow-hidden shadow-xl mx-auto mb-4 border border-indigo-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300">
                        {appLogoUrl ? (
                            <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="text-2xl font-black" style={{ color: accentColor || undefined }}>
                                {(appName?.[0] || "T").toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h1 className="text-center text-2xl font-semibold text-foreground">{appName || "SubsGrow"}</h1>
                    <p className="text-center text-xs text-muted-foreground mb-6">AI-Powered Cloud Sales Console</p>

                    {error && <div className="mb-4 bg-destructive/10 text-destructive p-3 rounded-lg text-xs border border-destructive/20">{error}</div>}
                    {success && <div className="mb-4 bg-primary/10 text-primary p-3 rounded-lg text-xs border border-primary/20">{success}</div>}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Company Name - Register Only */}
                        {mode === "register" && (
                            <div>
                                <label className="block text-muted-foreground text-[11px] mb-1 font-medium">Company Name</label>
                                <div className="relative">
                                    <FaShop className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                                        placeholder="My Awesome Tools"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field - All Modes */}
                        <div>
                            <label className="block text-muted-foreground text-[11px] mb-1 font-medium">
                                {mode === "register" ? "New Admin Email" : mode === "forgot" ? "Recovery Email" : "Admin Email"}
                            </label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field - Login & Register */}
                        {mode !== "forgot" && (
                            <div>
                                <label className="block text-muted-foreground text-[11px] mb-1 font-medium">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                        {showPass ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password - Register Only */}
                        {mode === "register" && (
                            <div>
                                <label className="block text-muted-foreground text-[11px] mb-1 font-medium">Confirm Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
                                    <input type="checkbox" className="rounded border-border bg-background accent-indigo-600 dark:accent-indigo-400" />
                                    <span className="icon-check">Remember me</span>
                                </label>
                                <button type="button" onClick={() => setMode("forgot")} className="icon-edit">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-2.5 rounded-2xl shadow-lg shadow-primary/15 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="mt-6 border-t border-border pt-3 text-center">
                        {mode === "login" ? (
                            <button onClick={() => setMode("register")} className="icon-save">
                                Need an account? Register
                            </button>
                        ) : (
                            <button onClick={() => setMode("login")} className="icon-save">
                                Back to Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
