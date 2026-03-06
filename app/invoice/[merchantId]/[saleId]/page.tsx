"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import {
    FaWhatsapp,
    FaFilePdf,
    FaUser,
    FaCalendar,
    FaCircleInfo,
    FaTags,
    FaShieldHalved,
    FaCircleCheck,
    FaPrint
} from "react-icons/fa6";
import { motion } from "framer-motion";
import { toHumanDate, cleanPhone } from "@/lib/utils";
import { handleDownloadPDF } from "@/lib/pdfUtils";
import { MorphingSquare } from "@/components/ui/morphing-square";

interface MerchantSettings {
    companyName: string;
    slogan: string;
    logoUrl: string;
    companyPhone: string;
    accountNumber: string;
    iban: string;
    bankName: string;
    accountHolder: string;
}

export default function PublicInvoicePage() {
    const params = useParams();
    const merchantId = params.merchantId as string;
    const saleId = params.saleId as string;

    const [merchant, setMerchant] = useState<MerchantSettings | null>(null);
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (merchantId && saleId) {
            loadData();
        }
    }, [merchantId, saleId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load Merchant Settings
            // Merchant settings are in users/{uid}/settings/general
            const merchantSnap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
            if (merchantSnap.exists()) {
                setMerchant(merchantSnap.data() as MerchantSettings);
            } else {
                setError("Merchant not found");
                setLoading(false);
                return;
            }

            // Load Sale Record
            const saleSnap = await getDoc(doc(db, "users", merchantId, "salesHistory", saleId));
            if (saleSnap.exists()) {
                setSale(saleSnap.data() as Sale);
            } else {
                setError("Invoice not found");
            }
        } catch (err) {
            console.error("Error loading invoice:", err);
            setError("Failed to load invoice details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!sale || !merchant) return;
        handleDownloadPDF(sale, {
            companyName: merchant.companyName,
            slogan: merchant.slogan,
            logoUrl: merchant.logoUrl,
            companyPhone: merchant.companyPhone,
            accountNumber: merchant.accountNumber,
            iban: merchant.iban,
            bankName: merchant.bankName,
            accountHolder: merchant.accountHolder
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400">
                <MorphingSquare message="Authenticating Invoice Access..." />
            </div>
        );
    }

    if (error || !merchant || !sale) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 text-rose-500">
                    <FaCircleInfo className="text-4xl" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{error || "Access Denied"}</h1>
                <p className="text-slate-500 mt-2 max-w-sm">This invoice link may be expired or invalid. Please contact the merchant for assistance.</p>
                <a href="/" className="mt-8 px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg">Return Home</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] text-slate-900 selection:bg-indigo-100 selection:text-indigo-600 font-sans pb-20">
            {/* Action Bar (Sticky) */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200">
                        {merchant.logoUrl ? (
                            <img src={merchant.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-white font-black italic">{merchant.companyName?.[0]}</span>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{merchant.companyName}</div>
                        <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Digital Invoice</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                    >
                        <FaPrint /> Print
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
                    >
                        <FaFilePdf /> <span className="hidden xs:inline">Download</span> PDF
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-10 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                >
                    {/* Invoice Header Section */}
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 p-10 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-400/20 rounded-full blur-3xl -ml-32 -mb-32" />

                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3">Invoice</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">#{saleId.slice(-6).toUpperCase()}</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        <FaCalendar className="text-[12px]" />
                                        {new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-start md:items-end">
                                <div className="text-3xl font-black tracking-tight">Rs. {sale.finance.totalSell.toLocaleString()}</div>
                                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {sale.client.status === "Clear" ? "Payment Received" : `Pending: Rs. ${sale.finance.pendingAmount}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
                        {/* Customer & Merchant Info */}
                        <div className="grid md:grid-cols-2 gap-10 border-b border-slate-100 pb-10">
                            <div>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <FaUser className="text-indigo-500" /> Billed To
                                </h2>
                                <div className="space-y-1">
                                    <div className="text-lg font-black text-slate-800">{sale.client.name}</div>
                                    <div className="text-sm font-bold text-indigo-600">{sale.client.phone}</div>
                                    {sale.client.email && <div className="text-xs text-slate-500">{sale.client.email}</div>}
                                </div>
                            </div>
                            <div className="md:text-right">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 md:justify-end">
                                    <FaCircleCheck className="text-emerald-500" /> Issued By
                                </h2>
                                <div className="space-y-1">
                                    <div className="text-lg font-black text-slate-800 uppercase tracking-tight">{merchant.companyName}</div>
                                    <div className="text-xs text-slate-500 font-medium">{merchant.slogan}</div>
                                    <div className="text-xs font-bold text-slate-600 mt-2">WhatsApp: {merchant.companyPhone}</div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div>
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <FaTags className="text-indigo-500" /> Ordered Services
                            </h2>
                            <div className="space-y-4">
                                {sale.items.map((item, idx) => (
                                    <div key={idx} className="group p-6 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-600/5 hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{item.name}</h3>
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-md">{item.type}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">{item.plan || "Premium Account"} • Valid until {toHumanDate(item.eDate)}</div>
                                            </div>
                                            <div className="text-lg font-black text-slate-900">Rs. {item.sell.toLocaleString()}</div>
                                        </div>

                                        {(item.email || item.pass) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200">
                                                {item.email && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">User / Login Email</div>
                                                        <div className="text-xs font-bold text-slate-800 break-all select-all font-mono">{item.email}</div>
                                                    </div>
                                                )}
                                                {item.pass && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Security Credentials</div>
                                                        <div className="text-xs font-bold text-slate-800 select-all font-mono">{item.pass}</div>
                                                    </div>
                                                )}
                                                {item.profileName && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-100 sm:col-span-2">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Assigned Profile</div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-xs font-bold text-amber-600">{item.profileName}</div>
                                                            {item.profilePin && (
                                                                <div className="text-xs font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-lg">PIN: {item.profilePin}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {item.loginLink && (
                                                    <div className="sm:col-span-2">
                                                        <a
                                                            href={item.loginLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex flex-col p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition truncate"
                                                        >
                                                            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mb-1">Access URL</div>
                                                            <div className="text-xs font-bold text-indigo-600 truncate">{item.loginLink}</div>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Details & Instructions */}
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <FaShieldHalved className="text-indigo-500" /> Instructions & Warranty
                                </h2>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                    {sale.instructions || "No specific instructions provided. Please follow general terms and conditions for all digital services provided."}
                                </p>
                            </div>

                            {sale.client.status !== "Clear" && (
                                <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100">
                                    <h2 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <FaCircleInfo /> Payment Details
                                    </h2>
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-amber-700 font-bold mb-4 uppercase tracking-wider">Please complete the remaining payment of Rs. {sale.finance.pendingAmount} using these details:</p>
                                        <div className="space-y-3">
                                            {merchant.bankName && (
                                                <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl">
                                                    <span className="text-[10px] text-amber-800 font-bold uppercase">Bank</span>
                                                    <span className="text-xs font-black text-amber-900">{merchant.bankName}</span>
                                                </div>
                                            )}
                                            {merchant.accountNumber && (
                                                <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl">
                                                    <span className="text-[10px] text-amber-800 font-bold uppercase">Account</span>
                                                    <span className="text-xs font-black text-amber-900 select-all font-mono">{merchant.accountNumber}</span>
                                                </div>
                                            )}
                                            {merchant.iban && (
                                                <div className="bg-white/40 p-2.5 rounded-xl">
                                                    <div className="text-[10px] text-amber-800 font-bold uppercase mb-1">IBAN</div>
                                                    <div className="text-[10px] font-black text-amber-900 break-all select-all font-mono tracking-widest">{merchant.iban}</div>
                                                </div>
                                            )}
                                            {merchant.accountHolder && (
                                                <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl">
                                                    <span className="text-[10px] text-amber-800 font-bold uppercase">Holder</span>
                                                    <span className="text-xs font-black text-amber-900">{merchant.accountHolder}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {sale.client.status === "Clear" && (
                                <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-inner">
                                        <FaCircleCheck className="text-3xl text-emerald-500" />
                                    </div>
                                    <h3 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Fully Paid</h3>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Thank you for your business!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Powered by</div>
                        <h4 className="text-white text-lg sm:text-xl font-black tracking-tighter uppercase">{merchant.companyName}</h4>
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                            <a
                                href={`https://wa.me/${cleanPhone(merchant.companyPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white/60 hover:text-white transition text-[10px] sm:text-xs font-bold"
                            >
                                <FaWhatsapp className="text-emerald-500" /> WhatsApp Support
                            </a>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 hidden sm:block" />
                            <div className="text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} SubZonix.cloud</div>
                        </div>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-lg mx-auto">
                    This is a secure digital invoice generated for {sale.client.name}. Credentials provided are strictly for personal use as per terms.
                </p>
            </div>
        </div>
    );
}
