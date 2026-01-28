"use client";
import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import { Card, Input } from "@/components/ui/Shared";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { useAuth } from "@/context/AuthContext";

import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement);
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { FaLock } from "react-icons/fa6";

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("thisMonth");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Monthly Profit Trend (Last 12 Months)
    const months = useMemo(() => {
        const result = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            result.push({
                key: d.toISOString().slice(0, 7), // YYYY-MM
                label: d.toLocaleDateString([], { month: 'short', year: 'numeric' })
            });
        }
        return result;
    }, []);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "users", user.uid, "salesHistory"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];
            const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
            const filtered = data.filter(s => s.createdAt >= oneYearAgo);
            setSales(filtered);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching analytics:", error);
            setLoading(false);
        });
        return () => unsub();
    }, [user]);


    const filteredSales = useMemo(() => {
        if (filter === "custom") {
            const from = fromDate ? new Date(fromDate).getTime() : 0;
            const to = toDate ? new Date(toDate).getTime() + 86400000 : Infinity; // +1 day to include end date
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

    // 4. Financial Overview Chart (Daily/Hourly support)
    const financialChartData = useMemo(() => {
        if (sales.length === 0) return null;

        const timeData: Record<string, { revenue: number; profit: number; cost: number }> = {};

        // Determine the actual date range based on filters
        let fromDateStr = "";
        let toDateStr = "";

        if (filter === "custom") {
            fromDateStr = fromDate || new Date(sales[sales.length - 1]?.createdAt || Date.now()).toISOString().split('T')[0];
            toDateStr = toDate || new Date().toISOString().split('T')[0];
        } else {
            const now = new Date();
            if (filter === "thisMonth") {
                fromDateStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                toDateStr = now.toISOString().split('T')[0];
            } else if (filter === "lastMonth") {
                fromDateStr = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                toDateStr = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            } else if (filter === "thisYear") {
                fromDateStr = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                toDateStr = now.toISOString().split('T')[0];
            } else {
                // All time
                const oldest = sales.length > 0 ? Math.min(...sales.map(s => s.createdAt)) : Date.now();
                fromDateStr = new Date(oldest).toISOString().split('T')[0];
                toDateStr = now.toISOString().split('T')[0];
            }
        }

        const isSingleDay = fromDateStr === toDateStr;

        // 1. Initialize slots (Hourly or Daily)
        if (isSingleDay) {
            for (let i = 0; i < 24; i++) {
                const hourKey = `${i.toString().padStart(2, '0')}:00`;
                timeData[hourKey] = { revenue: 0, profit: 0, cost: 0 };
            }
        } else {
            const start = new Date(fromDateStr);
            const end = new Date(toDateStr);
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
        });

        const sortedKeys = Object.keys(timeData).sort();
        const labels = sortedKeys.map(k => {
            if (isSingleDay) return k;
            return new Date(k).toLocaleDateString([], { month: 'short', day: 'numeric' });
        });

        return {
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
        };
    }, [filteredSales, sales, filter, fromDate, toDate]);

    // 5. Detailed Summary Metrics
    const summaryMetrics = useMemo(() => {
        const totalSales = filteredSales.length;
        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.finance.totalSell, 0);
        const totalProfit = filteredSales.reduce((sum, s) => sum + s.finance.totalProfit, 0);
        const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Find busiest day
        const dayCounts: Record<string, number> = {};
        filteredSales.forEach(s => {
            const day = new Date(s.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

        return { totalSales, totalRevenue, totalProfit, avgOrderValue, busiestDay };
    }, [filteredSales]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <div className="animate-pulse mb-4 text-4xl">📊</div>
            <p className="text-sm font-medium">Crunching your numbers...</p>
        </div>
    );

    if (sales.length === 0) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <div className="mb-4 text-4xl">📉</div>
            <p className="text-sm font-medium">No sales data found for analytics.</p>
        </div>
    );

    const monthlyProfitData = months.map((m: { key: string }) => {
        let profit = 0;
        sales.forEach(s => {
            const sDate = new Date(s.createdAt).toISOString().slice(0, 7);
            if (sDate === m.key) profit += s.finance.totalProfit;
        });
        return profit;
    });

    // 1. Top Customers
    const customerStats: Record<string, number> = {};
    filteredSales.forEach(s => {
        customerStats[s.client.name] = (customerStats[s.client.name] || 0) + s.finance.totalProfit;
    });
    const topCustomers = Object.entries(customerStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const customerData = {
        labels: topCustomers.map(c => c[0]),
        datasets: [{
            label: "Profit Generated",
            data: topCustomers.map(c => c[1]),
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderColor: "#10b981",
            borderWidth: 1,
            borderRadius: 5
        }]
    };

    // 2. Top Tools
    const toolCounts: Record<string, number> = {};
    filteredSales.forEach(s => s.items.forEach(i => {
        toolCounts[i.name] = (toolCounts[i.name] || 0) + 1;
    }));
    const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const toolData = {
        labels: topTools.map(t => t[0]),
        datasets: [{
            label: "Units Sold",
            data: topTools.map(t => t[1]),
            backgroundColor: "rgba(99, 102, 241, 0.6)",
            borderColor: "#6366f1",
            borderWidth: 1,
            borderRadius: 5
        }]
    };

    // 3. Inventory Sales (Profit Share)
    const inventoryStats: Record<string, number> = {};
    filteredSales.forEach(s => s.items.forEach(i => {
        // Group by Inventory name (assuming exact match)
        inventoryStats[i.name] = (inventoryStats[i.name] || 0) + (i.sell - i.cost);
    }));
    const topInventory = Object.entries(inventoryStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const inventoryData = {
        labels: topInventory.map(t => t[0]),
        datasets: [{
            label: "Net Profit",
            data: topInventory.map(t => t[1]),
            backgroundColor: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6"],
            borderWidth: 0,
        }]
    };



    return (
        <PlanFeatureGuard feature="analytics">
            <div className="space-y-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Business Analytics</h2>
                        <p className="text-xs text-slate-500">Insights into your sales, customers, and inventory performance.</p>
                    </div>
                    <div className="flex flex-col px-2 py-2 sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <PlanFeatureGuard
                            feature="dateRangeFilter"
                            fallback={
                                <div className="flex items-center gap-2 opacity-60 cursor-not-allowed" title="Upgrade plan to filter by date">
                                    <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border w-full sm:w-auto bg-card justify-center sm:justify-start">
                                        <button disabled className="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase">This Month</button>
                                        <button disabled className="px-2 py-1.5 text-slate-400 text-[10px] font-bold uppercase">Last Month</button>
                                    </div>
                                    <FaLock className="text-slate-400" />
                                </div>
                            }
                        >
                            <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border w-full sm:w-auto bg-card justify-center sm:justify-start">
                                {["thisMonth", "lastMonth", "thisYear", "all", "custom"].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-3 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === f ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                                    >
                                        {f === "thisMonth" ? "This Month" : f === "lastMonth" ? "Last Month" : f === "thisYear" ? "This Year" : f === "custom" ? "Custom" : "All Time"}
                                    </button>
                                ))}
                            </div>

                            {filter === "custom" && (
                                <div className="flex-1 min-w-[300px]">
                                    <CalendarDateRangePicker
                                        from={fromDate}
                                        to={toDate}
                                        onFromChange={setFromDate}
                                        onToChange={setToDate}
                                    />
                                </div>
                            )}
                        </PlanFeatureGuard>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-l-4 border-l-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-indigo-500 mt-1">{summaryMetrics.totalSales}</p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Profit</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            PKR {summaryMetrics.totalProfit.toLocaleString()}
                        </p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg. Order Value</p>
                        <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                            PKR {Math.round(summaryMetrics.avgOrderValue).toLocaleString()}
                        </p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Busiest Day</p>
                        <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                            {summaryMetrics.busiestDay[0]}
                        </p>
                    </Card>
                </div>

                {/* Financial Overview Trend */}
                <Card className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Financial Overview</h3>
                            <p className="text-[9px] text-slate-400">Revenue, Profit, and Cost trends for the selected period.</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#10b981] bg-transparent"></span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Profit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Cost</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 sm:h-80 lg:h-[400px] w-full relative">
                        {financialChartData && (
                            <Line
                                data={financialChartData}
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
                                            cornerRadius: 8,
                                        }
                                    },
                                    scales: {
                                        y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 8 } } },
                                        x: { grid: { display: false }, ticks: { font: { size: 8 } } }
                                    }
                                }}
                            />
                        )}
                    </div>
                </Card>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {/* Top Customers */}
                    <Card className="p-3 sm:p-5">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-4">Top Customers (By Profit)</h3>
                        <div className="h-64 w-full relative">
                            <Bar
                                data={customerData}
                                options={{
                                    indexAxis: 'y',
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                                        y: { grid: { display: false }, ticks: { font: { size: 8 } } }
                                    }
                                }}
                            />
                        </div>
                    </Card>

                    {/* Top Tools */}
                    <Card className="p-3 sm:p-5">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-4">Top Selling Tools</h3>
                        <div className="h-64 w-full relative">
                            <Bar
                                data={toolData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                                        y: { grid: { display: false }, ticks: { font: { size: 8 } } }
                                    }
                                }}
                            />
                        </div>
                    </Card>

                    {/* Inventory Profit Share */}
                    <Card className="p-5 md:col-span-2 xl:col-span-1">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-6">Inventory Profit Share</h3>
                        <div className="h-64 w-full relative flex justify-center">
                            <Doughnut
                                data={inventoryData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                            labels: {
                                                boxWidth: 8,
                                                font: { size: 10 },
                                                padding: 10
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </Card>
                </div>

                {/* 12-Month Profit Trend (Restored) */}
                <Card className="p-3 sm:p-5">
                    <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-4">12-Month Profit Trend</h3>
                    <div className="h-64 sm:h-80 lg:h-[400px] w-full relative">
                        <Line
                            data={{
                                labels: months.map((m: { label: string }) => m.label),
                                datasets: [{
                                    label: "Monthly Profit",
                                    data: monthlyProfitData,
                                    borderColor: "#6366f1",
                                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                                    tension: 0.4,
                                    fill: true,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        padding: 12,
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        cornerRadius: 8,
                                    }
                                },
                                scales: {
                                    y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 8 } } },
                                    x: { grid: { display: false }, ticks: { font: { size: 8 } } }
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>
        </PlanFeatureGuard>
    );
}
