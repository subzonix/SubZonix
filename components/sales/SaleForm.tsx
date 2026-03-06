"use client";
import { useState, useEffect, useMemo } from "react";
import { addMonths, addDays, addYears, format, parseISO } from "date-fns";
import Link from "next/link";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, limit, orderBy, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ToolItem, Sale, InventoryItem, Client } from "@/types";
import { Button, Input, Select, Card } from "@/components/ui/Shared";
import Autocomplete from "@/components/ui/Autocomplete";
import ToolInput from "./ToolInput";
import { FaFloppyDisk, FaWhatsapp, FaFilePdf, FaCalculator, FaUserClock, FaMagnifyingGlass, FaCircleExclamation, FaPlus, FaClockRotateLeft, FaPen, FaCalendar, FaFaceSmile } from "react-icons/fa6";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { cleanPhone, generateInvoicePDF, sanitizeForWhatsApp, getLocalIsoDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useInventory } from "@/context/InventoryContext";
import { useVendors } from "@/context/VendorContext";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/lib/logger";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { EMOJIS } from "@/lib/emojis";


export default function SaleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const { items: inventoryItems } = useInventory();
    const { vendors } = useVendors();
    const { showToast, confirm } = useToast();
    const { user, merchantId, isStaff, appName, invoiceDomain } = useAuth(); // use merchantId, isStaff and appName

    const [loading, setLoading] = useState(false);
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientStatus, setClientStatus] = useState<"Clear" | "Pending" | "Partial">("Clear");
    const [vendorName, setVendorName] = useState("");
    const [vendorPhone, setVendorPhone] = useState("");
    const [vendorStatus, setVendorStatus] = useState<"Paid" | "Unpaid" | "Credit">("Paid");
    const [pendingAmount, setPendingAmount] = useState(0);
    const [instructions, setInstructions] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [saleDate, setSaleDate] = useState(getLocalIsoDate());
    const [tools, setTools] = useState<ToolItem[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [existingClients, setExistingClients] = useState<Client[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    const today = getLocalIsoDate();
    const nextMonth = getLocalIsoDate(new Date(new Date().setDate(new Date().getDate() + 30)));



    // ...



    // Initialize default tool when saleDate is set
    useEffect(() => {
        if (tools.length === 0 && !editId) {
            setTools([{
                name: "",
                type: "Shared",
                pDate: saleDate,
                eDate: format(addMonths(parseISO(saleDate), 1), "yyyy-MM-dd"),
                duration: "30",
                sell: 0,
                cost: 0,
                plan: ""
            }]);
        }
    }, [saleDate, editId]);

    // Load Sale if editing
    useEffect(() => {
        if (editId) {
            const load = async () => {
                if (!merchantId) return; // use merchantId
                const snap = await getDoc(doc(db, "users", merchantId, "salesHistory", editId)); // use merchantId
                if (snap.exists()) {
                    // ...
                    const data = snap.data() as Sale;
                    if (data.client) {
                        // ...
                        setClientName(data.client.name || "");
                        // ...
                        setClientPhone(data.client.phone || "");
                        setClientEmail(data.client.email || "");
                        setClientStatus(data.client.status || "Clear");
                    }
                    if (data.vendor) {
                        setVendorName(data.vendor.name || "");
                        setVendorPhone(data.vendor.phone || "");
                        setVendorStatus(data.vendor.status as any || "Paid");
                    }
                    if (data.finance) {
                        setPendingAmount(data.finance.pendingAmount);
                    }
                    if (data.instructions) {
                        setInstructions(data.instructions);
                    }
                    if (data.instructions) {
                        setInstructions(data.instructions);
                    }
                    if (data.createdAt) {
                        setSaleDate(getLocalIsoDate(new Date(data.createdAt)));
                    }
                    if (data.items) {
                        setTools(data.items);
                    }
                }
            };
            load();
        }
    }, [editId, merchantId]); // deps

    // Fetch existing clients for autocomplete and Settings
    useEffect(() => {
        const loadSettings = async () => {
            if (!merchantId) return;
            const snap = await getDoc(doc(db, "users", merchantId, "settings", "general"));
            if (snap.exists()) {
                const data = snap.data() as any;
                // Auto-heal corrupted templates: if receipt template has \uFFFD (replacement char),
                // regenerate it with fresh emojis from String.fromCodePoint() and save to Firestore.
                if (data.receiptTemplate && data.receiptTemplate.includes('\uFFFD')) {
                    const freshTemplate = `*${EMOJIS.PACKAGE} Order Receipt*\n\nDear *[Client]*,\n\nThe following memberships are [ActionType] on [Date]. ${EMOJIS.HIGH_VOLTAGE}\n\`Thank u for choosing and trusting [TrustText] [Company Name]\`\n\n[ToolsList]\n\n*${EMOJIS.CREDIT_CARD} Payment Summary*\n${EMOJIS.MONEY_BAG} Total : [Total]\n${EMOJIS.GEM_STONE} Status : [Status]\n\n[AccountInfo]\n\n> Thank you for trusting *[Company Name]*. ${EMOJIS.SPARKLES}\n_© Powered by subzonix.cloud_`;
                    data.receiptTemplate = freshTemplate;
                    // Persist the fixed template back to Firestore silently
                    updateDoc(doc(db, "users", merchantId, "settings", "general"), { receiptTemplate: freshTemplate }).catch(() => { });
                }
                setCompanyInfo(data);
            }
        };
        loadSettings();

        const fetchClients = async () => {
            if (!merchantId) return;
            const q = query(
                collection(db, "users", merchantId, "salesHistory"),
                orderBy("createdAt", "desc"),
                limit(50)
            ); const snap = await getDocs(q);
            const clients: Client[] = [];
            const seen = new Set();
            snap.forEach(d => {
                const c = d.data().client;
                if (c && c.phone && !seen.has(c.phone)) {
                    seen.add(c.phone);
                    clients.push(c);
                }
            });
            setExistingClients(clients);
        };
        fetchClients();
    }, []);

    // Handle incoming shop orders
    useEffect(() => {
        const pendingOrder = sessionStorage.getItem("pending_order_sale");
        if (pendingOrder) {
            try {
                const order = JSON.parse(pendingOrder);
                setClientName(order.clientName || "");
                setClientPhone(order.clientPhone || "");
                setClientEmail(order.clientEmail || "");

                if (order.items && order.items.length > 0 && inventoryItems.length > 0) {
                    const defaultExpiry = new Date(saleDate);
                    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
                    const expiryDate = defaultExpiry.toISOString().slice(0, 10);

                    const mappedTools = order.items.map((item: any) => {
                        // Try to find matching item in inventory
                        const match = inventoryItems.find(inv =>
                            inv.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                        );

                        if (match) {
                            return {
                                name: match.name,
                                type: match.type || "Shared",
                                pDate: saleDate,
                                eDate: expiryDate,
                                cost: match.cost,
                                sell: match.sell,
                                plan: match.plan || "",
                                inventoryId: match.id
                            };
                        }

                        return {
                            name: item.name,
                            type: "Shared",
                            pDate: saleDate,
                            eDate: expiryDate,
                            cost: 0,
                            sell: item.price || 0,
                            plan: "",
                            inventoryId: "custom"
                        };
                    });
                    setTools(mappedTools);
                }
                sessionStorage.removeItem("pending_order_sale");
                showToast("Order data populated from Shop!", "success");
            } catch (err) {
                console.error("Error parsing pending order:", err);
            }
        }
    }, [inventoryItems]);

    const lastFiveClients = existingClients.slice(0, 5);

    const updateTool = (idx: number, fieldOrData: keyof ToolItem | null, value?: any) => {
        setTools(prev => {
            const next = [...prev];
            if (fieldOrData === null && typeof value === "object") {
                next[idx] = { ...next[idx], ...value };
            } else if (typeof fieldOrData === "string") {
                next[idx] = { ...next[idx], [fieldOrData]: value };
            }
            setIsDirty(true);
            return next;
        });
    };

    const addTool = () => {
        if (tools.length >= 5) return;
        setTools([...tools, {
            name: "",
            type: "Shared",
            pDate: saleDate,
            eDate: format(addMonths(parseISO(saleDate), 1), "yyyy-MM-dd"),
            duration: "30",
            sell: 0,
            cost: 0,
            plan: ""
        }]);
        setIsDirty(true);
    };

    const removeTool = (idx: number) => {
        setTools(tools.filter((_, i) => i !== idx));
        setIsDirty(true);
    };

    // Tool Totals
    const { totalSell, totalCost, totalProfit } = useMemo(() => {
        const sell = tools.reduce((sum, t) => sum + (t.sell || 0), 0);
        const cost = tools.reduce((sum, t) => sum + (t.cost || 0), 0);
        return { totalSell: sell, totalCost: cost, totalProfit: sell - cost };
    }, [tools]);

    // Pending Amount Logic
    useEffect(() => {
        if (clientStatus === "Pending") setPendingAmount(totalSell);
        else if (clientStatus === "Clear") setPendingAmount(0);
    }, [clientStatus, totalSell]);

    // Sync tool purchase dates with sale date
    const handleSaleDateChange = (date: string) => {
        setSaleDate(date);
        setIsDirty(true);
        setTools(prev => prev.map(t => {
            const pDate = parseISO(date);
            let newEDate = t.eDate;

            if (t.duration === "30") {
                newEDate = format(addMonths(pDate, 1), "yyyy-MM-dd");
            } else if (t.duration === "60") {
                newEDate = format(addMonths(pDate, 2), "yyyy-MM-dd");
            } else if (t.duration === "365") {
                newEDate = format(addYears(pDate, 1), "yyyy-MM-dd");
            } else if (t.duration === "custom" || !t.duration) {
                // Shift relatively for custom/legacy tools
                const oldPDate = parseISO(t.pDate);
                const oldEDate = parseISO(t.eDate);
                const daysDiff = Math.abs(Math.round((oldEDate.getTime() - oldPDate.getTime()) / (1000 * 60 * 60 * 24)));
                newEDate = format(addDays(pDate, daysDiff), "yyyy-MM-dd");
            }

            return {
                ...t,
                pDate: date,
                eDate: newEDate
            };
        }));
    };

    const handleVendorSelect = (id: string) => {
        if (id === "custom") {
            setSelectedVendorId("custom");
            setVendorName("");
            setVendorPhone("");
            return;
        }
        const v = vendors.find(ven => ven.id === id);
        if (v) {
            setSelectedVendorId(id);
            setVendorName(v.name);
            setVendorPhone(v.phone);
        }
        setIsDirty(true);
    };

    const handleSetMe = () => {
        const me = vendors.find(v => (v as any).isMe);
        if (me) {
            handleVendorSelect(me.id!);
            showToast(`Auto-selected "${me.name}" (Me)`, "info");
        } else {
            showToast("Default vendor ('Me') not found. Set in Vendors page.", "error");
        }
    };

    const handleClientSelect = (c: Client) => {
        setClientName(c.name);
        setClientPhone(c.phone);
        if (c.email) setClientEmail(c.email);
        setShowClientSearch(false);
        setIsDirty(true);
    };

    const validate = () => {
        const errs: string[] = [];
        if (!clientName) errs.push("Client Name is required");
        if (!clientPhone) errs.push("Client Phone is required");
        if (!vendorName) errs.push("Vendor Selection is required");

        if (tools.length === 0) {
            errs.push("At least one tool is required");
        } else {
            tools.forEach((t, i) => {
                const toolNum = i + 1;
                if (!t.name || t.name.trim() === "") {
                    errs.push(`Tool #${toolNum} must have a name`);
                }
                if (t.sell <= 0) {
                    errs.push(`Tool #${toolNum} ("${t.name || 'Unnamed'}") must have a selling price greater than 0`);
                }
            });
        }

        setErrors(errs);
        return errs;
    };

    const handleSave = async (action: "save" | "whatsapp" | "pdf") => {
        const newErrors = validate();
        if (newErrors.length > 0) {
            showToast("Please fill all required fields", "warning");
            return;
        }
        if (!merchantId) {
            showToast("You must be logged in/staff to save.", "error");
            return;
        }
        setLoading(true);
        try {
            const allSalesSnap = await getDocs(collection(db, "users", merchantId, "salesHistory"));
            const allSales = allSalesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));

            // Map to track sales that need recalculation/update
            const salesToUpdate = new Map<string, Sale>();

            // Calculate shared costs for current tools
            const finalTools = tools.map((tool, toolIdx) => {
                if ((tool.type !== 'Shared' && tool.type !== 'Screen') || !tool.email || !tool.pass) {
                    return tool;
                }

                // Find all matches (current tools + historical)
                const histMatches: { saleId: string, itemIdx: number }[] = [];
                allSales.forEach(s => {
                    if (s.id === editId) return; // Skip the current sale being edited (it will be replaced)
                    s.items.forEach((item, idx) => {
                        if ((item.type === 'Shared' || item.type === 'Screen') &&
                            item.name && tool.name &&
                            item.name.toLowerCase().trim() === tool.name.toLowerCase().trim() &&
                            (item.plan || '').toLowerCase().trim() === (tool.plan || '').toLowerCase().trim() &&
                            item.email && tool.email &&
                            item.email.toLowerCase().trim() === tool.email.toLowerCase().trim() &&
                            item.pass && tool.pass &&
                            item.pass.toLowerCase().trim() === tool.pass.toLowerCase().trim()) {
                            histMatches.push({ saleId: s.id!, itemIdx: idx });
                        }
                    });
                });

                const currentMatches = tools.filter(t =>
                    (t.type === 'Shared' || t.type === 'Screen') &&
                    t.name && tool.name &&
                    t.name.toLowerCase().trim() === tool.name.toLowerCase().trim() &&
                    (t.plan || '').toLowerCase().trim() === (tool.plan || '').toLowerCase().trim() &&
                    t.email && tool.email &&
                    t.email.toLowerCase().trim() === tool.email.toLowerCase().trim() &&
                    t.pass && tool.pass &&
                    t.pass.toLowerCase().trim() === tool.pass.toLowerCase().trim()
                ).length;

                const totalShares = histMatches.length + currentMatches;

                // Get original cost from inventory
                const invItem = inventoryItems.find(i => i.name.toLowerCase().trim() === tool.name.toLowerCase().trim());
                const originalCost = invItem ? (Number(invItem.cost) || 0) : (Number(tool.cost) || 0);
                const unitCost = originalCost / (totalShares || 1);

                // Add historical sales to update list
                histMatches.forEach(m => {
                    const sale = salesToUpdate.get(m.saleId) || allSales.find(as => as.id === m.saleId);
                    if (sale) {
                        sale.items[m.itemIdx].cost = unitCost;
                        sale.items[m.itemIdx].shares = totalShares;
                        salesToUpdate.set(m.saleId, sale);
                    }
                });

                return { ...tool, cost: unitCost, shares: totalShares };
            });

            // Recalculate Finance for Current Sale
            const finalTotalCost = finalTools.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
            const finalTotalProfit = totalSell - finalTotalCost;

            // Preserve current time if editing or today, otherwise use start of day for selected date
            let createdAt = Date.now();
            const selectedDate = new Date(saleDate);
            const now = new Date();

            // Set the time of selectedDate to current time
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            createdAt = selectedDate.getTime();

            const saleData: any = {
                client: { name: clientName, phone: clientPhone, status: clientStatus, email: clientEmail },
                vendor: { name: vendorName, phone: vendorPhone, status: vendorStatus },
                items: finalTools,
                finance: { totalSell, totalCost: finalTotalCost, totalProfit: finalTotalProfit, pendingAmount: Number(pendingAmount) || 0 },
                instructions,
                createdAt
            };

            // Update matched historical sales
            if (salesToUpdate.size > 0) {
                const batch = writeBatch(db);
                for (const [sId, sData] of salesToUpdate.entries()) {
                    const sCost = sData.items.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
                    const sProfit = Number(sData.finance.totalSell || 0) - sCost;
                    batch.update(doc(db, "users", merchantId, "salesHistory", sId), {
                        items: sData.items,
                        finance: { ...sData.finance, totalCost: sCost, totalProfit: sProfit }
                    });
                }
                await batch.commit();
            }

            let savedId = editId;
            if (editId) {
                await updateDoc(doc(db, "users", merchantId, "salesHistory", editId), saleData);
            } else {
                const docRef = await addDoc(collection(db, "users", merchantId, "salesHistory"), { ...saleData, userId: user?.uid, createdByStaff: !!(user && user.uid !== merchantId) });
                savedId = docRef.id;
            }

            if (action === "pdf") {
                showToast("Generating PDF Invoice...", "info");
                generateInvoicePDF(saleData, {
                    name: companyInfo.companyName,
                    logo: companyInfo.logoUrl,
                    account: companyInfo.accountNumber,
                    iban: companyInfo.iban,
                    bankName: companyInfo.bankName,
                    accountHolder: companyInfo.accountHolder,
                    loginLink: saleData.loginLink
                });
            } else if (action === "whatsapp") {
                const isRenew = existingClients.some(c => c.phone === clientPhone);
                const actionText = isRenew ? "renewed" : "succesfully activated";
                const trustText = isRenew ? "again" : "";

                const formatDate = (d: string) => {
                    if (!d) return "";
                    const date = new Date(d);
                    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                };

                const todayFormatted = formatDate(today);

                // Build Tools List
                let toolsList = "";
                tools.forEach((t, i) => {
                    toolsList += `*${EMOJIS.WRENCH} Tool # ${i + 1}*\n`;
                    toolsList += `* Tool Name : ${t.name}${t.type === 'Shared' ? ' (Shared)' : ''}\n`;
                    if (t.plan) toolsList += `* Plan : ${t.plan}\n`;
                    toolsList += `*${EMOJIS.LOCK_KEY} Credentials*\n`;
                    toolsList += `* Email : ${t.email || "N/A"}\n`;
                    toolsList += `* Password : ${t.pass || "N/A"}\n`;
                    if (t.profileName) toolsList += `* Profile : ${t.profileName}\n`;
                    if (t.profilePin) toolsList += `* Pin : ${t.profilePin}\n`;
                    if (t.loginLink) toolsList += `* ${EMOJIS.LINK} Login Link : ${t.loginLink}\n`;
                    if (t.mailAccess) toolsList += `* ${EMOJIS.ENVELOPE} Mail Access : ${t.mailAccess}\n`;
                    if (t.mailAccessPassword) toolsList += `* ${EMOJIS.LOCK_KEY} Mail Password : ${t.mailAccessPassword}\n`;
                    toolsList += `* ${EMOJIS.MONEY_BAG} Price : ${t.sell}\n`;
                    toolsList += `${EMOJIS.CALENDAR} Expiry Date : *${formatDate(t.eDate)}*\n\n`;
                });

                // Build Status & Account Info
                let statusText = clientStatus === "Clear" ? "Paid (Clear)" : `Pending (Amount: ${pendingAmount})`;
                let accountInfo = "";
                if (clientStatus !== "Clear") {
                    accountInfo += `*Account Information:*\n`;
                    accountInfo += `* Bank Name: ${companyInfo.bankName || "user not set yet"}\n`;
                    accountInfo += `* Holder Name: ${companyInfo.accountHolder || "user not set yet"}\n`;
                    accountInfo += `* IBAN or Account No.: ${companyInfo.iban || companyInfo.accountNumber || "user not set yet"}`;
                }

                // Get Template - use fresh default with correct emojis
                const defaultReceiptTemplate = `*${EMOJIS.PACKAGE} Order Receipt*\n\nDear *[Client]*,\n\nThe following memberships are [ActionType] on [Date]. ${EMOJIS.HIGH_VOLTAGE}\n\`Thank u for choosing and trusting [TrustText] [Company Name]\`\n\n[ToolsList]\n\n*${EMOJIS.CREDIT_CARD} Payment Summary*\n${EMOJIS.MONEY_BAG} Total : [Total]\n${EMOJIS.GEM_STONE} Status : [Status]\n\n[AccountInfo]\n\n> Thank you for trusting *[Company Name]*. ${EMOJIS.SPARKLES}\n_© Powered by subzonix.cloud_`;
                let templateText = companyInfo.receiptTemplate || defaultReceiptTemplate;

                // Replace Variables
                const saleLoginLink = tools[0]?.loginLink || "";
                let msg = templateText
                    .replace(/\[Client\]/g, clientName)
                    .replace(/\[ActionType\]/g, actionText)
                    .replace(/\[Date\]/g, todayFormatted)
                    .replace(/\[TrustText\]/g, trustText)
                    .replace(/\[Company Name\]/g, companyInfo.companyName || "SubZonix")
                    .replace(/\[ToolsList\]/g, toolsList.trim())
                    .replace(/\[Total\]/g, String(totalSell))
                    .replace(/\[Status\]/g, statusText)
                    .replace(/\[AccountInfo\]/g, accountInfo)
                    .replace(/\n?.*\[LoginLink\].*/g, (match: string) => saleLoginLink ? match.replace("[LoginLink]", saleLoginLink) : "");

                // Handle Instructions
                if (instructions && instructions !== "No Instructions") {
                    msg += `\n\n*Note:* ${instructions}`;
                }

                window.open(`https://wa.me/${cleanPhone(clientPhone)}?text=${encodeURIComponent(sanitizeForWhatsApp(msg))}`, '_blank');
                showToast("WhatsApp opened for receipt", "info");
            }

            showToast("Transaction saved successfully", "success");
            setIsDirty(false);

            // Increment Sales Count and Enforce Limit
            if (merchantId && !editId) {
                try {
                    const userRef = doc(db, "users", merchantId);
                    const userSnapshot = await getDoc(userRef);
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        const newCount = (userData.currentSalesCount || 0) + 1;
                        const limit = userData.salesLimit || Infinity;

                        let updateData: any = { currentSalesCount: newCount };

                        // Check if limit reached
                        if (newCount >= limit) {
                            updateData.status = "paused";
                            logAction(merchantId, "Account Paused", `User reached sales limit. Account auto-paused.`);
                        }

                        await updateDoc(userRef, updateData);
                    }
                } catch (err) {
                    console.error("Error updating usage limit:", err);
                }
            }

            // Log the action
            if (merchantId && user) {
                const toolNames = tools.map(t => t.name).join(", ");
                logAction(merchantId, editId ? "Sale Updated" : "Sale Added", `${editId ? 'Updated' : 'Added'} sale for ${clientName}. Tools: ${toolNames}. Total: ${totalSell} by ${user.email || 'Staff'}`);
            }

            if (!editId) router.push("/dashboard/history");

        } catch (e: any) {
            showToast("Error saving: " + e.message, "error");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 pb-32">
            {errors.length > 0 && (
                <Card className="border-rose-200 bg-rose-50 dark:bg-rose-900/10 mb-6 font-bold">
                    <div className="flex items-start gap-3">
                        <FaCircleExclamation className="text-rose-500 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Please fix the following:</h4>
                            <ul className="text-xs text-rose-700 dark:text-rose-400 mt-1 list-disc list-inside">
                                {errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            )}

            {/* Sale Date Section - Enhanced Design */}
            <Card className="relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Icon */}
                    <div className="flex items-center gap-4 sm:gap-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50">
                            <FaCalendar className="text-2xl" />
                        </div>
                        <div className="sm:hidden">
                            <div className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Sale Date</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Transaction Date</div>
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="hidden sm:block text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-2">
                            Sale Date
                        </label>
                        <Input
                            type="date"
                            value={saleDate}
                            onChange={(e) => handleSaleDateChange(e.target.value)}
                            required
                            className="bg-white dark:bg-slate-900 max-w-xs"
                        />
                    </div>

                    {/* Info Text */}
                    <div className="hidden sm:flex flex-col items-end text-right bg-white/60 dark:bg-slate-700/40 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-700/30 backdrop-blur-sm">
                        <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
                            Transaction Date
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                            All items will use this date
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="space-y-4 relative">
                    <div className="flex justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">Client Details</h3>
                        <button onClick={() => setShowClientSearch(!showClientSearch)} className="text-xs text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition">
                            <FaMagnifyingGlass /> Find Previous
                        </button>
                    </div>

                    {showClientSearch && (
                        <div className="absolute top-10 right-4 z-50 w-64 bg-card border border-border rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <FaClockRotateLeft className="text-indigo-500" /> Recent 5 Customers
                            </div>
                            <div className="divide-y divide-border">
                                {lastFiveClients.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">No recent clients found</div>
                                ) : (
                                    lastFiveClients.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { handleClientSelect(c); setShowClientSearch(false); }}
                                            className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                        >
                                            <div className="text-sm font-bold">{c.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <Autocomplete
                        label="Client Name"
                        placeholder="Client Name"
                        value={clientName}
                        onChange={(val) => { setClientName(val ? val.charAt(0).toUpperCase() + val.slice(1) : ""); setIsDirty(true); }}
                        onSelect={(c: Client) => handleClientSelect(c)}
                        suggestions={existingClients}
                        searchKey="name"
                        secondaryKey="phone"
                        required
                    />
                    <Input placeholder="Client Phone" value={clientPhone} onChange={(e) => { setClientPhone(e.target.value); setIsDirty(true); }} required />
                    <Input placeholder="Email (Optional)" type="email" value={clientEmail} onChange={(e) => { setClientEmail(e.target.value); setIsDirty(true); }} />
                </Card>

                <Card className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Vendor Selection</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Select label="Choose Vendor" value={selectedVendorId} onChange={(e) => handleVendorSelect(e.target.value)}>
                                <option value="" disabled>Select a vendor...</option>
                                {vendors.map(v => <option key={v.id} value={v.id!}>{v.name}</option>)}
                                <option value="custom">-- Custom Vendor --</option>
                            </Select>
                        </div>
                        <Button onClick={handleSetMe} variant="outline" className="h-9 mt-6 text-xs whitespace-nowrap">
                            Set Me
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Autocomplete
                            label="Name"
                            value={vendorName}
                            onChange={(val) => { setVendorName(val ? val.charAt(0).toUpperCase() + val.slice(1) : ""); setIsDirty(true); }}
                            onSelect={(v: any) => {
                                setVendorName(v.name);
                                setVendorPhone(v.phone);
                            }}
                            suggestions={vendors}
                            searchKey="name"
                            readOnly={selectedVendorId !== "custom"}
                            className={selectedVendorId !== "custom" ? "cursor-not-allowed opacity-70" : ""}
                        />
                        <Input label="Phone" value={vendorPhone} onChange={(e) => { setVendorPhone(e.target.value); setIsDirty(true); }} readOnly={selectedVendorId !== "custom"} className={selectedVendorId !== "custom" ? "cursor-not-allowed opacity-70" : ""} />
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Tools ({tools.length})</h3>
                    <div className="flex gap-2">
                        <Button onClick={addTool} disabled={tools.length >= 5} variant="secondary" className="btn-edit">
                            <FaPlus /> Add Tool
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {tools.map((tool, idx) => (
                        <ToolInput
                            key={idx}
                            index={idx}
                            data={tool}
                            onChange={(field, val) => updateTool(idx, field, val)}
                            onRemove={() => removeTool(idx)}
                            onAdd={addTool}
                            showRemove={tools.length > 1}
                            inventoryItems={inventoryItems}
                            isStaff={isStaff}
                        />
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="space-y-4">
                    <Select label="Client Payment Status" value={clientStatus} onChange={(e) => { setClientStatus(e.target.value as any); setIsDirty(true); }}>
                        <option value="Clear">Full Payment Received</option>
                        <option value="Pending">Payment Pending</option>
                        <option value="Partial">Partial Payment</option>
                    </Select>
                    {(clientStatus === "Pending" || clientStatus === "Partial") && (
                        <Input label="Pending Amount" type="number" value={pendingAmount === 0 ? "" : pendingAmount} onChange={(e) => { setPendingAmount(e.target.value); setIsDirty(true); }} />
                    )}
                </Card>
                <Card className="space-y-4">
                    <Select label="My Payment to Vendor" value={vendorStatus} onChange={(e) => { setVendorStatus(e.target.value as any); setIsDirty(true); }}>
                        <option value="Paid">I have Paid Full</option>
                        <option value="Unpaid">I have Not Paid Yet</option>
                    </Select>
                    {!isStaff && (
                        <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-800">
                            <div className="flex justify-between text-xs text-rose-700 dark:text-rose-400">
                                <span>Vendor Debt (Cost Price)</span>
                                <span className="font-bold">Rs. {vendorStatus !== "Paid" ? totalCost : 0}</span>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Instructions selected via dropdown only */}
            <Card className="mb-32">
                <Select
                    label="Quick Instructions"
                    value={Object.keys(companyInfo?.instructions || {}).find(k => instructions.startsWith(companyInfo?.instructions?.[k] || "")) || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        const templates = companyInfo?.instructions || {};
                        if (val && templates[val]) {
                            const template = templates[val];
                            setInstructions(template);
                        } else {
                            setInstructions("");
                        }
                        setIsDirty(true);
                    }}
                >
                    <option value="">-- Select Template --</option>
                    {Object.keys(companyInfo?.instructions || {}).length > 0 ? (
                        Object.keys(companyInfo?.instructions || {}).map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))
                    ) : (
                        <option value="" disabled>No templates found (Add in Templates)</option>
                    )}
                </Select>
                <div className="flex justify-between mt-1">
                    <button
                        onClick={() => {
                            setInstructions("");
                            setIsDirty(true);
                        }}
                        className="text-[10px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-bold"
                    >
                        <FaPlus className="text-[8px]" /> Add Custom Instructions
                    </button>
                    <button
                        onClick={async () => {
                            if (isDirty) {
                                const ok = await confirm({
                                    title: "Unsaved Changes",
                                    message: "You have unsaved changes. Do you want to leave and go to templates?",
                                    confirmText: "Leave",
                                    variant: "danger"
                                });
                                if (!ok) return;
                            }
                            router.push("/dashboard/reminders");
                        }}
                        className="text-[10px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-bold"
                    >
                        <FaPen className="text-[8px]" /> Edit Templates
                    </button>
                </div>
                {(instructions || isDirty) && (
                    <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Instruction Content
                        </label>
                        <textarea
                            id="instructions-textarea"
                            value={instructions}
                            onChange={(e) => {
                                setInstructions(e.target.value);
                                setIsDirty(true);
                            }}
                            className="w-full h-32 p-4 text-[11px] bg-background text-foreground border border-dashed border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none font-medium leading-relaxed"
                            placeholder="Type custom instructions here..."
                        />
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1 self-center">Format:</span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textarea = document.getElementById('instructions-textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const selectedText = instructions.substring(start, end);
                                        const newText = instructions.substring(0, start) + `*${selectedText}*` + instructions.substring(end);
                                        setInstructions(newText);
                                        setIsDirty(true);
                                        setTimeout(() => { textarea.focus(); textarea.selectionStart = start + 1; textarea.selectionEnd = end + 1; }, 0);
                                    }
                                }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                title="Bold (*)"
                            >
                                *B*
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textarea = document.getElementById('instructions-textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const selectedText = instructions.substring(start, end);
                                        const newText = instructions.substring(0, start) + `_${selectedText}_` + instructions.substring(end);
                                        setInstructions(newText);
                                        setIsDirty(true);
                                        setTimeout(() => { textarea.focus(); textarea.selectionStart = start + 1; textarea.selectionEnd = end + 1; }, 0);
                                    }
                                }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer italic"
                                title="Italic (_)"
                            >
                                _I_
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textarea = document.getElementById('instructions-textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const selectedText = instructions.substring(start, end);
                                        const newText = instructions.substring(0, start) + `~${selectedText}~` + instructions.substring(end);
                                        setInstructions(newText);
                                        setIsDirty(true);
                                        setTimeout(() => { textarea.focus(); textarea.selectionStart = start + 1; textarea.selectionEnd = end + 1; }, 0);
                                    }
                                }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer line-through"
                                title="Strike (~)"
                            >
                                ~S~
                            </button>
                            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-0.5 self-center"></div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textarea = document.getElementById('instructions-textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        const start = textarea.selectionStart;
                                        const textBeforeCursor = instructions.substring(0, start);
                                        const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
                                        const isAtLineStart = lastNewlineIndex === start - 1 || start === 0;
                                        const bullet = isAtLineStart ? '• ' : '\n• ';
                                        setInstructions(instructions.substring(0, start) + bullet + instructions.substring(start));
                                        setIsDirty(true);
                                        setTimeout(() => { textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + bullet.length; }, 0);
                                    }
                                }}
                                className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                                • Bullet
                            </button>
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.preventDefault(); setShowEmojiPicker(!showEmojiPicker); }}
                                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-600 text-white font-black border border-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                    title="Add Emoji"
                                >
                                    <FaFaceSmile />
                                </button>
                                {showEmojiPicker && (
                                    <EmojiPicker
                                        onSelect={(emoji) => {
                                            setInstructions(instructions + emoji);
                                            setIsDirty(true);
                                            setShowEmojiPicker(false);
                                        }}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Summary Footer */}
            {/* Summary Footer */}
            <div
                className="
                    fixed bottom-0 left-0 right-0 z-40
                    bg-card
                    border-t border-border
                    md:pl-64
                    transition-colors
                "
            >
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                        {/* Summary Stats */}
                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="px-3 py-1.5 rounded-lg  border border-slate-200  dark:border-slate-700">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                    Total Sell
                                </div>
                                <div className="font-black text-foreground">
                                    {totalSell}
                                </div>
                            </div>

                            {!isStaff && (
                                <>
                                    <div className="px-3 py-1.5 rounded-lg  border border-slate-200   dark:border-slate-700">
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                            Total Cost
                                        </div>
                                        <div className="font-black text-foreground">
                                            {totalCost}
                                        </div>
                                    </div>

                                    <div className="px-4 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-black tracking-widest">
                                            Total Profit
                                        </div>
                                        <div className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                                            Rs. {totalProfit}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => handleSave("save")}
                                variant="secondary"
                                disabled={loading}
                                className="btn-save"
                            >
                                <FaFloppyDisk /> Save
                            </Button>


                            <PlanFeatureGuard
                                feature="whatsappAlerts"
                                fallback={
                                    <span title="Upgrade plan for WhatsApp alerts" className="cursor-not-allowed">
                                        <Button
                                            disabled
                                            variant="secondary"
                                            className="btn-whatsapp opacity-50"
                                        >
                                            <FaWhatsapp /> Send (Locked)
                                        </Button>
                                    </span>
                                }
                            >
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleSave("whatsapp")}
                                        variant="secondary"
                                        disabled={loading}
                                        className="btn-whatsapp"
                                    >
                                        <FaWhatsapp /> Send
                                    </Button>
                                </div>
                            </PlanFeatureGuard>

                            <PlanFeatureGuard
                                feature="pdf"
                                fallback={
                                    <span title="Upgrade plan for PDF generation" className="cursor-not-allowed">
                                        <Button
                                            disabled
                                            variant="secondary"
                                            className="btn-pdf opacity-50"
                                        >
                                            <FaFilePdf /> PDF (Locked)
                                        </Button>
                                    </span>
                                }
                            >
                                <Button
                                    onClick={() => handleSave("pdf")}
                                    variant="success"
                                    disabled={loading}
                                    className="btn-pdf"
                                >
                                    <FaFilePdf /> PDF
                                </Button>
                            </PlanFeatureGuard>
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}
