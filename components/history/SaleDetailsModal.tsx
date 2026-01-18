"use client";

import { Sale, ToolItem } from "@/types";
import { FaXmark, FaFilePdf, FaWhatsapp, FaUser, FaShop, FaCircleInfo, FaTags, FaMoneyBillWave } from "react-icons/fa6";
import { generateInvoicePDF, cleanPhone } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { handleDownloadPDF as handleDownloadPDFUtil } from "@/lib/pdfUtils";

import PlanFeatureGuard from "@/components/PlanFeatureGuard";

interface SaleDetailsModalProps {
    sale: Sale;
    isOpen: boolean;
    onClose: () => void;
}

export default function SaleDetailsModal({ sale, isOpen, onClose }: SaleDetailsModalProps) {
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    useEffect(() => {
        const loadInfo = async () => {
            const snap = await getDoc(doc(db, "settings", "global"));
            if (snap.exists()) setCompanyInfo(snap.data());
        };
        if (isOpen) loadInfo();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleWhatsApp = () => {
        let message = `*Hello ${sale.client.name}, here are your credentials for your recent purchase:* \n\n`;

        sale.items.forEach((item, idx) => {
            message += `*Tool #${idx + 1}: ${item.name} (${item.type})*\n`;
            if (item.plan) message += `Plan: ${item.plan}\n`;
            if (item.email) message += `Email: ${item.email}\n`;
            if (item.pass) message += `Password: ${item.pass}\n`;
            if (item.profileName) message += `Profile: ${item.profileName}\n`;
            if (item.profilePin) message += `PIN: ${item.profilePin}\n`;
            message += `Expiry: ${item.eDate}\n\n`;
        });

        if (sale.instructions && sale.instructions !== "No Instructions") {
            message += `*Instructions & Warranty:*\n${sale.instructions}\n\n`;
        }

        message += `*Sold By:* ${companyInfo?.companyName || "Tapn Tools"}\n`;
        message += `_Powered by TapnTools_`;

        const url = `https://wa.me/${cleanPhone(sale.client.phone)}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    const handleDownloadPDF = () => {
        handleDownloadPDFUtil(sale, {
            companyName: companyInfo?.companyName,
            slogan: companyInfo?.slogan,
            logoUrl: companyInfo?.logoUrl,
            companyPhone: companyInfo?.companyPhone,
            accountNumber: companyInfo?.accountNumber,
            iban: companyInfo?.iban,
            bankName: companyInfo?.bankName,
            accountHolder: companyInfo?.accountHolder
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-4xl max-h-full bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/20">Sale Record</span>
                        </div>
                        <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight">Transaction Summary</h2>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-[var(--border)] text-slate-500 hover:text-rose-500 shadow-sm transition">
                        <FaXmark className="text-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total Sale</div>
                            <div className="text-lg font-black text-indigo-700 dark:text-indigo-400">Rs. {sale.finance.totalSell.toLocaleString()}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Net Profit</div>
                            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">Rs. {sale.finance.totalProfit.toLocaleString()}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Payment Status</div>
                            <div className={clsx("text-xs font-bold uppercase", sale.client.status === "Clear" ? "text-emerald-600" : "text-amber-600")}>Client: {sale.client.status}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/40  border border-[var(--border)]">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Transaction Date</div>
                            <div className="text-xs font-bold text-[var(--foreground)]">{new Date(sale.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Client & Vendor Sections */}
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <FaUser className="text-indigo-500" /> Customer Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Full Name:</span>
                                        <span className="text-xs font-bold text-[var(--foreground)]">{sale.client.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Contact Number:</span>
                                        <span className="text-xs font-bold text-indigo-500">{sale.client.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <FaShop className="text-amber-500" /> Vendor Pipeline
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Supplier Name:</span>
                                        <span className="text-xs font-bold text-[var(--foreground)]">{sale.vendor.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Dues Status:</span>
                                        <span className={clsx("text-xs font-bold", sale.vendor.status === "Paid" ? "text-emerald-500" : "text-rose-500")}>Vendor: {sale.vendor.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Items Section */}
                        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <FaTags className="text-indigo-500" /> Tools & Credentials
                            </h3>
                            <div className="space-y-3 flex-1">
                                {sale.items.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-xl  border border-[var(--border)]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs font-black text-[var(--foreground)]">{item.name}</div>
                                                <div className="text-[9px] text-indigo-500 font-bold uppercase">{item.type} • {item.plan || "Standard"}</div>
                                            </div>
                                            <div className="text-xs font-black text-emerald-600">Rs. {item.sell}</div>
                                        </div>
                                        {item.email && (
                                            <div className="mt-2 pt-2 border-t border-dashed border-[var(--border)] text-[10px] space-y-1">
                                                <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-mono text-[var(--foreground)]">{item.email}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Pass:</span> <span className="font-mono text-[var(--foreground)]">{item.pass}</span></div>
                                                {item.profileName && <div className="flex justify-between"><span className="text-slate-500">Profile:</span> <span className="font-bold text-amber-600">{item.profileName} (PIN: {item.profilePin})</span></div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Instructions Area */}
                    <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/10">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <FaCircleInfo className="text-indigo-500" /> Service Instructions & Warranty
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                            {sale.instructions || "No specific instructions provided for this transaction."}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/10 flex flex-col sm:flex-row gap-4">
                    <PlanFeatureGuard
                        feature="whatsappAlerts"
                        fallback={
                            <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-60">
                                <FaWhatsapp className="text-lg" /> WA Alerts Locked
                            </button>
                        }
                    >
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                        >
                            <FaWhatsapp className="text-lg" /> Send Credentials (WA)
                        </button>
                    </PlanFeatureGuard>

                    <PlanFeatureGuard
                        feature="pdf"
                        fallback={
                            <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-60">
                                <FaFilePdf className="text-lg" /> PDF Invoices Locked
                            </button>
                        }
                    >
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
                        >
                            <FaFilePdf className="text-lg" /> Download Invoice (PDF)
                        </button>
                    </PlanFeatureGuard>
                </div>
            </div>
        </div>
    );
}
