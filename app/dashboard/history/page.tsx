"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import { Card, Input, Button } from "@/components/ui/Shared";
import { FaTrash, FaPen, FaFilePdf, FaEye, FaWhatsapp, FaChevronDown, FaChevronUp, FaUser, FaCartShopping, FaFileCsv } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { cleanPhone, exportToCSV, toHumanDate, formatDateSafe } from "@/lib/utils";
import { handleDownloadPDF } from "@/lib/pdfUtils";
import clsx from "clsx";
import SaleDetailsModal from "@/components/history/SaleDetailsModal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { CalendarDateRangePicker } from "@/components/ui/CalendarDateRangePicker";
import { FaCalendarAlt, FaTimes, FaFileImport } from "react-icons/fa";
import { parseCSVToSales } from "@/lib/csvParser";
import { addDoc } from "firebase/firestore";
import { useSales } from "@/context/SalesContext";
import PlanFeatureGuard from "@/components/PlanFeatureGuard"; // Import PlanFeatureGuard


export default function HistoryPage() {
    const { sales, loading } = useSales();
    const [search, setSearch] = useState("");
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
    const [showDailyPurchasing, setShowDailyPurchasing] = useState(false);
    const [groupMode, setGroupMode] = useState<"customer" | "tool">("customer");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFrom, setExportFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // Default last 30 days
    const [exportTo, setExportTo] = useState(new Date().toISOString().slice(0, 10));
    const [exportPreferences, setExportPreferences] = useState<Record<string, boolean> | undefined>(undefined);
    const [companyInfo, setCompanyInfo] = useState({ companyName: "", slogan: "", logoUrl: "", accountNumber: "", iban: "", bankName: "", accountHolder: "", });
    const router = useRouter();
    const [showImportModal, setShowImportModal] = useState(false);
    const importFile = useMemo(() => null, []); // Placeholder for state logic if needed elsewhere
    const [importFileReal, setImportFileReal] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const { user, merchantId } = useAuth();
    const { showToast, confirm } = useToast();

    useEffect(() => {
        const loadSettings = async () => {
            if (!merchantId) return;
            const snap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
            if (snap.exists()) {
                const data = snap.data();
                setExportPreferences(data.exportPreferences);
                setCompanyInfo({
                    companyName: data.companyName || "",
                    slogan: data.slogan || "",
                    logoUrl: data.logoUrl || "",
                    accountNumber: data.accountNumber || "",
                    iban: data.iban || "",
                    bankName: data.bankName || "",
                    accountHolder: data.accountHolder || ""
                });
            }
        };
        loadSettings();
    }, [merchantId]);

    const groupedClients = useMemo(() => {
        const groups: Record<string, { client: Sale['client'], sales: Sale[] }> = {};
        sales.forEach((s: Sale) => {
            if (!s.client?.phone) return;
            const key = s.client.phone;
            if (!groups[key]) {
                groups[key] = { client: s.client, sales: [] };
            }
            groups[key].sales.push(s);
        });
        return Object.values(groups).filter(g =>
            (g.client?.name?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (g.client?.phone?.includes(search) || false)
        );
    }, [sales, search]);

    const groupedTools = useMemo(() => {
        const groups: Record<string, { tool: string, sales: (Sale & { itemIndex: number })[] }> = {};
        sales.forEach((s: Sale) => {
            if (!Array.isArray(s.items)) return;
            s.items.forEach((item, idx: number) => {
                if (!item?.name) return;
                const key = item.name.toUpperCase();
                if (!groups[key]) {
                    groups[key] = { tool: item.name, sales: [] };
                }
                groups[key].sales.push({ ...s, itemIndex: idx });
            });
        });
        return Object.values(groups).filter(g =>
            g.tool.toLowerCase().includes(search.toLowerCase())
        ).sort((a: any, b: any) => b.sales.length - a.sales.length);
    }, [sales, search]);

    const purchaseSales = useMemo(() => {
        return sales.filter((sale: Sale) => {
            const date = formatDateSafe(sale.createdAt);
            return date === purchaseDate;
        }).sort((a: Sale, b: Sale) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [sales, purchaseDate]);

    const purchaseStats = useMemo(() => {
        return purchaseSales.reduce((acc: any, s: Sale) => ({
            count: acc.count + 1,
            sell: acc.sell + s.finance.totalSell,
            cost: acc.cost + s.finance.totalCost,
            profit: acc.profit + s.finance.totalProfit
        }), { count: 0, sell: 0, cost: 0, profit: 0 });
    }, [purchaseSales]);

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: "Delete Sale Record",
            message: "This will permanently delete this transaction record from your database. This action cannot be undone.",
            confirmText: "Permanently Delete",
            variant: "danger"
        });

        if (ok) {
            try {
                if (!merchantId) return;
                await deleteDoc(doc(db, "users", merchantId, "salesHistory", id));
                showToast("Record deleted successfully", "success");
            } catch (e: any) {
                showToast("Error deleting record: " + e.message, "error");
            }
        }
    };

    const handleCSVExport = () => {
        setShowExportModal(true);
    };

    const handleFilteredExport = () => {
        const filtered = sales.filter((s: Sale) => {
            const date = formatDateSafe(s.createdAt);
            return date >= exportFrom && date <= exportTo;
        });

        if (filtered.length === 0) {
            showToast("No sales found in the selected date range", "warning");
            return;
        }

        exportToCSV(filtered, `Sales_History_${exportFrom}_to_${exportTo}`, exportPreferences);
        showToast(`Exported ${filtered.length} records`, "success");
        setShowExportModal(false);
    };

    const handleGroupExport = (groupSales: Sale[], name: string) => {
        exportToCSV(groupSales, `Sales_${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, exportPreferences);
        showToast(`Exported ${groupSales.length} records for ${name}`, "success");
    };

    const handleImportCSV = async () => {
        if (!importFileReal) {
            showToast("Please select a CSV file", "error");
            return;
        }

        setImporting(true);
        try {
            if (!user) return;
            const text = await importFileReal.text();
            const result = parseCSVToSales(text);

            if (!result.success || result.errors.length > 0) {
                showToast(`Import completed with ${result.errors.length} error(s)`, "warning");
                console.error("Import errors:", result.errors);
            }

            if (result.sales.length === 0) {
                showToast("No valid sales found in CSV", "error");
                setImporting(false);
                return;
            }

            // Save imported sales to Firebase
            const salesRef = collection(db, "users", merchantId || user!.uid, "salesHistory");
            let successCount = 0;

            for (const sale of result.sales) {
                try {
                    await addDoc(salesRef, sale);
                    successCount++;
                } catch (e: any) {
                    console.error("Error adding sale:", e);
                }
            }

            showToast(`Successfully imported ${successCount} out of ${result.sales.length} sales!`, "success");
            setShowImportModal(false);
            setImportFileReal(null);
        } catch (e: any) {
            showToast(`Import failed: ${e.message}`, "error");
            console.error(e);
        }
        setImporting(false);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Daily Purchasing Section */}
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                <div
                    onClick={() => setShowDailyPurchasing(!showDailyPurchasing)}
                    className="p-6 cursor-pointer  transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm">
                            <FaCartShopping className="text-xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-foreground tracking-tight">Daily Selling Details</h2>
                                {showDailyPurchasing ? <FaChevronUp className="text-[10px] text-slate-400" /> : <FaChevronDown className="text-[10px] text-slate-400" />}
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{toHumanDate(purchaseDate)}</p>
                        </div>
                    </div>

                    {!showDailyPurchasing && (
                        <div className="flex items-center gap-4 px-4 py-2  rounded-2xl border border-border animate-in fade-in zoom-in duration-300">
                            <div className="text-center">
                                <div className="text-[8px] text-slate-400 font-bold uppercase">Sell</div>
                                <div className="text-[10px] font-black text-emerald-600 font-mono">Rs. {purchaseStats.sell.toLocaleString()}</div>
                            </div>
                            <div className="text-center border-l border-border pl-4">
                                <div className="text-[8px] text-slate-400 font-bold uppercase">Profit</div>
                                <div className="text-[10px] font-black text-indigo-600 font-mono">Rs. {purchaseStats.profit.toLocaleString()}</div>
                            </div>
                        </div>
                    )}

                    {showDailyPurchasing && (
                        <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm animate-in slide-in-from-right-4 duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Date</span>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    className="bg-slate-100 dark:bg-slate-800 text-[11px] px-3 py-1.5 rounded-xl border border-border focus:border-emerald-500 transition-all outline-none text-foreground"
                                />
                            </div>
                            <div className="h-6 w-[1px] bg-border mx-1" />
                            <div className="flex items-center gap-5 px-2">
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">Sales</div>
                                    <div className="text-[11px] font-black text-foreground">{purchaseStats.count}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">Sell</div>
                                    <div className="text-[11px] font-black text-emerald-600 font-mono">Rs. {purchaseStats.sell.toLocaleString()}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">Cost</div>
                                    <div className="text-[11px] font-black text-rose-500 font-mono">Rs. {purchaseStats.cost.toLocaleString()}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">Profit</div>
                                    <div className="text-[11px] font-black text-indigo-600 font-mono">Rs. {purchaseStats.profit.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showDailyPurchasing && (
                    <div className="border-t border-border animate-in slide-in-from-top-4 duration-300">
                        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                            {/* Mobile View: Cards */}
                            <div className="md:hidden space-y-4 p-4">
                                {loading ? (
                                    <div className="text-center text-slate-400 animate-pulse py-8">Computing records...</div>
                                ) : purchaseSales.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">No purchase transactions found.</div>
                                ) : (
                                    purchaseSales.map((sale: Sale, idx: number) => (
                                        <div key={sale.id || idx} className="bg-background p-4 rounded-xl border border-border">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-black text-foreground">{sale.client.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">{sale.vendor?.name || "N/A"}</div>
                                                    <div className={clsx("text-[9px] font-black uppercase tracking-tight", (sale.vendor?.status || "Unpaid") === "Paid" ? "text-slate-400" : "text-rose-500")}>
                                                        {sale.vendor?.status || "Unpaid"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {sale.items.map((item: any, k: number) => (
                                                    <span key={k} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black border border-indigo-100 dark:border-indigo-800/30">
                                                        {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-border">
                                                <div className="text-[10px] font-bold text-rose-500">Cost: Rs. {sale.finance.totalCost}</div>
                                                <div className="text-[11px] font-black text-emerald-600">Sell: Rs. {sale.finance.totalSell}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop View: Table */}
                            <table className="w-full text-left text-[11px] hidden md:table">
                                <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Transaction Details</th>
                                        <th className="px-6 py-4">Supplier / Vendor</th>
                                        <th className="px-6 py-4">Acquired Items</th>
                                        <th className="px-6 py-4 text-right">Financials</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 animate-pulse">Computing records...</td></tr>
                                    ) : purchaseSales.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No purchase transactions found for this date.</td></tr>
                                    ) : (
                                        purchaseSales.map((sale: Sale, idx: number) => (
                                            <tr key={sale.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/5 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] text-slate-400 font-bold">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="font-black text-foreground">{sale.client.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">{sale.vendor?.name || "N/A"}</div>
                                                    <div className={clsx("text-[9px] font-black uppercase tracking-tight", (sale.vendor?.status || "Unpaid") === "Paid" ? "text-slate-400" : "text-rose-500")}>
                                                        Status: {sale.vendor?.status || "Unpaid"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {sale.items.map((item: any, k: number) => (
                                                            <span key={k} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black border border-indigo-100 dark:border-indigo-800/30">
                                                                {item.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-[11px] font-black text-emerald-600">Sell: {sale.finance.totalSell}</div>
                                                    <div className="text-[10px] font-bold text-rose-500">Cost: {sale.finance.totalCost}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sales History List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-2xl border border-border shadow-sm gap-4">
                    <div className="flex-1 max-w-md w-full">
                        <Input
                            placeholder="Search customers by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                            icon={FaUser}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                            <button
                                onClick={() => setGroupMode("customer")}
                                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                                            transition-all duration-200 ease-out
                                            active:scale-[0.97] whitespace-nowrap
                                            ${groupMode === "customer"
                                        ? "bg-indigo-50 dark:bg-indigo-600/10 shadow-sm text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20"
                                        : "bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 border border-border"
                                    }`}
                            >
                                By Customer
                            </button>

                            <button
                                onClick={() => setGroupMode("tool")}
                                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                                        transition-all duration-200 ease-out
                                        active:scale-[0.97] whitespace-nowrap
                                        ${groupMode === "tool"
                                        ? "bg-indigo-50 dark:bg-indigo-600/10 shadow-sm text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20"
                                        : "bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 border border-border"
                                    }`}
                            >
                                By Tool
                            </button>
                        </div>

                        <PlanFeatureGuard
                            feature="export"
                            fallback={
                                <Button className="w-full sm:w-auto opacity-50 cursor-not-allowed" title="Upgrade plan to export" disabled>
                                    <FaFileCsv className="text-sm mr-2" />
                                    Export Data (Locked)
                                </Button>
                            }
                        >
                            <Button
                                onClick={handleCSVExport}
                                className="w-full sm:w-auto"
                            >
                                <FaFileCsv className="text-sm mr-2" />
                                Export Data
                            </Button>
                        </PlanFeatureGuard>

                        <PlanFeatureGuard
                            feature="importData"
                            fallback={
                                <Button variant="success" className="w-full sm:w-auto opacity-50 cursor-not-allowed" title="Upgrade plan to import" disabled>
                                    <FaFileImport className="text-sm mr-2" />
                                    Import CSV (Locked)
                                </Button>
                            }
                        >
                            <Button
                                onClick={() => setShowImportModal(true)}
                                variant="success"
                                className="w-full sm:w-auto"
                            >
                                <FaFileImport className="text-sm mr-2" />
                                Import CSV
                            </Button>
                        </PlanFeatureGuard>
                    </div>

                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="p-10 text-center text-slate-400 animate-pulse font-black uppercase tracking-widest">Fetching sales data...</div>
                    ) : (groupMode === "customer" ? groupedClients : groupedTools).length === 0 ? (
                        <div className="p-10 text-center text-slate-400 bg-card rounded-2xl border border-dashed border-border">
                            No matching history records found.
                        </div>
                    ) : groupMode === "customer" ? (
                        groupedClients.map((group) => (
                            <div key={group.client.phone} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group">
                                <div
                                    onClick={() => setExpandedClient(expandedClient === group.client.phone ? null : group.client.phone)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/20 group-hover:scale-110 transition-transform">
                                            <FaUser />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-foreground tracking-tight">{group.client.name}</div>
                                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{group.client.phone}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Total Purchases</div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs font-black text-foreground">{group.sales.length} Orders</div>
                                                <PlanFeatureGuard feature="export" fallback={<button className="p-1.5 text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"><FaFileCsv className="text-[12px]" /></button>}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleGroupExport(group.sales, group.client.name); }}
                                                        className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm border border-indigo-100 dark:border-indigo-800"
                                                        title="Export this customer's data"
                                                    >
                                                        <FaFileCsv className="text-[12px]" />
                                                    </button>
                                                </PlanFeatureGuard>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Recent Activity</div>
                                            <div className="text-xs font-bold text-slate-500">
                                                {new Date(group.sales[0].createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                                            </div>
                                        </div>
                                        <button className="p-2 text-slate-300 group-hover:text-indigo-500 transition-colors cursor-pointer">
                                            {expandedClient === group.client.phone ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                        </button>
                                    </div>
                                </div>

                                {expandedClient === group.client.phone && (
                                    <div className="border-t border-border p-4 bg-slate-50/30 dark:bg-slate-800/10 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                            {group.sales.map((s) => (
                                                <div key={s.id} className="bg-card p-4 rounded-2xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex-1 w-full overflow-hidden">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(s.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                        </div>
                                                        <div className="overflow-x-auto max-w-[75vw] sm:max-w-full">
                                                            <table className="w-full text-[10px] text-left">
                                                                <thead className="text-slate-400 font-black uppercase tracking-widest border-b border-border">
                                                                    <tr>
                                                                        <th className="py-2 pr-4">Tool</th>
                                                                        <th className="py-2 pr-4">Type</th>
                                                                        <th className="py-2 pr-4">Plan</th>
                                                                        <th className="py-2 pr-4">Duration</th>
                                                                        <th className="py-2 pr-4">Expiry</th>
                                                                        <th className="py-2 pr-4">Vendor</th>
                                                                        <th className="py-2 text-right">Cost</th>
                                                                        <th className="py-2 text-right">Sale</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border text-slate-600 dark:text-slate-400">
                                                                    {s.items.map((i, k) => (
                                                                        <tr key={k} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                                            <td className="py-2.5 pr-4 font-black text-foreground">{i.name}</td>
                                                                            <td className="py-2.5 pr-4 uppercase font-bold text-slate-400">{i.type}</td>
                                                                            <td className="py-2.5 pr-4 max-w-[80px] truncate" title={i.plan}>{i.plan || "-"}</td>
                                                                            <td className="py-2.5 pr-4 whitespace-nowrap text-[9px] font-bold text-slate-500">
                                                                                {i.pDate && i.eDate ? Math.ceil((new Date(i.eDate).getTime() - new Date(i.pDate).getTime()) / (1000 * 60 * 60 * 24)) + " Days" : "N/A"}
                                                                            </td>
                                                                            <td className="py-2.5 pr-4 whitespace-nowrap font-mono">{toHumanDate(i.eDate)}</td>
                                                                            <td className="py-2.5 pr-4 font-black text-indigo-500">{s.vendor?.name}</td>
                                                                            <td className="py-2.5 text-right font-mono text-rose-500">Rs. {i.cost}</td>
                                                                            <td className="py-2.5 text-right font-black text-emerald-600 font-mono">Rs. {i.sell}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                                        <button onClick={() => setSelectedSale(s)} className="btn-view" title="View Details">
                                                            <FaEye /> View
                                                        </button>
                                                        <PlanFeatureGuard feature="pdf" fallback={<button className="icon-pdf cursor-not-allowed opacity-50" disabled><FaFilePdf /></button>}>
                                                            <button onClick={() => handleDownloadPDF(s, companyInfo)} className="icon-pdf" title="PDF"><FaFilePdf /></button>
                                                        </PlanFeatureGuard>
                                                        <PlanFeatureGuard feature="whatsappAlerts" fallback={<button className="icon-whatsapp cursor-not-allowed opacity-50" disabled><FaWhatsapp /></button>}>
                                                            <button onClick={() => window.open(`https://wa.me/${cleanPhone(s.client?.phone || "")}`, '_blank')} className="icon-whatsapp" title="WhatsApp"><FaWhatsapp /></button>
                                                        </PlanFeatureGuard>
                                                        <button onClick={() => router.push(`/dashboard/new-sale?id=${s.id}`)} className="icon-edit" title="Edit"><FaPen className="text-sm" /></button>
                                                        <button onClick={() => handleDelete(s.id!)} className="icon-delete" title="Delete"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        groupedTools.map((group) => (
                            <div key={group.tool} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group">
                                <div
                                    onClick={() => setExpandedClient(expandedClient === group.tool ? null : group.tool)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800/20 group-hover:scale-110 transition-transform">
                                            <FaCartShopping />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-foreground tracking-tight uppercase">{group.tool}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales Occurrences</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Active Sales</div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs font-black text-emerald-600">{group.sales.length} Orders</div>
                                                <PlanFeatureGuard feature="export" fallback={<button className="p-1.5 text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"><FaFileCsv className="text-[12px]" /></button>}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleGroupExport(group.sales, group.tool); }}
                                                        className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm border border-emerald-100 dark:border-emerald-800"
                                                        title="Export this tool's data"
                                                    >
                                                        <FaFileCsv className="text-[12px]" />
                                                    </button>
                                                </PlanFeatureGuard>
                                            </div>
                                        </div>
                                        <button className="p-2 text-slate-300 group-hover:text-indigo-500 transition-colors cursor-pointer">
                                            {expandedClient === group.tool ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                        </button>
                                    </div>
                                </div>

                                {expandedClient === group.tool && (
                                    <div className="border-t border-border p-4 bg-slate-50/30 dark:bg-slate-800/10 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-4">
                                            {group.sales.map((s, idx) => (
                                                <div key={`${s.id}-${idx}`} className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex-1 w-full overflow-hidden">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(s.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full uppercase tracking-tight ml-auto">
                                                                    {s.items[s.itemIndex].type}
                                                                </span>
                                                            </div>

                                                            <div className="overflow-x-auto max-w-[75vw] sm:max-w-full">
                                                                <table className="w-full text-[10px] text-left">
                                                                    <thead className="text-slate-400 font-black uppercase tracking-widest border-b border-border">
                                                                        <tr>
                                                                            <th className="py-2 pr-4">Customer</th>
                                                                            <th className="py-2 pr-4">Vendor</th>
                                                                            <th className="py-2 pr-4">Expiry</th>
                                                                            <th className="py-2 text-right">Cost</th>
                                                                            <th className="py-2 text-right">Sale</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-border text-slate-600 dark:text-slate-400">
                                                                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                                            <td className="py-2.5 pr-4">
                                                                                <div className="font-black text-foreground">{s.client?.name || "Unknown"}</div>
                                                                                <div className="text-[9px] text-slate-400">{s.client?.phone || "-"}</div>
                                                                            </td>
                                                                            <td className="py-2.5 pr-4 font-black text-indigo-500">{s.vendor?.name || "-"}</td>
                                                                            <td className="py-2.5 pr-4 whitespace-nowrap font-mono">{toHumanDate(s.items?.[s.itemIndex]?.eDate || "")}</td>
                                                                            <td className="py-2.5 text-right font-mono text-rose-500">Rs. {s.items?.[s.itemIndex]?.cost || 0}</td>
                                                                            <td className="py-2.5 text-right font-black text-emerald-600 font-mono">Rs. {s.items?.[s.itemIndex]?.sell || 0}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                                            <button onClick={() => setSelectedSale(s)} className="icon-view" title="View Details">
                                                                <FaEye />
                                                            </button>
                                                            <PlanFeatureGuard feature="pdf" fallback={<button className="icon-pdf cursor-not-allowed opacity-50" disabled><FaFilePdf /></button>}>
                                                                <button onClick={() => handleDownloadPDF(s, companyInfo)} className="icon-pdf" title="PDF"><FaFilePdf /></button>
                                                            </PlanFeatureGuard>
                                                            <PlanFeatureGuard feature="whatsappAlerts" fallback={<button className="icon-whatsapp cursor-not-allowed opacity-50" disabled><FaWhatsapp /></button>}>
                                                                <button onClick={() => window.open(`https://wa.me/${cleanPhone(s.client?.phone || "")}`, '_blank')} className="icon-whatsapp" title="WhatsApp"><FaWhatsapp /></button>
                                                            </PlanFeatureGuard>
                                                            <button onClick={() => router.push(`/dashboard/new-sale?id=${s.id}`)} className="icon-edit" title="Edit"><FaPen className="text-sm" /></button>
                                                            <button onClick={() => handleDelete(s.id!)} className="icon-delete" title="Delete"><FaTrash /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedSale && (
                <SaleDetailsModal
                    sale={selectedSale}
                    isOpen={!!selectedSale}
                    onClose={() => setSelectedSale(null)}
                />
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowExportModal(false)} />
                    <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-[800px] min-h-[550px] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <FaFileCsv className="text-indigo-500" /> Filter Export
                            </h3>
                            <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date Range</label>
                                <CalendarDateRangePicker
                                    from={exportFrom}
                                    to={exportTo}
                                    onFromChange={setExportFrom}
                                    onToChange={setExportTo}
                                    className="w-full"
                                />
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
                                    Only data within the selected dates will be exported to the CSV file.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/10 flex gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 btn-delete"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFilteredExport}
                                className="flex-[2] btn-save"
                            >
                                Start Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-3xl p-6 w-[600px] shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black">Import Sales from CSV</h3>
                            <button onClick={() => { setShowImportModal(false); setImportFileReal(null); }} className="btn-delete px-2 py-2">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl">
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2">
                                    📋 Important: Match Field Names
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-500">
                                    Please download and use our sample CSV file below. Make sure your CSV has the exact same column names to ensure successful import.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href="/sample-import.csv"
                                    download
                                    className="btn-edit flex-1 justify-center text-center"
                                >
                                    📥 Download Sample CSV
                                </a>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Select Your CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setImportFileReal(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-sm"
                                />
                                {importFileReal && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-bold">
                                        ✓ Selected: {importFileReal.name}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowImportModal(false); setImportFileReal(null); }}
                                    className="btn-pdf flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImportCSV}
                                    disabled={!importFileReal || importing}
                                    className="btn-whatsapp flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {importing ? "Importing..." : "🚀 Import CSV"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
