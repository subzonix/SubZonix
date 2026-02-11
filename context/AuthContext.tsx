"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Added db import
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs, onSnapshot } from "firebase/firestore"; // Added Firestore imports
import { useTheme } from "next-themes";
import { PlanFeatures, StaffPermissions } from "@/types";

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
    appNamePart1?: string;
    appNamePart2?: string;
    colorPart1?: string;
    colorPart2?: string;
    themePreset: string;
    supportEmail: string;
    brandDisclaimer: string;
    sidebarLight: string;
    sidebarDark: string;
    sidebarMode: "auto" | "light" | "dark";
    setSidebarMode: (mode: "auto" | "light" | "dark") => void;
    dataRetentionMonths?: number;
    merchantId: string | null;
    isStaff: boolean;
    staffPermissions?: StaffPermissions;
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
    accentColor: "#4f46e5",
    appNamePart1: "Subs",
    appNamePart2: "Grow",
    colorPart1: "#3b82f6",
    colorPart2: "#10b981",
    themePreset: "indigo",
    supportEmail: "",
    brandDisclaimer: "",
    sidebarLight: "card",
    sidebarDark: "card",
    sidebarMode: "auto",
    setSidebarMode: () => { },
    dataRetentionMonths: undefined,
    merchantId: null,
    isStaff: false,
    staffPermissions: undefined
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
    const [appName, setAppName] = useState("SubsGrow");
    const [appLogoUrl, setAppLogoUrl] = useState("");
    const [accentColor, setAccentColor] = useState("#4f46e5");
    const [themePreset, setThemePreset] = useState("indigo");
    const [supportEmail, setSupportEmail] = useState("");
    const [brandDisclaimer, setBrandDisclaimer] = useState("");
    const [sidebarLight, setSidebarLight] = useState("card");
    const [sidebarDark, setSidebarDark] = useState("card");
    const [sidebarMode, setSidebarMode] = useState<"auto" | "light" | "dark">("auto");
    const [appNamePart1, setAppNamePart1] = useState("Subs");
    const [appNamePart2, setAppNamePart2] = useState("Grow");
    const [colorPart1, setColorPart1] = useState("#3b82f6");
    const [colorPart2, setColorPart2] = useState("#10b981");
    const [dataRetentionMonths, setDataRetentionMonths] = useState<number | undefined>(undefined);
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [isStaff, setIsStaff] = useState(false);
    const [staffPermissions, setStaffPermissions] = useState<StaffPermissions | undefined>(undefined);
    const [appConfig, setAppConfig] = useState<any>(null); // Optimization

    const { setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, "settings", "app_config"),
            (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                if (data.appName) setAppName(data.appName);
                if (data.appLogoUrl) setAppLogoUrl(data.appLogoUrl);
                if (data.accentColor) setAccentColor(data.accentColor);
                if (data.appNamePart1) setAppNamePart1(data.appNamePart1);
                if (data.appNamePart2) setAppNamePart2(data.appNamePart2);
                if (data.colorPart1) setColorPart1(data.colorPart1);
                if (data.colorPart2) setColorPart2(data.colorPart2);
                if (data.themePreset) setThemePreset(data.themePreset);
                if (data.supportEmail) setSupportEmail(data.supportEmail);
                if (data.brandDisclaimer) setBrandDisclaimer(data.brandDisclaimer);
                if (data.sidebarLight) setSidebarLight(data.sidebarLight);
                if (data.sidebarDark) setSidebarDark(data.sidebarDark);
            },
            (err) => {
                console.error("Error fetching app config:", err);
            }
        );

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

                // --- Staff & Role Check ---
                let userRole: "owner" | "user" = "user";
                let userStatus: "active" | "pending" | "paused" = "pending";
                let effectiveUid = currentUser.uid;
                let isStaffMember = false;
                let permissions: StaffPermissions | undefined = undefined;

                try {
                    // 1. Check if user is a staff member
                    const staffDocRef = doc(db, "staff_accounts", currentUser.uid);
                    const staffSnap = await getDoc(staffDocRef);

                    if (staffSnap.exists()) {
                        const staffData = staffSnap.data();
                        isStaffMember = true;
                        effectiveUid = staffData.ownerUid;
                        permissions = staffData.permissions as StaffPermissions;
                        setMerchantId(effectiveUid);
                        setIsStaff(true);
                        setStaffPermissions(permissions);

                        // Staff is always active if they can login (controlled by owner deletion)
                        userStatus = "active";
                    } else {
                        setMerchantId(currentUser.uid);
                        setIsStaff(false);
                        setStaffPermissions(undefined);
                    }

                    // DEBUG: Check values
                    const ownerEmailEnv = process.env.NEXT_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();
                    const userEmail = currentUser.email?.trim().toLowerCase();

                    console.log("[AuthContext] Checking Owner:", {
                        userEmail,
                        ownerEmailEnv,
                        match: userEmail === ownerEmailEnv
                    });

                    // 2. Fetch User/Owner Data (for Plan & Status)
                    // If staff, we fetch the OWNER's data to get the plan limits and features
                    if (userEmail && ownerEmailEnv && userEmail === ownerEmailEnv) {
                        userRole = "owner";
                        userStatus = "active";
                    } else {
                        const userDoc = await getDoc(doc(db, "users", effectiveUid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();

                            // Only set role from DB if NOT staff (staff role is virtual 'user' with permissions)
                            userRole = data.role || "user";
                            if (userRole === "owner") userStatus = "active";
                            else userStatus = data.status || "active";

                            setPlanName(data.planName);
                            setSalesLimit(data.salesLimit);
                            setCurrentSalesCount(data.currentSalesCount);

                            // Fetch plan features
                            if (data.planName) {
                                const plansQuery = query(
                                    collection(db, "plans"),
                                    where("name", "==", data.planName)
                                );
                                const plansSnap = await getDocs(plansQuery);
                                if (!plansSnap.empty) {
                                    const planData = plansSnap.docs[0].data();
                                    setPlanFeatures(planData.planFeatures || {
                                        export: true, pdf: true, whatsappAlerts: true, editReminders: true,
                                        support: true, exportPreference: true, importData: true, dateRangeFilter: true,
                                        customBranding: true, mart: true
                                    });
                                    setDataRetentionMonths(planData.dataRetentionMonths ?? 0);
                                } else {
                                    setDataRetentionMonths(0);
                                }
                            } else {
                                setDataRetentionMonths(0);
                            }
                        } else {
                            // Doc doesn't exist (new user or staff without doc)
                            if (!isStaffMember) {
                                userStatus = "active";
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
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
                    if (pathname === "/" || pathname === "/dashboard") {
                        router.push("/owner");
                    }
                }

                // User/Staff Redirects
                if (userRole !== "owner") {
                    if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) {
                        router.push("/dashboard");
                    }
                    // Status redirects... (Staff is always active so this is fine)
                    if (userStatus === "pending") {
                        if (!pathname.startsWith("/verification-pending") && pathname !== "/" && !pathname.startsWith("/login")) {
                            router.push("/verification-pending");
                        }
                    } else if (userStatus === "paused") {
                        if (!pathname.startsWith("/access-paused") && pathname !== "/" && !pathname.startsWith("/login")) {
                            router.push("/access-paused");
                        }
                    } else if (userStatus === "active") {
                        if (pathname.startsWith("/verification-pending") || pathname.startsWith("/access-paused") || pathname === "/") {
                            router.push("/dashboard");
                        }
                    }
                }

            } else {
                localStorage.removeItem("loginTime");
                setUser(null);
                setRole(null);
                setStatus(null);
                setMerchantId(null);
                setIsStaff(false);
                setStaffPermissions(undefined);
                setPlanName(undefined);
                setSalesLimit(undefined);
                setCurrentSalesCount(undefined);
                setPlanFeatures(undefined);
                if (!pathname.startsWith("/login") &&
                    pathname !== "/" &&
                    !pathname.startsWith("/shop") &&
                    !pathname.startsWith("/how-it-works") &&
                    !pathname.startsWith("/about")
                ) {
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
            unsub();
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

    useEffect(() => {
        const loadUiPrefs = async () => {
            if (!merchantId) return;
            try {
                const snap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
                if (snap.exists()) {
                    const data = snap.data() as any;
                    const mode = (data.sidebarMode as any) || "auto";
                    if (mode === "auto" || mode === "light" || mode === "dark") {
                        setSidebarMode(mode);
                    }
                }
            } catch {
            }
        };
        loadUiPrefs();
    }, [merchantId]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950">
                <MorphingSquare message="Loading..." className="bg-indigo-600" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user, loading, logout, role, status, planName, salesLimit, currentSalesCount, planFeatures,
            appName, appLogoUrl, accentColor, appNamePart1, appNamePart2, colorPart1, colorPart2, themePreset, supportEmail, brandDisclaimer, sidebarLight, sidebarDark, sidebarMode, setSidebarMode, dataRetentionMonths, merchantId, isStaff, staffPermissions
        }}>
            {children}
        </AuthContext.Provider>
    );
};
