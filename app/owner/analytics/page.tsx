"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import { FaChartLine, FaList, FaUser } from "react-icons/fa6";
import { motion } from "framer-motion";

interface UserProfile {
    id: string;
    email: string;
    role: "owner" | "user";
    companyName?: string;
}

export default function OwnerAnalyticsPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [sales, setSales] = useState<Sale[]>([]);
    const [viewMode, setViewMode] = useState<"stats" | "transactions">("transactions");
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Users on Mount
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch Data when User Selected
    useEffect(() => {
        if (!selectedUserId) {
            setSales([]);
            return;
        }

        const q = query(collection(db, "users", selectedUserId, "salesHistory"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
            data.sort((a, b) => b.createdAt - a.createdAt);
            setSales(data);
        });

        return () => unsub();
    }, [selectedUserId]);

    // Derived Stats
    const totalSales = sales.reduce((acc, curr) => acc + (Number(curr.finance.totalSell) || 0), 0);
    const totalProfit = sales.reduce((acc, curr) => acc + (Number(curr.finance.totalProfit) || 0), 0);
    const totalOrders = sales.length;

    return (
        <div className="space-y-8 pb-20">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FaChartLine className="text-amber-500" /> Advanced Analytics
            </h1>

            {/* User Selector */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Select User to Analyze
                </label>
                <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-slate-500" />
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer transition-colors"
                    >
                        <option value="">-- Choose User --</option>
                        {users.filter(u => u.role !== "owner").map(u => (
                            <option key={u.id} value={u.id}>
                                {u.companyName ? `${u.companyName} (${u.email})` : u.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedUserId ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl">
                            <div className="text-xs text-slate-700 dark:text-emerald-200/80 uppercase font-bold">Total Revenue</div>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">${totalSales.toLocaleString()}</div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl">
                            <div className="text-xs text-slate-700 dark:text-amber-200/80 uppercase font-bold">Total Profit</div>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">${totalProfit.toLocaleString()}</div>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl">
                            <div className="text-xs text-slate-700 dark:text-indigo-200/80 uppercase font-bold">Total Orders</div>
                            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{totalOrders}</div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl w-fit border border-border">
                        <button
                            onClick={() => setViewMode("transactions")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === "transactions" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <FaList /> Transactions
                        </button>
                        <button
                            onClick={() => setViewMode("stats")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === "stats" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <FaChartLine /> Charts (Beta)
                        </button>
                    </div>

                    {/* Content View */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/40 min-h-[300px]">
                        {viewMode === "transactions" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-muted-foreground">
                                    <thead className="text-[10px] uppercase bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Vendor</th>
                                            <th className="px-6 py-4 text-right">Cost</th>
                                            <th className="px-6 py-4 text-right">Sell Price</th>
                                            <th className="px-6 py-4 text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sales.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No transactions found for this user.</td>
                                            </tr>
                                        ) : (
                                            sales.map(sale => (
                                                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-transparent hover:border-border border-l-2">
                                                    <td className="px-6 py-4">
                                                        <div className="text-foreground font-bold">{new Date(sale.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-foreground">{sale.client.name || "N/A"}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{sale.client.phone || "No Contact"}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-foreground">{sale.vendor.name || "N/A"}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{sale.vendor.phone || "No Contact"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-rose-400">
                                                        Rs. {Number(sale.finance.totalCost || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                                        Rs. {Number(sale.finance.totalSell || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-amber-400">
                                                        Rs. {Number(sale.finance.totalProfit || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 flex items-center justify-center flex-col text-slate-500">
                                <FaChartLine className="text-4xl mb-4 opacity-20" />
                                <p>Chart visualization is coming soon.</p>
                            </div>
                        )}
                    </div>

                </motion.div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-card/50 rounded-3xl border border-dashed border-border">
                    <FaUser className="text-4xl mx-auto mb-4 opacity-20" />
                    <p>Please select a user to view their analytics.</p>
                </div>
            )}
        </div>
    );
}
