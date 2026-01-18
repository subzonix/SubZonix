"use client";

import { useState, useMemo } from "react";
import { useSales } from "@/context/SalesContext";
import { Card, Input, Button } from "@/components/ui/Shared";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { FaUserGroup, FaRotate, FaUserPlus, FaArrowTrendUp, FaFilter, FaMagnifyingGlass, FaToolbox, FaChartPie, FaChartLine, FaLock } from "react-icons/fa6";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { Sale, ToolItem } from "@/types";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function CustomersPage() {
    const { sales, loading } = useSales();

    // Filters
    const [search, setSearch] = useState("");
    const [toolFilter, setToolFilter] = useState("all");
    const [filter, setFilter] = useState("all"); // 'all', 'thisMonth', 'lastMonth', 'thisYear', 'custom'
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showRenewedOnly, setShowRenewedOnly] = useState(false);
    const [loyaltyView, setLoyaltyView] = useState<"customer" | "tool">("customer");

    const filteredByDateSales = useMemo(() => {
        if (filter === "custom") {
            const from = fromDate ? new Date(fromDate).getTime() : 0;
            const to = toDate ? new Date(toDate).getTime() + 86400000 : Infinity;
            return sales.filter(s => s.createdAt >= from && s.createdAt < to);
        }

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        return sales.filter(s => {
            const d = new Date(s.createdAt);
            if (filter === "thisMonth") return d >= thisMonthStart;
            if (filter === "lastMonth") return d >= lastMonthStart && d < thisMonthStart;
            if (filter === "thisYear") return d >= thisYearStart;
            return true;
        });
    }, [sales, filter, fromDate, toDate]);

    // Derived Data
    const customerStats = useMemo(() => {
        const stats: Record<string, {
            name: string;
            phone: string;
            totalSpent: number;
            orderCount: number;
            tools: Record<string, { count: number, name: string, type: string, plan: string }>;
            firstOrder: number;
            lastOrder: number;
        }> = {};

        filteredByDateSales.forEach(sale => {
            const key = sale.client.phone || sale.client.name;
            if (!stats[key]) {
                stats[key] = {
                    name: sale.client.name,
                    phone: sale.client.phone,
                    totalSpent: 0,
                    orderCount: 0,
                    tools: {},
                    firstOrder: sale.createdAt,
                    lastOrder: sale.createdAt
                };
            }

            stats[key].totalSpent += sale.items.reduce((sum, item) => sum + item.sell, 0);
            stats[key].orderCount += 1;
            stats[key].firstOrder = Math.min(stats[key].firstOrder, sale.createdAt);
            stats[key].lastOrder = Math.max(stats[key].lastOrder, sale.createdAt);

            sale.items.forEach(item => {
                const toolKey = `${item.name}-${item.type}-${item.plan || 'No Plan'}`;
                if (!stats[key].tools[toolKey]) {
                    stats[key].tools[toolKey] = {
                        count: 0,
                        name: item.name,
                        type: item.type,
                        plan: item.plan || ""
                    };
                }
                stats[key].tools[toolKey].count += 1;
            });
        });

        return stats;
    }, [filteredByDateSales]);

    const customers = useMemo(() => Object.values(customerStats), [customerStats]);

    const renewalStats = useMemo(() => {
        let totalRenewals = 0;
        customers.forEach(cat => {
            Object.values(cat.tools).forEach(t => {
                if (t.count > 1) {
                    totalRenewals += (t.count - 1);
                }
            });
        });
        return totalRenewals;
    }, [customers]);

    const uniqueTools = useMemo(() => {
        const set = new Set<string>();
        sales.forEach(s => s.items.forEach(i => set.add(i.name)));
        return Array.from(set).sort();
    }, [sales]);

    const toolRenewalStats = useMemo(() => {
        const stats: Record<string, { name: string, renewals: number }> = {};
        customers.forEach(cat => {
            Object.values(cat.tools).forEach(t => {
                if (t.count > 1) {
                    if (!stats[t.name]) stats[t.name] = { name: t.name, renewals: 0 };
                    stats[t.name].renewals += (t.count - 1);
                }
            });
        });
        return Object.values(stats).sort((a, b) => b.renewals - a.renewals).slice(0, 10);
    }, [customers]);

    const toolLoyaltyStats = useMemo(() => {
        const stats: Record<string, {
            name: string;
            totalSales: number;
            renewals: number;
            revenue: number;
            uniqueCustomers: Set<string>;
        }> = {};

        filteredByDateSales.forEach(sale => {
            sale.items.forEach(item => {
                if (!stats[item.name]) {
                    stats[item.name] = {
                        name: item.name,
                        totalSales: 0,
                        renewals: 0,
                        revenue: 0,
                        uniqueCustomers: new Set()
                    };
                }
                stats[item.name].totalSales += 1;
                stats[item.name].revenue += item.sell;
                stats[item.name].uniqueCustomers.add(sale.client.phone || sale.client.name);
            });
        });

        // Calculate renewals (total sales - unique customers for that tool)
        return Object.values(stats).map(s => ({
            ...s,
            renewals: Math.max(0, s.totalSales - s.uniqueCustomers.size)
        })).sort((a, b) => b.revenue - a.revenue);
    }, [filteredByDateSales]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
            const matchesTool = toolFilter === "all" || Object.values(c.tools).some(t => t.name === toolFilter);
            return matchesSearch && matchesTool;
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [customers, search, toolFilter]);

    const top5OldCustomers = useMemo(() => {
        return [...customers]
            .sort((a, b) => a.firstOrder - b.firstOrder) // Oldest first
            .slice(0, 5);
    }, [customers]);

    const top5ByOrders = useMemo(() => {
        return [...customers]
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5);
    }, [customers]);

    // Chart Data
    const customerSegmentationData = {
        labels: ["New Customers", "Returning (Renewed)"],
        datasets: [{
            data: [customers.length - (renewalStats > 0 ? 1 : 0), renewalStats], // Simplified logic for demo
            backgroundColor: ["#6366f1", "#10b981"],
            borderWidth: 0
        }]
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Analytics...</div>;

    return (
        <PlanFeatureGuard feature="customers">
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FaUserGroup className="text-indigo-500" /> Customer Analytics
                        </h2>
                        <p className="text-xs text-slate-500">Track renewals, unique customers, and loyalty metrics.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <PlanFeatureGuard
                            feature="dateRangeFilter"
                            fallback={
                                <div className="flex items-center gap-2 opacity-60 cursor-not-allowed" title="Upgrade plan to filter by date">
                                    <div className="flex p-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-x-auto whitespace-nowrap">
                                        <button disabled className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">All Time</button>
                                    </div>
                                    <FaLock className="text-slate-400" />
                                </div>
                            }
                        >
                            <div className="flex p-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-x-auto whitespace-nowrap">
                                {["all", "thisMonth", "lastMonth", "thisYear", "custom"].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${filter === f ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        {f === "all" ? "All Time" : f === "thisMonth" ? "This Month" : f === "lastMonth" ? "Last Month" : f === "thisYear" ? "This Year" : "Custom"}
                                    </button>
                                ))}
                            </div>
                            {filter === "custom" && (
                                <CalendarDateRangePicker
                                    from={fromDate}
                                    to={toDate}
                                    onFromChange={setFromDate}
                                    onToChange={setToDate}
                                />
                            )}
                        </PlanFeatureGuard>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Customers</p>
                                <h4 className="text-2xl font-black text-slate-700 dark:text-indigo-400 mt-1">{customers.length}</h4>
                            </div>
                            <FaUserPlus className="text-indigo-500 opacity-20 text-2xl" />
                        </div>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Renewals Found</p>
                                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{renewalStats}</h4>
                            </div>
                            <FaRotate className="text-emerald-500 opacity-20 text-2xl" />
                        </div>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Revenue</p>
                                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">Rs. {customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</h4>
                            </div>
                            <FaArrowTrendUp className="text-amber-500 opacity-20 text-2xl" />
                        </div>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Growth Rate</p>
                                <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                                    {customers.length > 0 ? ((renewalStats / customers.length) * 100).toFixed(1) : 0}%
                                </h4>
                            </div>
                            <FaChartLine className="text-purple-500 opacity-20 text-2xl" />
                        </div>
                    </Card>
                </div>

                {/* Filters Row */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <Card className="!p-0 border-none shadow-none">
                                <input
                                    placeholder="Search by name or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl outline-none focus:ring-2 ring-indigo-500/20 text-sm"
                                />
                            </Card>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <FaToolbox className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <select
                                    value={toolFilter}
                                    onChange={(e) => setToolFilter(e.target.value)}
                                    className="pl-10 pr-8 h-10 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl outline-none text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <option value="all">All Tools</option>
                                    {uniqueTools.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Loyalty Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">5 Top Oldest Customers</h3>
                            <span className="text-[10px] font-bold text-indigo-500">Oldest first</span>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {top5OldCustomers.map((c, i) => (
                                <div key={c.phone} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <div className="text-sm font-bold text-[var(--foreground)]">{c.name}</div>
                                            <div className="text-[10px] text-slate-500">{new Date(c.firstOrder).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-emerald-600">Rs. {c.totalSpent}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-black">{c.orderCount} Orders</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Most Orders</h3>
                            <span className="text-[10px] font-bold text-amber-500">Total transaction count</span>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {top5ByOrders.map((c, i) => (
                                <div key={c.phone} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-[10px] font-black text-amber-600">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <div className="text-sm font-bold text-[var(--foreground)]">{c.name}</div>
                                            <div className="text-[10px] text-slate-500">{c.phone}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-indigo-600">{c.orderCount} Times</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Renewed Tools: {Object.values(c.tools).filter(t => t.count > 1).length}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
                        <h3 className="text-sm font-bold">
                            {loyaltyView === "customer" ? "Customer Loyalty Details" : "Tool Loyalty Details"}
                        </h3>
                        <div className="flex p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                            <button
                                onClick={() => setLoyaltyView("customer")}
                                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                    transition-all duration-200 ease-out
                    active:scale-[0.97] whitespace-nowrap
                    ${loyaltyView === "customer"
                                        ? "bg-white dark:bg-indigo-900/60 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                                        : "bg-white dark:bg-indigo-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                                    }`}
                            >
                                By Customer
                            </button>

                            <button
                                onClick={() => setLoyaltyView("tool")}
                                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                    transition-all duration-200 ease-out
                    active:scale-[0.97] whitespace-nowrap
                    ${loyaltyView === "tool"
                                        ? "bg-white dark:bg-indigo-900/60 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                                        : "bg-white dark:bg-indigo-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                                    }`}
                            >
                                By Tool
                            </button>
                        </div>

                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--border)]">
                                {loyaltyView === "customer" ? (
                                    <tr>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Phone</th>
                                        <th className="px-6 py-4">Orders</th>
                                        <th className="px-6 py-4">Renewals</th>
                                        <th className="px-6 py-4">Top Tool</th>
                                        <th className="px-6 py-4">Total Spent</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-4">Tool Name</th>
                                        <th className="px-6 py-4">Total Sales</th>
                                        <th className="px-6 py-4">Unique Customers</th>
                                        <th className="px-6 py-4">Renewals</th>
                                        <th className="px-6 py-4">Est. Revenue</th>
                                        <th className="px-6 py-4">Popularity</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {loyaltyView === "customer" ? (
                                    filteredCustomers.map(c => {
                                        const topTool = Object.values(c.tools).sort((a, b) => b.count - a.count)[0];
                                        const renewals = Object.values(c.tools).reduce((sum, t) => sum + (t.count > 1 ? t.count - 1 : 0), 0);

                                        return (
                                            <tr key={c.phone} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold">{c.name}</div>
                                                    <div className="text-[10px] text-slate-400">Since {new Date(c.firstOrder).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{c.phone}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-600">{c.orderCount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${renewals > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                        {renewals} Renewals
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-indigo-600">{topTool?.name}</div>
                                                    <div className="text-[9px] text-slate-400 capitalize">{topTool?.type} - {topTool?.plan}</div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-sm">Rs. {c.totalSpent.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    {c.orderCount >= 3 ? (
                                                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1 px-2 rounded text-[10px] font-bold shadow-sm">VIP</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 p-1 px-2 rounded text-[10px] font-bold">Regular</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    toolLoyaltyStats.map((t, idx) => (
                                        <tr key={t.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="text-sm font-bold">{t.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600">{t.totalSales}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{t.uniqueCustomers.size}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.renewals > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                    {t.renewals} Renewals
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-sm text-emerald-600">Rs. {t.revenue.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 max-w-[100px]">
                                                    <div
                                                        className="bg-indigo-500 h-1.5 rounded-full"
                                                        style={{ width: `${Math.min(100, (t.totalSales / toolLoyaltyStats[0].totalSales) * 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Charts Section (Moved to bottom) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                    <Card className="p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <FaChartPie className="text-indigo-500" /> Customer Segmentation
                        </h3>
                        <div className="h-[250px] relative flex justify-center">
                            <Doughnut
                                data={customerSegmentationData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                                    }
                                }}
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                {showRenewedOnly ? <FaRotate className="text-emerald-500" /> : <FaArrowTrendUp className="text-amber-500" />}
                                {showRenewedOnly ? "Most Renewed Tools" : "Top Customers by Spend"}
                            </span>
                            <button
                                onClick={() => setShowRenewedOnly(!showRenewedOnly)}
                                className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all ${showRenewedOnly ? "bg-emerald-500 text-white border-emerald-600 shadow-md" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                            >
                                {showRenewedOnly ? "Showing Renewals" : "Show Renewals"}
                            </button>
                        </h3>
                        <div className="h-[250px]">
                            <Bar
                                data={{
                                    labels: showRenewedOnly ? toolRenewalStats.map(t => t.name) : filteredCustomers.slice(0, 5).map(c => c.name),
                                    datasets: [{
                                        label: showRenewedOnly ? "Total Renewals" : "Total Spent",
                                        data: showRenewedOnly ? toolRenewalStats.map(t => t.renewals) : filteredCustomers.slice(0, 5).map(c => c.totalSpent),
                                        backgroundColor: showRenewedOnly ? "rgba(16, 185, 129, 0.6)" : "rgba(99, 102, 241, 0.6)",
                                        borderRadius: 8
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y',
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { x: { display: false }, y: { grid: { display: false } } }
                                }}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </PlanFeatureGuard>
    );
}
