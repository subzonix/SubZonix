import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ToolItem, Sale, InventoryItem, Client } from "@/types";
import { Button, Input, Select, Card } from "@/components/ui/Shared";
import Autocomplete from "@/components/ui/Autocomplete";
import ToolInput from "./ToolInput";
import { FaFloppyDisk, FaWhatsapp, FaFilePdf, FaCalculator, FaUserClock, FaMagnifyingGlass, FaCircleExclamation, FaPlus, FaClockRotateLeft } from "react-icons/fa6";
import { cleanPhone, generateInvoicePDF } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useInventory } from "@/context/InventoryContext";
import { useVendors } from "@/context/VendorContext";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/lib/logger";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";


export default function SaleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const { items: inventoryItems } = useInventory();
    const { vendors } = useVendors();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [vendorName, setVendorName] = useState("");
    const [vendorPhone, setVendorPhone] = useState("");
    const [clientStatus, setClientStatus] = useState<"Clear" | "Pending" | "Partial">("Clear");
    const [vendorStatus, setVendorStatus] = useState<"Paid" | "Unpaid" | "Credit">("Paid");
    const [pendingAmount, setPendingAmount] = useState<number | "">("");
    const [instructions, setInstructions] = useState("No Instructions");
    const [existingClients, setExistingClients] = useState<Client[]>([]);
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>({ companyName: "", logoUrl: "", accountNumber: "", iban: "", bankName: "", accountHolder: "", reminderTemplate: "", instructions: {} });

    const INSTRUCTION_TEMPLATES = useMemo(() => {
        return companyInfo.instructions || {
            "Shared": "This is a shared account. Please do not change password or profile settings.",
            "Mail Access": "Full mail access provided. You can change the password after login.",
            "Private": "This is a private account. Only you have access to this subscription."
        };
    }, [companyInfo]);

    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [tools, setTools] = useState<ToolItem[]>([
        { name: "", type: "Shared", pDate: today, eDate: nextMonth, sell: 0, cost: 0, plan: "" }
    ]);

    // Load Sale if editing
    useEffect(() => {
        if (editId) {
            const load = async () => {
                if (!user) return;
                const snap = await getDoc(doc(db, "users", user.uid, "salesHistory", editId));
                if (snap.exists()) {
                    const data = snap.data() as Sale;
                    if (data.client) {
                        setClientName(data.client.name || "");
                        setClientPhone(data.client.phone || "");
                        setClientEmail(data.client.email || "");
                        setClientStatus(data.client.status || "Clear");
                    }
                    if (data.vendor) {
                        setVendorName(data.vendor.name || "");
                        setVendorPhone(data.vendor.phone || "");
                        setVendorStatus(data.vendor.status || "Paid");
                    }
                    if (data.finance) {
                        setPendingAmount(data.finance.pendingAmount);
                    }
                    if (data.instructions) {
                        setInstructions(data.instructions);
                    }
                    if (data.items) {
                        setTools(data.items);
                    }
                }
            };
            load();
        }
    }, [editId]);

    // Fetch existing clients for autocomplete and Settings
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            const snap = await getDoc(doc(db, "users", user.uid, "settings", "general"));
            if (snap.exists()) setCompanyInfo(snap.data() as any);
        };
        loadSettings();

        const fetchClients = async () => {
            if (!user) return;
            const q = query(
                collection(db, "users", user.uid, "salesHistory"),
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
                    const mappedTools = order.items.map((item: any) => {
                        // Try to find matching item in inventory
                        const match = inventoryItems.find(inv =>
                            inv.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                        );

                        if (match) {
                            return {
                                name: match.name,
                                type: match.type || "Shared",
                                pDate: today,
                                eDate: nextMonth,
                                cost: match.cost,
                                sell: match.sell,
                                plan: match.plan || "",
                                inventoryId: match.id
                            };
                        }

                        return {
                            name: item.name,
                            type: "Shared",
                            pDate: today,
                            eDate: nextMonth,
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
            return next;
        });
    };

    const addTool = () => {
        if (tools.length >= 5) return;
        setTools([...tools, { name: "", type: "Shared", pDate: today, eDate: nextMonth, sell: 0, cost: 0, plan: "" }]);
    };

    const removeTool = (idx: number) => {
        setTools(tools.filter((_, i) => i !== idx));
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
        return errs.length === 0;
    };

    const handleSave = async (action: "save" | "whatsapp" | "pdf") => {
        if (!validate()) return;
        if (!user) {
            showToast("You must be logged in to save.", "error");
            return;
        }
        setLoading(true);
        try {
            let createdAt = Date.now();

            const saleData: any = {
                client: { name: clientName, phone: clientPhone, status: clientStatus, email: clientEmail },
                vendor: { name: vendorName, phone: vendorPhone, status: vendorStatus },
                items: tools,
                finance: { totalSell, totalCost, totalProfit, pendingAmount: Number(pendingAmount) || 0 },
                instructions,
                createdAt
            };

            if (editId) {
                await updateDoc(doc(db, "users", user.uid, "salesHistory", editId), saleData);
            } else {
                await addDoc(collection(db, "users", user.uid, "salesHistory"), { ...saleData, userId: user.uid });
            }

            if (action === "pdf") {
                showToast("Generating PDF Invoice...", "info");
                generateInvoicePDF(saleData, {
                    name: companyInfo.companyName,
                    logo: companyInfo.logoUrl,
                    account: companyInfo.accountNumber,
                    iban: companyInfo.iban,
                    bankName: companyInfo.bankName,
                    accountHolder: companyInfo.accountHolder
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
                    toolsList += `*Tool # ${i + 1}*\n`;
                    toolsList += `* Tool Name : ${t.name}${t.type === 'Shared' ? ' (Shared)' : ''}\n`;
                    if (t.plan) toolsList += `* Plan : ${t.plan}\n`;
                    toolsList += `*Credentials*\n`;
                    toolsList += `* Email : ${t.email || "N/A"}\n`;
                    toolsList += `* Password : ${t.pass || "N/A"}\n`;
                    if (t.profileName) toolsList += `* Profile : ${t.profileName}\n`;
                    if (t.profilePin) toolsList += `* Pin : ${t.profilePin}\n`;
                    toolsList += `* Price : ${t.sell}\n`;
                    toolsList += `Expiry Date : *${formatDate(t.eDate)}*\n\n`;
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

                // Get Template
                let templateText = companyInfo.receiptTemplate || "*Order Receipt*\n\nDear *[Client]*,\n\nThe following memberships are [ActionType] on [Date].\n`Thank u for choosing and trusting [TrustText] [Company Name]`\n\n[ToolsList]\n\n*Payment Summary*\nTotal : [Total]\nStatus : [Status]\n\n[AccountInfo]\n\n> Thank you for trusting *[Company Name]*.\n_© Powered by TapnTools_";

                // Replace Variables
                let msg = templateText
                    .replace(/\[Client\]/g, clientName)
                    .replace(/\[ActionType\]/g, actionText)
                    .replace(/\[Date\]/g, todayFormatted)
                    .replace(/\[TrustText\]/g, trustText)
                    .replace(/\[Company Name\]/g, companyInfo.companyName || "Tapn Tools")
                    .replace(/\[ToolsList\]/g, toolsList.trim())
                    .replace(/\[Total\]/g, String(totalSell))
                    .replace(/\[Status\]/g, statusText)
                    .replace(/\[AccountInfo\]/g, accountInfo);

                // Handle Instructions
                if (instructions && instructions !== "No Instructions") {
                    msg += `\n\n*Note:* ${instructions}`;
                }

                window.open(`https://wa.me/${cleanPhone(clientPhone)}?text=${encodeURIComponent(msg)}`, '_blank');
                showToast("WhatsApp opened for receipt", "info");
            }

            showToast("Transaction saved successfully", "success");

            // Increment Sales Count and Enforce Limit
            if (user && !editId) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userSnapshot = await getDoc(userRef);
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        const newCount = (userData.currentSalesCount || 0) + 1;
                        const limit = userData.salesLimit || Infinity;

                        let updateData: any = { currentSalesCount: newCount };

                        // Check if limit reached
                        if (newCount >= limit) {
                            updateData.status = "paused";
                            logAction(user.uid, "Account Paused", `User reached sales limit of ${limit}. Account auto-paused.`);
                        }

                        await updateDoc(userRef, updateData);
                    }
                } catch (err) {
                    console.error("Error updating usage limit:", err);
                }
            }

            // Log the action
            if (user) {
                const toolNames = tools.map(t => t.name).join(", ");
                logAction(user.uid, editId ? "Sale Updated" : "Sale Added", `${editId ? 'Updated' : 'Added'} sale for ${clientName}. Tools: ${toolNames}. Total: ${totalSell}`);
            }

            if (!editId) router.push("/history");

        } catch (e: any) {
            showToast("Error saving: " + e.message, "error");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {errors.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-4 rounded-xl flex gap-3 animate-in slide-in-from-top duration-300">
                    <FaCircleExclamation className="mt-1" />
                    <div>
                        <p className="font-bold text-sm">Please correct the following errors:</p>
                        <ul className="text-xs list-disc list-inside">
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="space-y-4 relative">
                    <div className="flex justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">Client Details</h3>
                        <button onClick={() => setShowClientSearch(!showClientSearch)} className="text-xs text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition">
                            <FaMagnifyingGlass /> Find Previous
                        </button>
                    </div>

                    {showClientSearch && (
                        <div className="absolute top-10 right-4 z-10 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <FaClockRotateLeft className="text-indigo-500" /> Recent 5 Customers
                            </div>
                            <div className="divide-y divide-[var(--border)]">
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
                        onChange={(val) => setClientName(val ? val.charAt(0).toUpperCase() + val.slice(1) : "")}
                        onSelect={(c: Client) => handleClientSelect(c)}
                        suggestions={existingClients}
                        searchKey="name"
                        secondaryKey="phone"
                        required
                    />
                    <Input placeholder="Client Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                    <Input placeholder="Email (Optional)" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
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
                            onChange={(val) => setVendorName(val ? val.charAt(0).toUpperCase() + val.slice(1) : "")}
                            onSelect={(v: any) => {
                                setVendorName(v.name);
                                setVendorPhone(v.phone);
                            }}
                            suggestions={vendors}
                            searchKey="name"
                            readOnly={selectedVendorId !== "custom"}
                            className={selectedVendorId !== "custom" ? "cursor-not-allowed opacity-70" : ""}
                        />
                        <Input label="Phone" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} readOnly={selectedVendorId !== "custom"} className={selectedVendorId !== "custom" ? "cursor-not-allowed opacity-70" : ""} />
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
                            onChange={(field, val) => updateTool(idx, field as any, val)}
                            onRemove={() => removeTool(idx)}
                            onAdd={addTool}
                            showRemove={tools.length > 1}
                            inventoryItems={inventoryItems}
                            suggestions={inventoryItems} // Pass inventory as suggestions for tool name
                        />
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="space-y-4">
                    <Select label="Client Payment Status" value={clientStatus} onChange={(e) => setClientStatus(e.target.value as any)}>
                        <option value="Clear">Full Payment Received</option>
                        <option value="Pending">Payment Pending</option>
                        <option value="Partial">Partial Payment</option>
                    </Select>
                    {(clientStatus === "Pending" || clientStatus === "Partial") && (
                        <Input label="Pending Amount" type="number" value={pendingAmount === 0 ? "" : pendingAmount} onChange={(e) => setPendingAmount(e.target.value)} />
                    )}
                </Card>
                <Card className="space-y-4">
                    <Select label="My Payment to Vendor" value={vendorStatus} onChange={(e) => setVendorStatus(e.target.value as any)}>
                        <option value="Paid">I have Paid Full</option>
                        <option value="Unpaid">I have Not Paid Yet</option>
                    </Select>
                    <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-800">
                        <div className="flex justify-between text-xs text-rose-700 dark:text-rose-400">
                            <span>Vendor Debt (Cost Price)</span>
                            <span className="font-bold">Rs. {vendorStatus !== "Paid" ? totalCost : 0}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Instructions selected via dropdown only */}
            <Card className="mb-24">
                <Select
                    label="Quick Instructions"
                    value={Object.keys(INSTRUCTION_TEMPLATES).find(k => instructions.startsWith(INSTRUCTION_TEMPLATES[k])) || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val && INSTRUCTION_TEMPLATES[val]) {
                            const template = INSTRUCTION_TEMPLATES[val];
                            const companyFooter = `\n${companyInfo.companyName || "Tapn Tools"} and powered by TapnTools`;
                            setInstructions(template + companyFooter);
                        } else {
                            setInstructions("No Instructions");
                        }
                    }}
                >
                    <option value="">No Instructions</option>
                    {Object.keys(INSTRUCTION_TEMPLATES).map(k => (
                        <option key={k} value={k}>{k}</option>
                    ))}
                </Select>
                {instructions !== "No Instructions" && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-[var(--border)] text-[var(--foreground)]">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-pre-wrap">{instructions}</p>
                    </div>
                )}
            </Card>

            {/* Summary Footer */}
            {/* Summary Footer */}
            <div
                className="
                    fixed bottom-0 left-0 right-0 z-40
                    bg-[var(--card)]
                    border-t border-[var(--border)]
                    md:pl-64
                    transition-colors
                "
            >
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                        {/* Summary Stats */}
                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="px-3 py-1.5 rounded-lg  border border-slate-200  dark:border-slate-700">
                                <div className="text-[10px] text-slate-600">
                                    Total Sell
                                </div>
                                <div className="font-semibold text-slate-900 dark:text-slate-600">
                                    {totalSell}
                                </div>
                            </div>

                            <div className="px-3 py-1.5 rounded-lg  border border-slate-200   dark:border-slate-700">
                                <div className="text-[10px] text-slate-600 ">
                                    Total Cost
                                </div>
                                <div className="font-semibold text-slate-900 dark:text-slate-600">
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
                                <Button
                                    onClick={() => handleSave("whatsapp")}
                                    variant="secondary"
                                    disabled={loading}
                                    className="btn-whatsapp"
                                >
                                    <FaWhatsapp /> Send
                                </Button>
                            </PlanFeatureGuard>

                            <PlanFeatureGuard
                                feature="pdf"
                                fallback={
                                    <span title="Upgrade plan for PDF generation" className="cursor-not-allowed">
                                        <Button
                                            disabled
                                            variant="success"
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
        </div>
    );
}
