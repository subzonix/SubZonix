"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import { Card, Button } from "@/components/ui/Shared";
import { FaWhatsapp, FaCheck, FaPhone, FaTableList, FaAddressCard } from "react-icons/fa6";
import { cleanPhone } from "@/lib/utils";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function PendingPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [view, setView] = useState<"card" | "table">("table");
    const { user } = useAuth();
    const { showToast, confirm } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            const snap = await getDoc(doc(db, "users", user.uid, "settings", "general"));
            if (snap.exists()) setSettings(snap.data());
        };
        fetchSettings();

        if (!user) return;
        const q = query(collection(db, "users", user.uid, "salesHistory"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
            setSales(data.filter(s => s.client.status === "Pending" || s.client.status === "Partial"));
            setLoading(false);
        });
        return () => unsub();
    }, [user, settings]); // Settings added to deps to ensure msg template updates if settings load late

    const markClear = async (id: string) => {
        const ok = await confirm({
            title: "Clear Client Dues",
            message: "Are you sure you want to mark this client as Cleared? Their pending amount will be set to 0.",
            confirmText: "Mark as Cleared",
            variant: "success"
        });

        if (ok) {
            try {
                if (!user) return;
                await updateDoc(doc(db, "users", user.uid, "salesHistory", id), {
                    "client.status": "Clear",
                    "finance.pendingAmount": 0
                });
                showToast("Client status cleared", "success");
            } catch (e) {
                showToast("Error updating status", "error");
            }
        }
    };

    const remind = (s: Sale) => {
        const formatDate = (ts: any) => {
            if (!ts) return "N/A";
            const d = new Date(ts);
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const amt = s.finance.pendingAmount || s.finance.totalSell;
        const toolNames = s.items.map(i => i.name).join(", ");
        const emails = s.items.map(i => i.email || "N/A").join(", ");
        const firstExpiry = s.items[0]?.eDate ? formatDate(s.items[0].eDate) : "N/A";

        let template = settings?.pendingTemplate || "*Payment Reminder*\n\nDear *[Client]*,\n\nThe following memberships you activated on [ActivationDate]. Dues are *pending*.\n\n* Tool Name : [Tool Name]\n* Email : [Email]\n* *Pending Amount: [PendingAmount]*\n\nExpiry Date : [ExpiryDate]\n\nTo continue uninterrupted access, kindly clear all the dues.\n\n*Account Information:*\n* Bank Name: [Bank Name]\n* Holder Name: [Holder Name]\n* IBAN or Account No.: [Account No]\n\n> *Sent by [Company Name]*\n_© Powered by TapnTools_";

        let msg = template
            .replace(/\[Client\]/g, s.client.name)
            .replace(/\[ActivationDate\]/g, formatDate(s.createdAt))
            .replace(/\[Tool Name\]/g, toolNames)
            .replace(/\[Email\]/g, emails)
            .replace(/\[PendingAmount\]/g, String(amt))
            .replace(/\[ExpiryDate\]/g, firstExpiry)
            .replace(/\[Bank Name\]/g, settings?.bankName || "user not set yet")
            .replace(/\[Holder Name\]/g, settings?.accountHolder || "user not set yet")
            .replace(/\[Account No\]/g, settings?.iban || settings?.accountNumber || "user not set yet")
            .replace(/\[Company Name\]/g, settings?.companyName || "Tapn Tools");

        window.open(`https://wa.me/${cleanPhone(s.client.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <PlanFeatureGuard feature="pending">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-lg  font-bold">Pending Payments</h2>
                    <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                        <button
                            onClick={() => setView("card")}
                            className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${view === "card" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            <FaAddressCard /> Card View
                        </button>
                        <button
                            onClick={() => setView("table")}
                            className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${view === "table" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            <FaTableList /> Table View
                        </button>

                    </div>
                </div>

                {loading ? <div>Loading...</div> : sales.length === 0 ? (
                    <div className="text-center p-10 text-slate-500">No pending clients.</div>
                ) : view === "table" ? (
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar max-w-[85vw] sm:max-w-full mx-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Client</th>
                                        <th className="px-4 py-3">Tools</th>
                                        <th className="px-4 py-3">Pending Amount</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {sales.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                            <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold">{s.client.name}</div>
                                                <div className="text-[10px] text-slate-400">{s.client.phone}</div>
                                            </td>
                                            <td className="px-4 py-3 ">
                                                {s.items.map(i => i.name).join(", ")}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold text-rose-600">
                                                {s.finance.pendingAmount || s.finance.totalSell}
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => remind(s)} className="btn-whatsapp "><FaWhatsapp className="mr-1" /> Remind</button>
                                                <button onClick={() => markClear(s.id!)} className="btn-save "><FaCheck className="mr-1" /> Clear</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sales.map(s => (
                            <Card key={s.id} className="relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                    <FaPhone className="text-6xl text-amber-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg">{s.client.name}</div>
                                            <div className="text-xs text-slate-400">{s.client.phone}</div>
                                        </div>
                                        <div className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded font-bold uppercase">{s.client.status}</div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                            {s.finance.pendingAmount || s.finance.totalSell}
                                        </div>
                                        <div className="text-[10px] text-slate-400">Total Dues</div>
                                        <div className="text-[10px] text-slate-500 mt-2 truncate">
                                            {s.items.map(i => i.name).join(", ")}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => remind(s)} className="btn-whatsapp flex-1 text-xs"><FaWhatsapp className="mr-1" /> Remind</button>
                                        <button onClick={() => markClear(s.id!)} className="btn-save flex-1 text-xs"><FaCheck className="mr-1" /> Clear</button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PlanFeatureGuard>
    );
}
