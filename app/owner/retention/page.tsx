"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, query, onSnapshot, doc, getDocs, where, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { exportToCSV, toHumanDate, isValidDate, formatDateSafe } from "@/lib/utils";
import Link from "next/link";
import { FaTrash, FaClock, FaDownload, FaUserShield, FaTriangleExclamation } from "react-icons/fa6";

interface UserProfile {
    id: string;
    email: string;
    role: "owner" | "user";
    planName?: string;
}

export default function RetentionReviewPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [plans, setPlans] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const { showToast, confirm } = useToast();

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((u: any) => u.role !== "owner");
            setUsers(list);
            setLoading(false);
        });
        return () => unsubUsers();
    }, []);

    useEffect(() => {
        const fetchPlans = async () => {
            const snap = await getDocs(collection(db, "plans"));
            const map: Record<string, number> = {};
            snap.docs.forEach(d => {
                const data = d.data() as any;
                map[data.name] = data.dataRetentionMonths ?? 0;
            });
            setPlans(map);
        };
        fetchPlans();
    }, []);

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [salesOld, setSalesOld] = useState<any[]>([]);
    const [salesNear, setSalesNear] = useState<any[]>([]);

    useEffect(() => {
        const loadSales = async () => {
            if (!selectedUser) return;
            const months = plans[selectedUser.planName || ""] ?? 0;
            if (months <= 0) {
                setSalesOld([]); setSalesNear([]); return;
            }
            const q = query(collection(db, "users", selectedUser.id, "salesHistory"));
            const snap = await getDocs(q);
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - months);
            cutoffDate.setHours(0, 0, 0, 0);
            const cutoff = cutoffDate.getTime();

            const threeDays = 3 * 24 * 60 * 60 * 1000;
            const old = all.filter(s => (s.createdAt || 0) < cutoff);
            const near = all.filter(s => {
                const ts = s.createdAt || 0;
                return ts >= cutoff && ts <= cutoff + threeDays;
            });
            setSalesOld(old.sort((a, b) => b.createdAt - a.createdAt));
            setSalesNear(near.sort((a, b) => a.createdAt - b.createdAt));
        };
        loadSales();
    }, [selectedUser, plans]);

    const handleExportOld = () => {
        if (!selectedUser) return;
        exportToCSV(salesOld as any, `retention_old_${selectedUser.email}_${new Date().toISOString().slice(0, 10)}.csv`);
        showToast("Exported old records", "success");
    };

    const handleDeleteOld = async () => {
        if (!selectedUser) return;
        const ok = await confirm({
            title: "Delete Old Records",
            message: `Delete ${salesOld.length} old record(s) for ${selectedUser.email}?`,
            confirmText: "Delete",
            variant: "danger"
        });
        if (!ok) return;
        try {
            const batch = writeBatch(db);
            salesOld.forEach(s => batch.delete(doc(db, "users", selectedUser.id, "salesHistory", s.id)));
            await batch.commit();
            showToast("Deleted old records", "success");
            setSelectedUser(null);
        } catch (e: any) {
            showToast("Error: " + e.message, "error");
        }
    };

    const handleSnooze = async () => {
        if (!selectedUser) return;
        const ok = await confirm({
            title: "Snooze Retention",
            message: "Snooze retention prompts for 14 days?",
            confirmText: "Snooze 14d",
            variant: "info"
        });
        if (!ok) return;
        try {
            const until = Date.now() + (14 * 24 * 60 * 60 * 1000);
            await setDoc(doc(db, "users", selectedUser!.id, "settings", "general"), { retentionSnoozeUntil: until }, { merge: true });
            showToast("Snoozed for 14 days", "success");
        } catch (e: any) {
            showToast("Error: " + e.message, "error");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FaUserShield className="text-indigo-500" /> Retention Review
            </h1>
            <p className="text-xs text-muted-foreground">Manage plan-controlled data retention. Export first, then delete; you can snooze prompts or keep records.</p>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Users</h2>
                    <div className="space-y-2">
                        {users.map(u => {
                            const months = plans[u.planName || ""] ?? 0;
                            return (
                                <button key={u.id} onClick={() => setSelectedUser(u)} className="w-full text-left p-3 rounded-xl hover:bg-muted/40 border border-slate-200 dark:border-slate-800 transition">
                                    <div className="text-sm font-bold text-foreground">{u.email}</div>
                                    <div className="text-[10px] text-muted-foreground">Plan: {u.planName || "—"} • Retention: {months} month(s)</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 lg:col-span-2">
                    {selectedUser ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-foreground">{selectedUser.email}</div>
                                    <div className="text-[10px] text-muted-foreground">Old: {salesOld.length} • Near: {salesNear.length}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExportOld} className="btn-view text-[10px] px-3"><FaDownload /> Export Old</button>
                                    <button onClick={handleDeleteOld} className="btn-delete text-[10px] px-3"><FaTrash /> Delete Old</button>
                                    <button onClick={handleSnooze} className="btn-secondary text-[10px] px-3"><FaClock /> Snooze</button>
                                </div>
                            </div>

                            {salesOld.length > 0 && (
                                <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                                    <FaTriangleExclamation className="text-rose-500 text-sm mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black text-rose-600 uppercase tracking-wide">Action Required</p>
                                        <p className="text-[10px] text-rose-500 font-medium">This user has {salesOld.length} records past their plan retention period. Export them first as deletion is permanent.</p>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 grid sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-rose-600">Old Records (Passed Cutoff)</div>
                                        <span className="text-[9px] font-bold text-rose-600/60 bg-rose-500/5 px-2 py-0.5 rounded-full">{salesOld.length}</span>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-auto custom-scrollbar">
                                        {salesOld.map(s => (
                                            <div key={s.id} className="text-[11px] p-2 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-colors flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{s.client?.name || "Unknown"}</span>
                                                    <span className="text-[10px] opacity-60 text-mono">{formatDateSafe(s.createdAt)}</span>
                                                </div>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-md uppercase">OVERDUE</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Near Cutoff (Next 3 Days)</div>
                                        <span className="text-[9px] font-bold text-amber-600/60 bg-amber-500/5 px-2 py-0.5 rounded-full">{salesNear.length}</span>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-auto custom-scrollbar">
                                        {salesNear.map(s => (
                                            <div key={s.id} className="text-[11px] p-2 hover:bg-amber-500/5 rounded-lg border border-transparent hover:border-amber-500/10 transition-colors flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{s.client?.name || "Unknown"}</span>
                                                    <span className="text-[10px] opacity-60 text-mono">{formatDateSafe(s.createdAt)}</span>
                                                </div>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-md uppercase">SOON</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-[11px] text-muted-foreground">Select a user to review retention.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

