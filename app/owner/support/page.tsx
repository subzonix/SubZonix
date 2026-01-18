"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, Button } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaHeadset, FaCheck, FaTrash, FaClock, FaUser, FaEnvelope, FaMessage } from "react-icons/fa6";
import clsx from "clsx";
import { format } from "date-fns";

interface SupportQuery {
    id: string;
    userId: string;
    userEmail: string;
    query: string;
    status: "unread" | "resolved";
    createdAt: any;
}

export default function OwnerSupportPage() {
    const { showToast, confirm } = useToast();
    const [queries, setQueries] = useState<SupportQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");

    useEffect(() => {
        const q = query(collection(db, "support_queries"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportQuery));
            setQueries(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "unread" ? "resolved" : "unread";
            await updateDoc(doc(db, "support_queries", id), { status: newStatus });
            showToast(`Query marked as ${newStatus}`, "success");
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: "Delete Query",
            message: "Are you sure you want to delete this support query permanently?",
            confirmText: "Delete",
            variant: "danger"
        });
        if (!ok) return;

        try {
            await deleteDoc(doc(db, "support_queries", id));
            showToast("Query deleted successfully", "success");
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        }
    };

    const filteredQueries = queries.filter(q => {
        if (filter === "all") return true;
        return q.status === filter;
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Queries...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic flex items-center gap-3">
                        <FaHeadset className="text-indigo-500" /> Support Queries
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Review and manage user help requests</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(["all", "unread", "resolved"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredQueries.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <FaMessage className="text-4xl text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No {filter !== "all" ? filter : ""} queries found.</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold text-center">Everything is up to date!</p>
                    </div>
                ) : (
                    filteredQueries.map((q) => (
                        <Card key={q.id} className={clsx(
                            "group transition-all duration-300 border-2",
                            q.status === "unread" ? "border-indigo-500/20 bg-indigo-500/5" : "border-transparent opacity-75 hover:opacity-100"
                        )}>
                            <div className="flex flex-col md:flex-row gap-6 p-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 transition-colors">
                                                    <FaEnvelope className="text-xs" />
                                                </div>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{q.userEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                                <FaClock className="text-indigo-400" />
                                                {q.createdAt?.toDate ? format(q.createdAt.toDate(), "PPpp") : "Just now"}
                                                <span className={clsx(
                                                    "ml-2 px-2 py-0.5 rounded-full font-black uppercase tracking-[0.1em] text-[8px]",
                                                    q.status === "unread" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                                )}>
                                                    {q.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                            "{q.query}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-2 justify-center shrink-0">
                                    <button
                                        onClick={() => handleToggleStatus(q.id, q.status)}
                                        className={clsx(
                                            "flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            q.status === "unread"
                                                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-500"
                                        )}
                                        title={q.status === "unread" ? "Mark as Resolved" : "Mark as Unread"}
                                    >
                                        <FaCheck /> <span className="md:hidden lg:inline">{q.status === "unread" ? "Resolve" : "Undo"}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="flex items-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                        title="Delete Query"
                                    >
                                        <FaTrash /> <span className="md:hidden lg:inline">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
