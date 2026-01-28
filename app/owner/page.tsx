"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaChartLine, FaCalendarDay, FaUserClock, FaShop } from "react-icons/fa6";
import { useToast } from "@/context/ToastContext";
import clsx from "clsx";
import { Sale, ToolItem } from "@/types";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { formatDateSafe } from "@/lib/utils";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

interface UserProfile {
    id: string;
    email: string;
    role: "owner" | "user";
    status: "active" | "pending" | "paused";
    createdAt?: number;
    companyName?: string;
    planName?: string;
    planId?: string;
    salesLimit?: number;
    currentSalesCount?: number;
    planExpiry?: number;
}

export default function OwnerDashboardPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { showToast } = useToast();

    // Dashboard State
    const [dashboardUser, setDashboardUser] = useState<string>("");
    const [sales, setSales] = useState<Sale[]>([]);
    const [salesLoading, setSalesLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
    const [appliedFilter, setAppliedFilter] = useState({ from: fromDate, to: toDate });
    const [viewMode, setViewMode] = useState<"stats" | "charts">("stats");

    // Fetch Users & Plans
    useEffect(() => {
        const qUsers = query(collection(db, "users"));
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            setUsers(data);
            setIsLoading(false);
            // Auto-select first user for dashboard if not set
            if (data.length > 0 && !dashboardUser) {
                // Prefer selecting a non-owner user if possible
                const firstUser = data.find(u => u.role !== "owner") || data[0];
                if (firstUser) setDashboardUser(firstUser.id);
            }
        });

        return () => {
            unsubUsers();
        };
    }, []);

    // Fetch Sales for Dashboard User
    useEffect(() => {
        if (!dashboardUser) {
            setSales([]);
            return;
        }
        setSalesLoading(true);
        const q = query(collection(db, "users", dashboardUser, "salesHistory"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
            data.sort((a, b) => b.createdAt - a.createdAt);
            setSales(data);
            setSalesLoading(false);
        }, (error) => {
            console.error("Error fetching sales:", error);
            setSalesLoading(false);
        });
        return () => unsub();
    }, [dashboardUser]);

    // Dashboard Logic
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

        sales.forEach((s: Sale) => {
            if (s.client?.status !== "Clear") clientPending += (s.finance.pendingAmount || 0);
            if (s.vendor?.status !== "Paid") vendorDues += s.finance.totalCost;
        });

        return { orders, revenue, profit, clientPending, vendorDues };
    }, [filteredSales, sales]);

    const chartData = useMemo(() => {
        if (viewMode !== "charts") return null;

        const timeData: Record<string, { revenue: number; profit: number; cost: number }> = {};
        const vendorRevenue: Record<string, number> = {};
        const vendorDuesDist: Record<string, number> = {};
        const itemSales: Record<string, number> = {};

        const isSingleDay = appliedFilter.from === appliedFilter.to;

        if (isSingleDay) {
            for (let i = 0; i < 24; i++) {
                const hourKey = `${i.toString().padStart(2, '0')}:00`;
                timeData[hourKey] = { revenue: 0, profit: 0, cost: 0 };
            }
        } else {
            const start = new Date(appliedFilter.from);
            const end = new Date(appliedFilter.to);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                timeData[dateKey] = { revenue: 0, profit: 0, cost: 0 };
            }
        }

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
                        borderColor: '#6366f1',
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
                        borderColor: '#10b981',
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
                        borderColor: '#f43f5e',
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

    const handleApplyFilter = (from: string, to: string) => {
        setFromDate(from);
        setToDate(to);
        setAppliedFilter({ from, to });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {/* User Selection */}
                <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
                    <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Select User</label>
                        <select
                            value={dashboardUser}
                            onChange={(e) => setDashboardUser(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">Select a user...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.companyName ? `${u.companyName} (${u.email})` : u.email} - {u.role}
                                </option>
                            ))}
                        </select>
                    </div>
                    {dashboardUser && (
                        <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Plan Info</label>
                            <div className="text-sm font-medium text-foreground">
                                {users.find(u => u.id === dashboardUser)?.planName || "No Plan"}
                                <span className="text-muted-foreground text-xs ml-2">
                                    ({users.find(u => u.id === dashboardUser)?.currentSalesCount || 0}/{users.find(u => u.id === dashboardUser)?.salesLimit || "∞"})
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {salesLoading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">Fetching User Data...</div>
                ) : (
                    <>
                        {/* Dashboard Content */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-xl font-bold text-foreground">Overview</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <CalendarDateRangePicker
                                    from={fromDate}
                                    to={toDate}
                                    onFromChange={setFromDate}
                                    onToChange={setToDate}
                                    onApply={handleApplyFilter}
                                />
                                <div className="flex p-1.5 rounded-xl border border-border self-end sm:self-auto bg-secondary">
                                    <button onClick={() => setViewMode("stats")} className={clsx("p-2 px-4 rounded-lg text-xs font-bold transition", viewMode === "stats" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Transactions</button>
                                    <button onClick={() => setViewMode("charts")} className={clsx("p-2 px-4 rounded-lg text-xs font-bold transition", viewMode === "charts" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Charts</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <StatCard title="Orders" value={stats.orders} color="blue" icon={FaChartLine} isCurrency={false} />
                            <StatCard title="Revenue" value={stats.revenue} color="indigo" icon={FaCalendarDay} />
                            <StatCard title="Profit" value={stats.profit} color="emerald" icon={FaChartLine} />
                            <StatCard title="Customer Pending" value={stats.clientPending} color="amber" icon={FaUserClock} />
                            <StatCard title="Vendor Dues" value={stats.vendorDues} color="rose" icon={FaShop} />
                        </div>

                        {viewMode === "stats" ? (
                            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-foreground">Transactions In Range</h2>
                                        <div className="text-[11px] text-muted-foreground ">Showing results from {appliedFilter.from} to {appliedFilter.to}</div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px] text-left text-muted-foreground">
                                        <thead className="bg-secondary text-[10px] uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 rounded-l-lg">Time</th>
                                                <th className="px-3 py-2">Client / Vendor</th>
                                                <th className="px-3 py-2">Tools Sold</th>
                                                <th className="px-3 py-2">Payment</th>
                                                <th className="px-3 py-2 rounded-r-lg text-right">Net Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {recentSales.length === 0 ? (
                                                <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No transactions recorded for this period.</td></tr>
                                            ) : (
                                                recentSales.map((s: Sale, idx: number) => (
                                                    <tr key={s.id || idx} className="hover:bg-secondary/50 transition cursor-default">
                                                        <td className="px-3 py-3 font-mono text-muted-foreground text-[10px]">
                                                            <div className="font-bold text-foreground uppercase">{new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</div>
                                                            <div>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="font-black text-sm text-foreground">{s.client?.name || "Unknown"}</div>
                                                            <div className="text-[10px] text-muted-foreground">Via: {s.vendor?.name || "N/A"}</div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {s.items.map((i: ToolItem, k: number) => (
                                                                    <span key={k} className="text-xs font-black text-blue-500 dark:text-blue-400">
                                                                        {i.name}{k < s.items.length - 1 ? ", " : ""}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="space-y-1">
                                                                <div className={clsx("text-[10px] font-black uppercase tracking-wider", s.client?.status === "Pending" ? "text-destructive" : s.client?.status === "Partial" ? "text-blue-500" : "text-emerald-500")}>
                                                                    C: {s.client?.status || "Success"}
                                                                </div>
                                                                <div className={clsx("text-[9px] font-bold uppercase", s.vendor?.status === "Paid" ? "text-muted-foreground" : "text-destructive")}>
                                                                    V: {s.vendor?.status || "N/A"}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-right font-black text-emerald-500">
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
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[350px] md:col-span-2">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Financial Overview</h3>
                                    <div className="h-72 w-full">{chartData && <RevenueChart data={chartData.combined} />}</div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Revenue Trend</h3>
                                    <div className="h-64 w-full">{chartData && <RevenueChart data={chartData.revenue} />}</div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Profit Trend</h3>
                                    <div className="h-64 w-full">{chartData && <RevenueChart data={chartData.profit} />}</div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Top Vendors</h3>
                                    <div className="h-64 w-full">{chartData && <VendorChart data={chartData.vendors} />}</div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 text-center">Top Tools</h3>
                                        <div className="flex items-center justify-center h-48">{chartData && <ItemsChart data={chartData.items} />}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 text-center">Vendor Dues</h3>
                                        <div className="flex items-center justify-center h-48">{chartData && <ItemsChart data={chartData.dues} />}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, color, icon: Icon, isCurrency = true }: any) {
    const styles: any = {
        emerald: {
            container: "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25",
            icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            value: "text-emerald-800 dark:text-emerald-200",
            watermark: "text-emerald-600/20 dark:text-emerald-400/12",
        },
        indigo: {
            container: "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/25",
            icon: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
            value: "text-indigo-800 dark:text-indigo-200",
            watermark: "text-indigo-600/20 dark:text-indigo-400/12",
        },
        amber: {
            container: "bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25",
            icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            value: "text-amber-800 dark:text-amber-200",
            watermark: "text-amber-600/20 dark:text-amber-400/12",
        },
        rose: {
            container: "bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/25",
            icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
            value: "text-rose-800 dark:text-rose-200",
            watermark: "text-rose-600/20 dark:text-rose-400/12",
        },
        blue: {
            container: "bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/25",
            icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
            value: "text-sky-800 dark:text-sky-200",
            watermark: "text-sky-600/20 dark:text-sky-400/12",
        },
    };
    const s = styles[color] ?? styles.indigo;

    return (
        <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${s.container}`}>
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
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
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
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
                    y: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
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
