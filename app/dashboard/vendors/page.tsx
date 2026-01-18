"use client";

import { useState, useMemo } from "react";
import { useVendors } from "@/context/VendorContext";
import { useSales } from "@/context/SalesContext";
import { useInventory } from "@/context/InventoryContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { FaUserTag, FaPlus, FaTrash, FaPen, FaMoneyBillWave, FaCheck, FaRotateLeft, FaTableList, FaAddressCard, FaUserCheck, FaUserSlash, FaXmark, FaClockRotateLeft, FaTag, FaWrench } from "react-icons/fa6";
import { Vendor, Sale } from "@/types";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { db } from "@/lib/firebase";
import { doc, updateDoc, writeBatch } from "firebase/firestore";

export default function VendorsPage() {
    const { vendors, loading, addVendor, updateVendor, deleteVendor } = useVendors();
    const { sales } = useSales();
    const { items: inventory } = useInventory();
    const { user } = useAuth();
    const { showToast, confirm } = useToast();

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Vendor>>({});
    const [viewMode, setViewMode] = useState<"card" | "table">("card");

    const [newVendor, setNewVendor] = useState<{ name: string, phone: string, relatedTools: string[] }>({ name: "", phone: "", relatedTools: [] });
    const [toolInput, setToolInput] = useState("");
    const [selectedToolId, setSelectedToolId] = useState("");
    const [isCustomTool, setIsCustomTool] = useState(false);

    const handleAdd = async () => {
        if (!newVendor.name || !newVendor.phone) return showToast("Name and Phone are required", "error");
        await addVendor({ ...newVendor, status: "Paid", isMe: false });
        setNewVendor({ name: "", phone: "", relatedTools: [] });
        showToast("Vendor added successfully", "success");
    };

    const handleSetMe = async (vendorId: string) => {
        const ok = await confirm({
            title: "Set 'Me' Vendor",
            message: "This will mark this vendor as your identity for profit calculations. Only one vendor can be 'Me' at a time.",
            confirmText: "Set as Me",
            variant: "primary"
        });

        if (ok) {
            try {
                if (!user) return;
                const batch = writeBatch(db);
                vendors.forEach(v => {
                    const vRef = doc(db, "users", user.uid, "vendors", v.id!);
                    batch.update(vRef, { isMe: v.id === vendorId });
                });
                await batch.commit();
                showToast("'Me' vendor updated", "success");
            } catch (e) {
                showToast("Error setting 'Me' vendor", "error");
            }
        }
    };

    const handleUpdate = async () => {
        if (isEditing) {
            await updateVendor(isEditing, editForm);
            setIsEditing(null);
            showToast("Vendor updated", "success");
        }
    };

    const handleDeleteClick = async (id: string, name: string) => {
        const ok = await confirm({
            title: "Delete Vendor",
            message: `Are you sure you want to delete "${name}"? This will not remove their historical sales data.`,
            confirmText: "Delete Vendor",
            variant: "danger"
        });

        if (ok) {
            await deleteVendor(id);
            showToast("Vendor deleted", "success");
        }
    };

    // Calculate pending dues per vendor from sales
    const vendorSales = useMemo(() => {
        const mapping: Record<string, Sale[]> = {};
        sales.forEach(sale => {
            const name = sale.vendor?.name?.toUpperCase();
            if (!name) return;
            if (!mapping[name]) mapping[name] = [];
            mapping[name].push(sale);
        });
        return mapping;
    }, [sales]);

    const handleMarkPaid = async (saleId: string) => {
        try {
            if (!user) return;
            await updateDoc(doc(db, "users", user.uid, "salesHistory", saleId), {
                "vendor.status": "Paid"
            });
            showToast("Payment status updated", "success");
        } catch (e) {
            showToast("Error updating status", "error");
        }
    };

    const [viewingDues, setViewingDues] = useState<string | null>(null);

    // Filter to show ONLY vendors with dues OR those in the master list
    const allUniqueVendors = useMemo(() => {
        const list = [...vendors];
        // Add vendors from sales that are not in master list but have dues
        Object.keys(vendorSales).forEach(vName => {
            const hasDues = vendorSales[vName].some(s => s.vendor.status !== "Paid");
            const inMaster = vendors.some(v => v.name.toUpperCase() === vName);
            if (hasDues && !inMaster) {
                // Find a sale to get the phone number
                const sale = vendorSales[vName][0];
                list.push({
                    id: `transient-${vName}`,
                    name: sale.vendor.name,
                    phone: sale.vendor.phone,
                    status: "Unpaid",
                    isMe: false,
                    isTransient: true // helpful for flag
                } as Vendor);
            }
        });
        return list;
    }, [vendors, vendorSales]);

    return (
        <PlanFeatureGuard feature="vendors">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold">Manage Vendors</h2>
                    <div className="flex p-1.5 rounded-xl  border border-slate-200 dark:border-slate-700/50 self-end sm:self-auto">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${viewMode === "card" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            <FaAddressCard /> Card View
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition cursor-pointer ${viewMode === "table" ? "bg-indigo-100 dark:bg-indigo-900/30 shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            <FaTableList /> Table View
                        </button>

                    </div>
                </div>

                <Card>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FaUserTag className="text-indigo-500" /> Add New Vendor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <Input label="Vendor Name" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} />
                        <Input label="Contact Number" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} />
                        <div className="flex items-end">
                            <Button onClick={handleAdd} variant="success" className="btn-save !w-full"><FaPlus /> Add Vendor</Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Related Tools (Inventory or Custom)</label>
                        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20">
                            {newVendor.relatedTools.map(tool => (
                                <span key={tool} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800/50 group">
                                    <FaTag className="text-[8px]" /> {tool}
                                    <button
                                        onClick={() => setNewVendor(prev => ({ ...prev, relatedTools: prev.relatedTools.filter(t => t !== tool) }))}
                                        className="hover:text-rose-500 transition-colors"
                                    >
                                        <FaXmark className="text-[10px]" />
                                    </button>
                                </span>
                            ))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                    value={selectedToolId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedToolId(val);
                                        if (val === "custom") {
                                            setIsCustomTool(true);
                                        } else if (val) {
                                            if (!newVendor.relatedTools.includes(val)) {
                                                setNewVendor(prev => ({ ...prev, relatedTools: [...prev.relatedTools, val] }));
                                            }
                                            setIsCustomTool(false);
                                            setSelectedToolId("");
                                        }
                                    }}
                                >
                                    <option value="" disabled>Choose Tool...</option>
                                    <option value="custom">-- Custom Tool --</option>
                                    {Array.from(new Set(inventory.map((i: any) => i.name))).map((name: any) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>

                                {isCustomTool && (
                                    <input
                                        value={toolInput}
                                        onChange={(e) => setToolInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && toolInput.trim()) {
                                                e.preventDefault();
                                                if (!newVendor.relatedTools.includes(toolInput.trim())) {
                                                    setNewVendor(prev => ({ ...prev, relatedTools: [...prev.relatedTools, toolInput.trim()] }));
                                                }
                                                setToolInput("");
                                                setIsCustomTool(false);
                                                setSelectedToolId("");
                                            }
                                        }}
                                        placeholder="Type custom & Enter..."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {viewMode === "card" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allUniqueVendors.map(vendor => {
                            const unpaidSales = vendorSales[vendor.name.toUpperCase()]?.filter(s => s.vendor.status !== "Paid") || [];
                            const totalDues = unpaidSales.reduce((acc, s) => acc + s.finance.totalCost, 0);

                            return (
                                <Card key={vendor.id} className={`relative group transition-all border-2 ${vendor.isMe ? "border-indigo-500/50 bg-indigo-50/10" : "border-transparent"}`}>
                                    {vendor.isMe && (
                                        <div className="absolute -top-2 -right-2 bg-indigo-500 text-white p-1 px-2 rounded-lg text-[8px] font-bold shadow-lg flex items-center gap-1">
                                            <FaUserCheck /> ME
                                        </div>
                                    )}
                                    {isEditing === vendor.id ? (
                                        <div className="space-y-2">
                                            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Tools</label>
                                                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-[var(--border)] bg-white dark:bg-slate-900/50">
                                                    {(editForm.relatedTools || []).map(tool => (
                                                        <span key={tool} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold rounded border border-indigo-100 dark:border-indigo-800/30">
                                                            {tool}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setEditForm(prev => ({ ...prev, relatedTools: (prev.relatedTools || []).filter(t => t !== tool) }));
                                                                }}
                                                                className="hover:text-rose-500"
                                                            >
                                                                <FaXmark className="text-[8px]" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <div className="w-full space-y-2 mt-1">
                                                        <select
                                                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "custom") {
                                                                    // Handled by a local state or just focus the input if we add one properly
                                                                    // For simplicity in the compact card, we'll use a direct prompt if needed or just a small input
                                                                } else if (val) {
                                                                    if (!editForm.relatedTools?.includes(val)) {
                                                                        setEditForm(prev => ({ ...prev, relatedTools: [...(prev.relatedTools || []), val] }));
                                                                    }
                                                                    e.target.value = "";
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Choose Tool...</option>
                                                            <option value="custom">-- Custom Tool --</option>
                                                            {Array.from(new Set(inventory.map((i: any) => i.name))).map((name: any) => (
                                                                <option key={name} value={name}>{name}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            placeholder="Type custom & Enter..."
                                                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-[10px] focus:outline-none"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (val && !editForm.relatedTools?.includes(val)) {
                                                                        setEditForm(prev => ({ ...prev, relatedTools: [...(prev.relatedTools || []), val] }));
                                                                    }
                                                                    e.currentTarget.value = "";
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end mt-2">
                                                <Button onClick={() => setIsEditing(null)} variant="secondary" className="text-xs py-1">Cancel</Button>
                                                <Button onClick={handleUpdate} variant="success" className="text-xs py-1">Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-[var(--foreground)]">{vendor.name}</h4>
                                                    <p className="text-xs text-slate-500 mb-2">{vendor.phone}</p>
                                                    {vendor.relatedTools && vendor.relatedTools.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {vendor.relatedTools.map(t => (
                                                                <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded uppercase flex items-center gap-1">
                                                                    <FaWrench className="text-[7px]" /> {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!vendor.isTransient && (
                                                        <button
                                                            onClick={() => handleSetMe(vendor.id!)}
                                                            className={`p-1.5 rounded-lg text-[10px] shadow-sm transition cursor-pointer ${vendor.isMe ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"}`}
                                                            title={vendor.isMe ? "Currently set as Me" : "Set as Me"}
                                                        >
                                                            <FaUserCheck />
                                                        </button>
                                                    )}
                                                    {!vendor.isTransient && <button onClick={() => { setIsEditing(vendor.id!); setEditForm(vendor); }} className="icon-edit"><FaPen className="text-[12px]" /></button>}
                                                    {!vendor.isTransient && <button onClick={() => handleDeleteClick(vendor.id!, vendor.name)} className="icon-delete"><FaTrash className="text-[12px]" /></button>}
                                                    {vendor.isTransient && <span className="text-[8px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase">Temporary</span>}
                                                </div>
                                            </div>

                                            <div className=" p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <FaMoneyBillWave className="text-emerald-500" /> Pending Dues
                                                    </div>
                                                    <span className={`text-sm font-bold ${totalDues > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                        Rs. {totalDues}
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={() => setViewingDues(viewingDues === vendor.name ? null : vendor.name)}
                                                    variant="outline"
                                                    className="w-full py-1 text-[10px]"
                                                >
                                                    {viewingDues === vendor.name ? "Hide Details" : "Manage Dues"}
                                                </Button>
                                            </div>

                                            {viewingDues === vendor.name && (
                                                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 animate-in fade-in duration-300">
                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Sales</h5>
                                                    {unpaidSales.length === 0 ? (
                                                        <p className="text-[10px] text-slate-400 italic">No unpaid sales.</p>
                                                    ) : (
                                                        unpaidSales.map(sale => (
                                                            <div key={sale.id} className="flex items-center justify-between p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-[var(--foreground)]">{sale.client.name}</div>
                                                                    <div className="text-[9px] text-slate-500">Rs. {sale.finance.totalCost}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleMarkPaid(sale.id!)}
                                                                    className="btn-save p-1 px-2 text-[9px]"
                                                                >
                                                                    <FaCheck /> Mark Paid
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto max-w-[85vw] sm:max-w-full mx-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Vendor Name</th>
                                        <th className="px-6 py-4">Phone</th>
                                        <th className="px-6 py-4">Related Tools</th>
                                        <th className="px-6 py-4">Pending Dues</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {allUniqueVendors.map((vendor, idx) => {
                                        const unpaidSales = vendorSales[vendor.name.toUpperCase()]?.filter(s => s.vendor.status !== "Paid") || [];
                                        const totalDues = unpaidSales.reduce((acc, s) => acc + s.finance.totalCost, 0);

                                        return (
                                            <tr key={vendor.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${vendor.isMe ? "bg-indigo-50/5 dark:bg-indigo-500/5" : ""}`}>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    {vendor.isMe ? (
                                                        <span className="bg-indigo-100 text-indigo-600 p-1 px-2 rounded-md text-[8px] font-bold uppercase flex items-center w-fit gap-1">
                                                            <FaUserCheck /> Me
                                                        </span>
                                                    ) : vendor.isTransient ? (
                                                        <span className="bg-amber-100 text-amber-600 p-1 px-2 rounded-md text-[8px] font-bold uppercase flex items-center w-fit gap-1">
                                                            <FaClockRotateLeft /> Custom
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-600 p-1 px-2 rounded-md text-[8px] font-bold uppercase flex items-center w-fit gap-1">
                                                            <FaUserSlash className="opacity-50" /> Regular
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-sm">
                                                    {isEditing === vendor.id ? (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Input
                                                                value={editForm.name}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                                className="h-8 text-sm"
                                                                placeholder="Vendor Name"
                                                            />
                                                        </div>
                                                    ) : vendor.name}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                    {isEditing === vendor.id ? (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Input
                                                                value={editForm.phone}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                                className="h-8 text-xs font-mono"
                                                                placeholder="Phone"
                                                            />
                                                        </div>
                                                    ) : vendor.phone}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {isEditing === vendor.id ? (
                                                            <div className="flex flex-col gap-1 w-full min-w-[120px]">
                                                                <select
                                                                    className="px-2 py-1 text-[9px] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded outline-none w-full"
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val === "custom") {
                                                                            // Show the input below
                                                                        } else if (val) {
                                                                            if (!editForm.relatedTools?.includes(val)) {
                                                                                setEditForm(prev => ({ ...prev, relatedTools: [...(prev.relatedTools || []), val] }));
                                                                            }
                                                                            e.target.value = "";
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">Choose Tool...</option>
                                                                    <option value="custom">-- Custom Tool --</option>
                                                                    {Array.from(new Set(inventory.map((i: any) => i.name))).map((name: any) => (
                                                                        <option key={name} value={name}>{name}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    placeholder="Add custom & Enter..."
                                                                    className="px-2 py-1 text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded outline-none w-full"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const val = e.currentTarget.value.trim();
                                                                            if (val && !editForm.relatedTools?.includes(val)) {
                                                                                setEditForm(prev => ({ ...prev, relatedTools: [...(prev.relatedTools || []), val] }));
                                                                            }
                                                                            e.currentTarget.value = "";
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        {(isEditing === vendor.id ? editForm.relatedTools : vendor.relatedTools || [])?.map(t => (
                                                            <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded flex items-center gap-1 group">
                                                                {t}
                                                                {isEditing === vendor.id && (
                                                                    <button onClick={() => setEditForm(prev => ({ ...prev, relatedTools: prev.relatedTools?.filter(x => x !== t) }))}>
                                                                        <FaXmark className="text-[8px] hover:text-rose-500" />
                                                                    </button>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${totalDues > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                        Rs. {totalDues}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-3 justify-end">
                                                        {isEditing === vendor.id ? (
                                                            <>
                                                                <button
                                                                    onClick={handleUpdate}
                                                                    className="icon-save"
                                                                    title="Save Changes"
                                                                >
                                                                    <FaCheck className="text-[18px]" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setIsEditing(null); setEditForm({ name: "", phone: "" }); }}
                                                                    className="icon-delete"
                                                                    title="Cancel"
                                                                >
                                                                    <FaXmark className="text-[18px]" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {totalDues > 0 && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const ok = await confirm({
                                                                                title: "Clear All Dues?",
                                                                                message: `Mark all ${unpaidSales.length} pending sales as Paid for ${vendor.name}?`,
                                                                                confirmText: "Yes, Clear Dues"
                                                                            });
                                                                            if (ok) {
                                                                                try {
                                                                                    if (!user) return;
                                                                                    const batch = writeBatch(db);
                                                                                    unpaidSales.forEach(s => {
                                                                                        const ref = doc(db, "users", user.uid, "salesHistory", s.id!);
                                                                                        batch.update(ref, { "vendor.status": "Paid" });
                                                                                    });
                                                                                    await batch.commit();
                                                                                    showToast("All dues cleared", "success");
                                                                                } catch (e) {
                                                                                    showToast("Error clearing dues", "error");
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="icon-save"
                                                                        title="Mark All Dues as Clear"
                                                                    >
                                                                        <FaCheck />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleSetMe(vendor.id!)}
                                                                    className={`icon-check ${vendor.isMe ? "text-indigo-500 bg-indigo-50 font-bold" : "text-slate-400 hover:text-indigo-500"}`}
                                                                    title="Set as Me"
                                                                >
                                                                    <FaUserCheck />
                                                                </button>
                                                                {!vendor.isTransient && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setIsEditing(vendor.id!); setEditForm(vendor); }}
                                                                            className="icon-edit"
                                                                            title="Edit Vendor"
                                                                        >
                                                                            <FaPen />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClick(vendor.id!, vendor.name)}
                                                                            className="icon-delete"
                                                                            title="Delete Vendor"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

            </div>
        </PlanFeatureGuard>
    );
}
