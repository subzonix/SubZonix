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
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <FaChartLine className="text-amber-500" /> Advanced Analytics
            </h1>

            {/* User Selector */}
            <div className="border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Select User to Analyze
                </label>
                <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-slate-500" />
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">-- Choose User --</option>
                        {users.filter(u => u.role !== "owner").map(u => (
                            <option key={u.id} value={u.id}>
                                {u.email} {u.companyName ? `(${u.companyName})` : ""}
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
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="text-xs text-slate-400 uppercase font-bold">Total Revenue</div>
                            <div className="text-2xl font-bold text-emerald-400 mt-1">${totalSales.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="text-xs text-slate-400 uppercase font-bold">Total Profit</div>
                            <div className="text-2xl font-bold text-amber-400 mt-1">${totalProfit.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="text-xs text-slate-400 uppercase font-bold">Total Orders</div>
                            <div className="text-2xl font-bold text-indigo-400 mt-1">{totalOrders}</div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl w-fit border border-slate-800">
                        <button
                            onClick={() => setViewMode("transactions")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === "transactions" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <FaList /> Transactions
                        </button>
                        <button
                            onClick={() => setViewMode("stats")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${viewMode === "stats" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <FaChartLine /> Charts (Beta)
                        </button>
                    </div>

                    {/* Content View */}
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg min-h-[300px]">
                        {viewMode === "transactions" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="text-[10px] uppercase bg-slate-800/50 text-slate-400 font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Vendor</th>
                                            <th className="px-6 py-4 text-right">Cost</th>
                                            <th className="px-6 py-4 text-right">Sell Price</th>
                                            <th className="px-6 py-4 text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {sales.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">No transactions found for this user.</td>
                                            </tr>
                                        ) : (
                                            sales.map(sale => (
                                                <tr key={sale.id} className="hover:bg-slate-800/30 transition border-transparent hover:border-slate-700/50 border-l-2">
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-300 font-bold">{new Date(sale.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-slate-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-200">{sale.client.name || "N/A"}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{sale.client.phone || "No Contact"}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-200">{sale.vendor.name || "N/A"}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{sale.vendor.phone || "No Contact"}</div>
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
                <div className="text-center py-20 text-slate-600 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                    <FaUser className="text-4xl mx-auto mb-4 opacity-20" />
                    <p>Please select a user to view their analytics.</p>
                </div>
            )}
        </div>
    );
}
