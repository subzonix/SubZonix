"use client";

import { useMemo, useState, useEffect } from "react";
import { useSales } from "@/context/SalesContext";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FaChartLine, FaCalendarDay, FaUserClock, FaShop } from "react-icons/fa6";
import clsx from "clsx";
import { Sale, ToolItem } from "@/types";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { formatDateSafe } from "@/lib/utils";

export default function DashboardPage() {
    const { sales, loading } = useSales();
    const { user, isStaff, staffPermissions } = useAuth();
    const [recentMartOrders, setRecentMartOrders] = useState<any[]>([]);
    const [martLoading, setMartLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (isStaff) {
            // Staff are not allowed on the main dashboard overview
            if (staffPermissions?.sales?.write) router.push("/dashboard/new-sale");
            else if (staffPermissions?.inventory?.read) router.push("/dashboard/inventory");
            else if (staffPermissions?.customers?.read) router.push("/dashboard/customers");
            else if (staffPermissions?.sales?.read) router.push("/dashboard/expiry"); // fallback if can read sales
            else router.push("/dashboard/settings");
            return;
        }

        // Fetch Recent Mart Orders
        if (user) {
            import("firebase/firestore").then(({ collection, query, where, orderBy, limit, getDocs }) => {
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    where("type", "==", "shop_order"),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                getDocs(q).then((snap) => {
                    setRecentMartOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setMartLoading(false);
                }).catch(err => {
                    console.error("Error fetching mart orders:", err);
                    setMartLoading(false);
                });
            });
        }
    }, [isStaff, staffPermissions, router, user]);

    const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
    const [appliedFilter, setAppliedFilter] = useState({ from: fromDate, to: toDate });

    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const date = formatDateSafe(s.createdAt);
            if (!date) return false;
            return date >= appliedFilter.from && date <= appliedFilter.to;
        });
    }, [sales, appliedFilter]);

    const stats = useMemo(() => {
        let orders = filteredSales.length;
        let revenue = 0;
        let profit = 0;
        let clientPending = 0;
        let vendorDues = 0;

        filteredSales.forEach((s: Sale) => {
            revenue += s.finance.totalSell;
            profit += s.finance.totalProfit;
        });

        // Global stats (not filtered by date range as they are outstanding dues)
        sales.forEach((s: Sale) => {
            if (s.client?.status !== "Clear") clientPending += (s.finance.pendingAmount || 0);
            if (s.vendor?.status !== "Paid") vendorDues += s.finance.totalCost;
        });

        return { orders, revenue, profit, clientPending, vendorDues };
    }, [filteredSales, sales]);

    const [viewMode, setViewMode] = useState<"stats" | "charts">("stats");

    const handleApplyFilter = (from: string, to: string) => {
        setFromDate(from);
        setToDate(to);
        setAppliedFilter({ from, to });
    };

    // Prepare Chart Data
    const chartData = useMemo(() => {
        if (viewMode !== "charts") return null;

        const timeData: Record<string, { revenue: number; profit: number; cost: number }> = {};
        const vendorRevenue: Record<string, number> = {};
        const vendorDuesDist: Record<string, number> = {};
        const itemSales: Record<string, number> = {};

        const isSingleDay = appliedFilter.from === appliedFilter.to;

        // 1. Initialize slots (Hourly or Daily)
        if (isSingleDay) {
            // Initialize 24 hours
            for (let i = 0; i < 24; i++) {
                const hourKey = `${i.toString().padStart(2, '0')}:00`;
                timeData[hourKey] = { revenue: 0, profit: 0, cost: 0 };
            }
        } else {
            // Initialize dates in range
            const start = new Date(appliedFilter.from);
            const end = new Date(appliedFilter.to);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                timeData[dateKey] = { revenue: 0, profit: 0, cost: 0 };
            }
        }

        // 2. Fill with actual data
        filteredSales.forEach(s => {
            const date = new Date(s.createdAt);
            const key = isSingleDay
                ? `${date.getHours().toString().padStart(2, '0')}:00`
                : date.toISOString().split('T')[0];

            if (timeData[key]) {
                timeData[key].revenue += s.finance.totalSell;
                timeData[key].profit += s.finance.totalProfit;
                timeData[key].cost += s.finance.totalCost;
            }
            if (s.vendor?.name) {
                vendorRevenue[s.vendor.name] = (vendorRevenue[s.vendor.name] || 0) + s.finance.totalSell;
            }

            s.items.forEach(i => {
                itemSales[i.name] = (itemSales[i.name] || 0) + 1;
            });
        });

        // Distribution of ALL dues (global)
        sales.forEach(s => {
            if (s.vendor?.status !== "Paid" && s.vendor?.name) {
                vendorDuesDist[s.vendor.name] = (vendorDuesDist[s.vendor.name] || 0) + s.finance.totalCost;
            }
        });

        const sortedKeys = Object.keys(timeData).sort();
        const labels = sortedKeys.map(k => {
            if (isSingleDay) return k;
            return new Date(k).toLocaleDateString([], { month: 'short', day: 'numeric' });
        });

        const topVendors = Object.entries(vendorRevenue).sort(([, a], [, b]) => b - a).slice(0, 5);
        const topItems = Object.entries(itemSales).sort(([, a], [, b]) => b - a).slice(0, 5);
        const duesDist = Object.entries(vendorDuesDist).sort(([, a], [, b]) => b - a).slice(0, 5);

        return {
            isSingleDay,
            combined: {
                labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: sortedKeys.map(k => timeData[k].revenue),
                        borderColor: '#6366f1', // Indigo
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        borderWidth: 3,
                    },
                    {
                        label: 'Profit',
                        data: sortedKeys.map(k => timeData[k].profit),
                        borderColor: '#10b981', // Emerald
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        borderWidth: 3,
                        borderDash: [5, 5],
                    },
                    {
                        label: 'Cost',
                        data: sortedKeys.map(k => timeData[k].cost),
                        borderColor: '#f43f5e', // Rose
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        borderWidth: 2,
                    }
                ]
            },
            revenue: {
                labels,
                datasets: [{
                    label: 'Revenue',
                    data: sortedKeys.map(k => timeData[k].revenue),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                }]
            },
            profit: {
                labels,
                datasets: [{
                    label: 'Profit',
                    data: sortedKeys.map(k => timeData[k].profit),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                }]
            },
            vendors: {
                labels: topVendors.map(([name]) => name),
                datasets: [{
                    label: 'Revenue',
                    data: topVendors.map(([, amount]) => amount),
                    backgroundColor: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
                }]
            },
            items: {
                labels: topItems.map(([name]) => name),
                datasets: [{
                    label: 'Units Sold',
                    data: topItems.map(([, count]) => count),
                    backgroundColor: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fdf2f8'],
                }]
            },
            dues: {
                labels: duesDist.map(([name]) => name),
                datasets: [{
                    label: 'Amount Due',
                    data: duesDist.map(([, amount]) => amount),
                    backgroundColor: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
                }]
            }
        };
    }, [filteredSales, sales, viewMode, appliedFilter]);

    const recentSales = useMemo(() => {
        return [...filteredSales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
    }, [filteredSales]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Business Overview</h1>
                        <p className="text-xs text-slate-500">Track performance and activities</p>
                    </div>
                </div>

                {/* Desktop View Toggle */}
                <div className="hidden md:flex items-center gap-3 w-full sm:w-auto">

                    <CalendarDateRangePicker
                        from={fromDate}
                        to={toDate}
                        onFromChange={setFromDate}
                        onToChange={setToDate}
                        onApply={handleApplyFilter}
                    />
                    {/* Mobile View Toggle */}
                    <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                        <button
                            onClick={() => setViewMode("stats")}
                            className={clsx(
                                "p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer",
                                viewMode === "stats" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setViewMode("charts")}
                            className={clsx(
                                "p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer",
                                viewMode === "charts" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            Charts
                        </button>
                    </div>
                </div>

                <div className="md:hidden flex items-center gap-3 w-full sm:w-auto">
                    {/* Mobile View Toggle */}
                    <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                        <button
                            onClick={() => setViewMode("stats")}
                            className={clsx(
                                "p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer",
                                viewMode === "stats" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setViewMode("charts")}
                            className={clsx(
                                "p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer",
                                viewMode === "charts" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            Charts
                        </button>
                    </div>

                    <CalendarDateRangePicker
                        from={fromDate}
                        to={toDate}
                        onFromChange={setFromDate}
                        onToChange={setToDate}
                        onApply={handleApplyFilter}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard title="Orders" value={stats.orders} color="blue" icon={FaChartLine} isCurrency={false} />
                <StatCard title="Revenue" value={stats.revenue} color="indigo" icon={FaCalendarDay} />
                <StatCard title="Profit" value={stats.profit} color="emerald" icon={FaChartLine} />
                <StatCard title="Customer Pending" value={stats.clientPending} color="amber" icon={FaUserClock} />
                <StatCard title="Vendor Dues" value={stats.vendorDues} color="rose" icon={FaShop} />
            </div>

            {/* Mart Orders Widget */}

            {/* Content Area */}
            {viewMode === "stats" ? (
                <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-5 shadow-xl dark:shadow-2xl transition-colors overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Transactions In Range</h2>
                            <div className="text-[11px] text-slate-500 ">Showing results from {appliedFilter.from} to {appliedFilter.to}</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left text-foreground">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Time</th>
                                    <th className="px-3 py-2">Client / Vendor</th>
                                    <th className="px-3 py-2">Tools Sold</th>
                                    <th className="px-3 py-2">Payment</th>
                                    <th className="px-3 py-2 rounded-r-lg text-right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400 animate-pulse">Fetching records...</td></tr>
                                ) : recentSales.length === 0 ? (
                                    <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">No transactions recorded for this period.</td></tr>
                                ) : (
                                    recentSales.map((s: Sale, idx: number) => (
                                        <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition cursor-default">
                                            <td className="px-3 py-3 font-mono text-slate-400 text-[10px]">
                                                <div className="font-bold text-slate-500 dark:text-slate-400 uppercase">{new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</div>
                                                <div>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-black text-sm text-foreground">{s.client?.name || "Unknown"}</div>
                                                <div className="text-[10px] text-slate-400">Via: {s.vendor?.name || "N/A"}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(s.items || []).map((i: ToolItem, k: number) => (
                                                        <span key={k} className="text-xs font-black text-blue-900 dark:text-blue-400">
                                                            {i.name}{k < s.items.length - 1 ? ", " : ""}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="space-y-1">
                                                    <div className={clsx(
                                                        "text-[10px] font-black uppercase tracking-wider text-emerald-500",
                                                        s.client?.status === "Pending" && "text-rose-500",
                                                        s.client?.status === "Partial" && "text-blue-500"
                                                    )}>
                                                        {s.client?.status || "Success"}
                                                    </div>
                                                    <div className={clsx(
                                                        "text-[9px] font-bold uppercase",
                                                        s.vendor?.status === "Paid" ? "text-slate-400" : "text-rose-500"
                                                    )}>
                                                        V: {s.vendor?.status || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right font-black text-emerald-600">
                                                Rs. {s.finance.totalProfit}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {/* Multi-line Financial Chart */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl dark:shadow-2xl min-h-[350px] md:col-span-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Overview</h3>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#6366f1]"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border-2 border-[#10b981] bg-transparent"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Profit (Dashed)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#f43f5e]"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cost</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            {chartData && <RevenueChart data={chartData.combined} />}
                        </div>
                    </div>

                    {/* Separate Revenue Chart */}
                    <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-xl dark:shadow-2xl min-h-[300px]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Revenue Trend</h3>
                        <div className="h-64 w-full">
                            {chartData && <RevenueChart data={chartData.revenue} />}
                        </div>
                    </div>

                    {/* Separate Profit Chart */}
                    <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-xl dark:shadow-2xl min-h-[300px]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Profit Trend</h3>
                        <div className="h-64 w-full">
                            {chartData && <RevenueChart data={chartData.profit} />}
                        </div>
                    </div>

                    <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-xl dark:shadow-2xl min-h-[300px]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Vendors (Revenue)</h3>
                        <div className="h-64 w-full">
                            {chartData && <VendorChart data={chartData.vendors} />}
                        </div>
                    </div>

                    <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-xl dark:shadow-2xl min-h-[300px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Top Tools</h3>
                            <div className="flex items-center justify-center h-48">
                                {chartData && <ItemsChart data={chartData.items} />}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Vendor Dues</h3>
                            <div className="flex items-center justify-center h-48">
                                {chartData && <ItemsChart data={chartData.dues} />}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-components

function StatCard({ title, value, color, icon: Icon, isCurrency = true }: any) {
    const styles: any = {
        emerald: {
            container: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/5",
            icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
            value: "text-emerald-800 dark:text-emerald-50",
            watermark: "text-emerald-600/10 dark:text-emerald-400/10",
        },
        indigo: {
            container: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-500/5",
            icon: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
            value: "text-indigo-800 dark:text-indigo-50",
            watermark: "text-indigo-600/10 dark:text-indigo-400/10",
        },
        amber: {
            container: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 shadow-amber-500/5",
            icon: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
            value: "text-amber-800 dark:text-amber-50",
            watermark: "text-amber-600/10 dark:text-amber-400/10",
        },
        rose: {
            container: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 shadow-rose-500/5",
            icon: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
            value: "text-rose-800 dark:text-rose-50",
            watermark: "text-rose-600/10 dark:text-rose-400/10",
        },
        blue: {
            container: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30 shadow-sky-500/5",
            icon: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
            value: "text-sky-800 dark:text-sky-50",
            watermark: "text-sky-600/10 dark:text-sky-400/10",
        },
    };
    const s = styles[color] ?? styles.indigo;

    return (
        <div className={`p-4 rounded-2xl border shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group ${s.container}`}>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="text-[10px] mb-1 text-muted-foreground font-bold uppercase tracking-wider">{title}</div>
                    <div className={`text-xl font-black tracking-tight ${s.value}`}>
                        {isCurrency ? "Rs. " : ""}{(value === null || value === undefined || Number.isNaN(value)) ? "0" : value.toLocaleString()}
                    </div>
                </div>
                <div className={`p-2 rounded-lg ${s.icon}`}>
                    <Icon className="text-sm" />
                </div>
            </div>
            <Icon className={`absolute -bottom-4 -right-4 text-6xl rotate-12 group-hover:scale-110 transition-transform ${s.watermark}`} />
        </div>
    );
}

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function RevenueChart({ data }: { data: any }) {
    if (!data) return null;
    return (
        <Line
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        padding: 12,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        cornerRadius: 8,
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 10 } } }
                }
            }}
        />
    );
}

function VendorChart({ data }: { data: any }) {
    if (!data) return null;
    return (
        <Bar
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }}
        />
    );
}

function ItemsChart({ data }: { data: any }) {
    if (!data) return null;
    return (
        <div className="h-48 relative">
            <Doughnut
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            padding: 12,
                            cornerRadius: 8,
                        }
                    },
                    cutout: '70%',
                }}
            />
        </div>
    );
}
