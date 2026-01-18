"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Added db import
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore"; // Added Firestore imports
import { useTheme } from "next-themes";
import { PlanFeatures } from "@/types";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    role: "owner" | "user" | null;
    status: "active" | "pending" | "paused" | null;
    planName?: string;
    salesLimit?: number;
    currentSalesCount?: number;
    planFeatures?: PlanFeatures;
    appName: string;
    appLogoUrl: string;
    accentColor: string;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    role: null,
    status: null,
    planName: undefined,
    salesLimit: undefined,
    currentSalesCount: undefined,
    planFeatures: undefined,
    appName: "Admin Console",
    appLogoUrl: "",
    accentColor: "#4f46e5"
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<"owner" | "user" | null>(null);
    const [status, setStatus] = useState<"active" | "pending" | "paused" | null>(null);
    const [planName, setPlanName] = useState<string | undefined>(undefined);
    const [salesLimit, setSalesLimit] = useState<number | undefined>(undefined);
    const [currentSalesCount, setCurrentSalesCount] = useState<number | undefined>(undefined);
    const [planFeatures, setPlanFeatures] = useState<PlanFeatures | undefined>(undefined);
    const [appName, setAppName] = useState("Admin Console");
    const [appLogoUrl, setAppLogoUrl] = useState("");
    const [accentColor, setAccentColor] = useState("#4f46e5");
    const { setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchAppConfig = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", "app_config"));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.appName) setAppName(data.appName);
                    if (data.appLogoUrl) setAppLogoUrl(data.appLogoUrl);
                    if (data.accentColor) setAccentColor(data.accentColor);
                }
            } catch (err) {
                console.error("Error fetching app config:", err);
            }
        };
        fetchAppConfig();

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const now = Date.now();
                const savedLoginTime = localStorage.getItem("loginTime");

                if (savedLoginTime && now - parseInt(savedLoginTime) > 6 * 60 * 60 * 1000) {
                    // Session expired
                    await firebaseSignOut(auth);
                    localStorage.removeItem("loginTime");
                    setUser(null);
                    setRole(null);
                    setStatus(null);
                    router.push("/login");
                    return;
                }

                if (!savedLoginTime) {
                    localStorage.setItem("loginTime", now.toString());
                }

                // --- Role & Status Check ---
                let userRole: "owner" | "user" = "user";
                let userStatus: "active" | "pending" | "paused" = "pending";

                if (currentUser.email === process.env.NEXT_PUBLIC_OWNER_EMAIL) {
                    userRole = "owner";
                    userStatus = "active";
                } else {
                    try {
                        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            userRole = data.role || "user";
                            // If user is owner in DB/Env, force active
                            if (userRole === "owner") userStatus = "active";
                            else userStatus = data.status || "pending";

                            setPlanName(data.planName);
                            setSalesLimit(data.salesLimit);
                            setCurrentSalesCount(data.currentSalesCount);

                            // Fetch plan features if user has a plan
                            if (data.planName) {
                                try {
                                    // Query plans collection by name field
                                    const plansQuery = query(
                                        collection(db, "plans"),
                                        where("name", "==", data.planName)
                                    );
                                    const plansSnap = await getDocs(plansQuery);
                                    if (!plansSnap.empty) {
                                        const planData = plansSnap.docs[0].data();
                                        setPlanFeatures(planData.planFeatures || {
                                            export: true,
                                            pdf: true,
                                            whatsappAlerts: true,
                                            editReminders: true,
                                            support: true,
                                            exportPreference: true,
                                            importData: true,
                                            dateRangeFilter: true,
                                        });
                                    }
                                } catch (err) {
                                    console.error("Error fetching plan features:", err);
                                }
                            }
                        } else {
                            // User doc doesn't exist yet (maybe very fresh register, or migrated user)
                            // Treat as pending unless owner
                            userStatus = "pending";
                        }
                    } catch (error) {
                        console.error("Error fetching user profile:", error);
                    }
                }

                setRole(userRole);
                setStatus(userStatus);
                setUser(currentUser);

                // --- Protected Route Logic ---
                if (pathname.startsWith("/login")) {
                    if (userRole === "owner") router.push("/owner");
                    else router.push("/dashboard");
                }

                // Owner Redirects
                if (userRole === "owner") {
                    // Owner accessing root or dashboard should go to owner panel
                    if (pathname === "/" || pathname === "/dashboard") {
                        router.push("/owner");
                    }
                }

                // User Redirects
                if (userRole !== "owner") {
                    // Prevent access to owner pages
                    if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) {
                        router.push("/dashboard");
                    }

                    // Handle status-based redirects
                    if (userStatus === "pending") {
                        // Pending users can only access verification-pending page and public homepage
                        if (!pathname.startsWith("/verification-pending") && pathname !== "/" && !pathname.startsWith("/login")) {
                            router.push("/verification-pending");
                        }
                    } else if (userStatus === "paused") {
                        // Paused users can only access access-paused page and public homepage
                        if (!pathname.startsWith("/access-paused") && pathname !== "/" && !pathname.startsWith("/login")) {
                            router.push("/access-paused");
                        }
                    } else if (userStatus === "active") {
                        // Active users: redirect from status pages to dashboard
                        if (pathname.startsWith("/verification-pending") || pathname.startsWith("/access-paused")) {
                            router.push("/dashboard");
                        }
                        // Active users: redirect from public homepage to dashboard (only if not intentionally visiting)
                        if (pathname === "/") {
                            router.push("/dashboard");
                        }
                    }
                }

            } else {
                localStorage.removeItem("loginTime");
                setUser(null);
                setRole(null);
                setStatus(null);
                setPlanName(undefined);
                setSalesLimit(undefined);
                setCurrentSalesCount(undefined);
                setPlanFeatures(undefined);
                // Don't redirect to login if already on public homepage, login page, or public shop
                if (!pathname.startsWith("/login") && pathname !== "/" && !pathname.startsWith("/shop")) {
                    router.push("/login");
                }
            }
            setLoading(false);
        });

        // periodic check every minute
        const interval = setInterval(() => {
            const savedLoginTime = localStorage.getItem("loginTime");
            if (savedLoginTime && Date.now() - parseInt(savedLoginTime) > 6 * 60 * 60 * 1000) {
                firebaseSignOut(auth).then(() => {
                    localStorage.removeItem("loginTime");
                    setUser(null);
                    router.push("/login");
                });
            }
        }, 60000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [pathname, router]);

    const logout = async () => {
        localStorage.removeItem("loginTime");
        await firebaseSignOut(auth);
        setUser(null); // Clear user immediately
        setRole(null);
        setStatus(null);
        setPlanName(undefined);
        setSalesLimit(undefined);
        setCurrentSalesCount(undefined);
        setPlanFeatures(undefined);
        setTheme("dark");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                <div className="text-slate-500 animate-pulse">Loading {appName}...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user, loading, logout, role, status, planName, salesLimit, currentSalesCount, planFeatures,
            appName, appLogoUrl, accentColor
        }}>
            {children}
        </AuthContext.Provider>
    );
};
