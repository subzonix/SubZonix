"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale, ToolItem } from "@/types";
import { Card, Button, Input } from "@/components/ui/Shared";
import { FaWhatsapp, FaClock, FaCalendarDay, FaCircleInfo, FaReceipt, FaCheckDouble, FaTriangleExclamation, FaTableList, FaAddressCard, FaLock } from "react-icons/fa6";
import { cleanPhone, toHumanDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { format, subDays, addDays } from "date-fns";

export default function ExpiryPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [appConfig, setAppConfig] = useState<any>(null);
    const [expiryDate, setExpiryDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10)
    });
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const { user, merchantId } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const loadSettings = async () => {
            if (!merchantId) return;
            // Load User Settings for Company Name
            const userSettingsSnap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
            if (userSettingsSnap.exists()) setSettings(userSettingsSnap.data());

            // Load Global App Config for App Name
            const appConfigSnap = await getDoc(doc(db, "settings", "app_config"));
            if (appConfigSnap.exists()) setAppConfig(appConfigSnap.data());
        };
        loadSettings();

        if (!merchantId) return;
        const q = query(collection(db, "users", merchantId, "salesHistory"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
            setSales(data);
            setLoading(false);
        });
        return () => unsub();
    }, [user, merchantId]);

    // Helper to get all items with indices
    const allItems = useMemo(() => {
        return sales.flatMap(sale =>
            sale.items.map((item, index) => ({
                ...item,
                clientName: sale.client.name,
                clientPhone: sale.client.phone,
                loginLink: sale.loginLink,
                clientId: sale.id, // This is the Document ID
                itemIndex: index, // Index in the items array
                remindersSent: item.remindersSent || 0
            }))
        );
    }, [sales]);

    // Items for Selected Date (Today's Expiry)
    const dailyItems = useMemo(() => {
        return allItems.filter(item => item.eDate === expiryDate)
            .sort((a, b) => a.clientName.localeCompare(b.clientName));
    }, [allItems, expiryDate]);

    // Items expired in previous 3 days (-3 to -1 days)
    const previousThreeDaysItems = useMemo(() => {
        const targetDate = new Date(expiryDate);
        return allItems.filter(item => {
            const itemDate = new Date(item.eDate);
            const diffTime = itemDate.getTime() - targetDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= -3 && diffDays < 0;
        }).sort((a, b) => b.eDate.localeCompare(a.eDate)); // Newest expiry first
    }, [allItems, expiryDate]);

    // Upcoming Items (Next 4 days)
    const upcomingItems = useMemo(() => {
        const targetDate = new Date(expiryDate);
        return allItems.filter(item => {
            const itemDate = new Date(item.eDate);
            const diffTime = itemDate.getTime() - targetDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= 4;
        }).sort((a, b) => a.eDate.localeCompare(b.eDate));
    }, [allItems, expiryDate]);

    const sendReminder = async (item: any) => {
        const hDate = toHumanDate(item.eDate);
        const daysLeft = Math.ceil((new Date(item.eDate).getTime() - new Date(expiryDate).getTime()) / (1000 * 60 * 60 * 24));

        let dayLabel = "";
        if (daysLeft === -1) dayLabel = "Yesterday";
        else if (daysLeft === 0) dayLabel = "Today";
        else if (daysLeft === 1) dayLabel = "Tomorrow";
        else if (daysLeft < -1) dayLabel = `${Math.abs(daysLeft)} days ago`;
        else if (daysLeft > 1) dayLabel = `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;

        const isExpired = daysLeft < 0;
        const statusText = isExpired ? "expired" : "expiring";

        let template = settings?.reminderTemplate || `*Membership Reminder*\n\nDear *[Client]*,\n\nThe following memberships are [Status] on [Date].[DayLabel]\n\n* Tool Name : [Tool Name]\n* Email : [Email]\n\nExpiry Date : [Date]\n\nTo continue uninterrupted access, kindly confirm your renewals.\n\n> *Sent by [Company Name]*\n_© Powered by ${appConfig?.appName || "SubZonix"}_`;

        let msg = template
            .replace(/\[Client\]/g, item.clientName)
            .replace(/\[Status\]/g, statusText)
            .replace(/\[Date\]/g, hDate)
            .replace(/\[DayLabel\]/g, dayLabel ? ` (${dayLabel})` : "")
            .replace(/\[Tool Name\]/g, item.name)
            .replace(/\[Email\]/g, item.email || "N/A")
            .replace(/\[LoginLink\]/g, item.loginLink ? `\n🔗 Login Link: ${item.loginLink}` : "")
            .replace(/\[Company Name\]/g, settings?.companyName || "SubZonix");

        window.open(`https://wa.me/${cleanPhone(item.clientPhone)}?text=${encodeURIComponent(msg)}`, '_blank');
        showToast("WhatsApp opened for reminder", "info");

        // 2. Update Database Count
        try {
            if (!user) return;
            // We need to fetch the latest doc to prevent race conditions on array
            const saleRef = doc(db, "users", merchantId!, "salesHistory", item.clientId);
            const saleSnap = await getDoc(saleRef);

            if (saleSnap.exists()) {
                const saleData = saleSnap.data() as Sale;
                const updatedItems = [...saleData.items];

                // Increment count
                updatedItems[item.itemIndex] = {
                    ...updatedItems[item.itemIndex],
                    remindersSent: (updatedItems[item.itemIndex].remindersSent || 0) + 1
                };

                // Save back
                await import("firebase/firestore").then(({ updateDoc }) => {
                    updateDoc(saleRef, { items: updatedItems });
                });
                // Optimistic update locally not strictly needed as snapshot listener will catch it, but good for instant feedback logic if needed.
            }
        } catch (error) {
            console.error("Failed to update reminder count:", error);
            // Non-blocking error for user, but good to know
        }
    };

    const renderSection = (items: any[], title: string, icon: any, colorClass: string) => {
        const Icon = icon;
        return (
            <div className="space-y-4">
                {/* Section Header */}
                <div className="bg-card dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", colorClass)}>
                            <Icon className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[var(--foreground)] tracking-tight uppercase">{title}</h2>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{items.length} records found</p>
                        </div>
                    </div>
                    {title.includes("Range") && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <CalendarDateRangePicker
                                from={dateRange.from}
                                to={dateRange.to}
                                onFromChange={(v) => setDateRange(prev => ({ ...prev, from: v }))}
                                onToChange={(v) => setDateRange(prev => ({ ...prev, to: v }))}
                            />
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest">Syncing with database...</div>
                ) : items.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-[var(--card)] rounded-2xl border border-dashed border-[var(--border)]">
                        No expiration records found for this category.
                    </div>
                ) : viewMode === "card" ? (
                    /* Card View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((item, i) => {
                            const daysLeft = Math.ceil((new Date(item.eDate).getTime() - new Date(expiryDate).getTime()) / (1000 * 60 * 60 * 24));
                            const isExpired = daysLeft < 0;
                            // Red if expired OR if reminder count is 0 (urgent to send reminder)
                            const isUrgent = isExpired || (item.remindersSent || 0) === 0;

                            return (
                                <div key={i} className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs border border-[var(--border)]">
                                                {item.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-[var(--foreground)] mb-0.5">{item.clientName}</div>
                                                <div className="text-[10px] font-bold text-slate-400">{item.clientPhone}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                (item.remindersSent || 0) > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                                    "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                                            )}>
                                                {isExpired ? (
                                                    daysLeft === -1 ? "Yesterday" : `${Math.abs(daysLeft)} days ago`
                                                ) : daysLeft === 0 ? `Today` : daysLeft === 1 ? `Tomorrow` : `${daysLeft}d left`}
                                            </span>
                                            {(item.remindersSent || 0) > 0 && (
                                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <FaCheckDouble className="text-[8px]" /> {item.remindersSent} Sent
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className=" rounded-xl p-3 border border-[var(--border)] mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tool Name</span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{item.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry</span>
                                            <span className="text-xs font-mono font-bold text-[var(--foreground)]">{toHumanDate(item.eDate)}</span>
                                        </div>
                                    </div>

                                    <PlanFeatureGuard
                                        feature="whatsappAlerts"
                                        fallback={
                                            <Button disabled variant="outline" className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-dashed border-slate-300 cursor-not-allowed opacity-60">
                                                <FaLock className="text-xs" /> Upgrade to Remind
                                            </Button>
                                        }
                                    >
                                        <Button
                                            onClick={() => sendReminder(item)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
                                        >
                                            <FaWhatsapp className="text-sm" /> Send Reminder
                                        </Button>
                                    </PlanFeatureGuard>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[500px] custom-scrollbar max-w-[85vw] sm:max-w-full mx-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4">Customer Details</th>
                                        <th className="px-6 py-4">Tool Information</th>
                                        <th className="px-6 py-4 text-center">Time Left</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {items.map((item, i) => {
                                        const daysLeft = Math.ceil((new Date(item.eDate).getTime() - new Date(expiryDate).getTime()) / (1000 * 60 * 60 * 24));
                                        const isExpired = daysLeft < 0;
                                        const isUrgent = isExpired || (item.remindersSent || 0) === 0;

                                        return (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/5 transition group">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-sm text-[var(--foreground)]">{item.clientName}</div>
                                                    <div className="text-xs text-indigo-500 font-bold dark:text-indigo-400">{item.clientPhone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-sm text-indigo-600 dark:text-indigo-400">{item.name}</div>
                                                    <div className="flex gap-2 text-[10px] font-bold">
                                                        <span className="text-slate-400">P: {item.pDate ? toHumanDate(item.pDate) : "-"}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className="text-slate-500 dark:text-slate-400">E: {toHumanDate(item.eDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                            (item.remindersSent || 0) > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                                                "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                                                        )}>
                                                            {isExpired ? (
                                                                daysLeft === -1 ? "Yesterday" : `${Math.abs(daysLeft)} days ago`
                                                            ) : daysLeft === 0 ? `Today` : daysLeft === 1 ? `Tomorrow` : `${daysLeft}d left`}
                                                        </span>
                                                        {(item.remindersSent || 0) > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                <FaCheckDouble className="text-[8px]" /> {item.remindersSent} Sent
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <PlanFeatureGuard
                                                        feature="whatsappAlerts"
                                                        fallback={<button disabled className="text-[10px] h-9 px-3 py-2 text-slate-300 cursor-not-allowed flex items-center gap-1"><FaLock /> Lock</button>}
                                                    >
                                                        <button onClick={() => sendReminder(item)} className="btn-whatsapp text-[10px] h-9 px-3 py-2"><FaWhatsapp className="mr-1" /> Remind</button>
                                                    </PlanFeatureGuard>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-lg font-black text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                    <FaTriangleExclamation className="text-rose-500" /> Expiry Alerts
                </h1>
                <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                    <button
                        onClick={() => setViewMode("card")}
                        className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${viewMode === "card" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    >
                        <FaAddressCard /> Card View
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${viewMode === "table" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    >
                        <FaTableList /> Table View
                    </button>

                </div>
            </div >

            {renderSection(
                allItems.filter(i => i.eDate >= dateRange.from && i.eDate <= dateRange.to).sort((a, b) => a.eDate.localeCompare(b.eDate)),
                "Results in Selected Range",
                FaCircleInfo,
                "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500"
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderSection(
                    previousThreeDaysItems,
                    "Expired (Last 3 Days)",
                    FaClock,
                    "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                )}
                {renderSection(
                    upcomingItems,
                    "Upcoming (Next 4 Days)",
                    FaClock,
                    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                )}
            </div>
        </div >
    );
}

