"use client";

import { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { Card, Button, Input, Select } from "@/components/ui/Shared";
import { FaTrash, FaPen, FaPlus, FaBoxesStacked, FaTableList, FaAddressCard, FaFileImport } from "react-icons/fa6";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";
import { InventoryItem } from "@/types";

import { useToast } from "@/context/ToastContext";

export default function InventoryPage() {
    const { items, loading, addItem, updateItem, deleteItem } = useInventory();
    const { showToast, confirm } = useToast();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
    const [viewMode, setViewMode] = useState<"card" | "table">("card");

    // New Item State
    const [newItem, setNewItem] = useState<InventoryItem>({
        name: "", type: "Shared", cost: "" as any, sell: "" as any
    });

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            let addedCount = 0;

            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) continue;

                // Expected format: Name,Plan,Type,Cost,Sell
                const cols = line.split(',');
                if (cols.length < 5) continue;

                const item: InventoryItem = {
                    name: cols[0].trim(),
                    plan: cols[1].trim() || undefined,
                    type: (cols[2].trim() as any) || "Shared",
                    cost: parseFloat(cols[3].trim()) || 0,
                    sell: parseFloat(cols[4].trim()) || 0,
                };

                if (item.name) {
                    await addItem(item);
                    addedCount++;
                }
            }
            showToast(`Imported ${addedCount} items successfully`, "success");
            // Reset input
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleAdd = async () => {
        if (!newItem.name) return showToast("Tool name is required", "error");
        await addItem(newItem);
        setNewItem({ name: "", type: "Shared", cost: 0, sell: 0 });
        showToast("Added to inventory", "success");
    };

    const handleUpdate = async () => {
        if (!isEditing) return;
        await updateItem(isEditing, editForm);
        setIsEditing(null);
        setEditForm({});
        showToast("Inventory updated", "success");
    };

    const handleDeleteClick = async (id: string, name: string) => {
        const ok = await confirm({
            title: "Delete Inventory Item",
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmText: "Delete Permanently",
            variant: "danger"
        });

        if (ok) {
            await deleteItem(id);
            showToast("Item removed from inventory", "success");
        }
    };

    const startEdit = (item: InventoryItem) => {
        setIsEditing(item.id!);
        setEditForm(item);
    };

    return (
        <PlanFeatureGuard feature="inventory">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold">Manage Inventory</h2>
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
                    <h3 className="text-sm font-black mb-4 flex items-center justify-between gap-2 uppercase tracking-wide">
                        <span className="flex items-center gap-2"><FaBoxesStacked className="text-indigo-500" /> Add New Inventory Item</span>
                        <label className="cursor-pointer flex items-center gap-2 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                            <FaFileImport /> Import CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                        </label>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                        <Input label="Tool Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "" })} />
                        <Input label="Plan (e.g. Pro)" value={newItem.plan || ""} onChange={(e) => setNewItem({ ...newItem, plan: e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "" })} />
                        <Select label="Type" value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}>
                            <option value="Shared">Shared</option>
                            <option value="Private">Private</option>
                            <option value="Screen">Screen</option>
                        </Select>
                        <Input label="Cost Price" type="number" value={newItem.cost} onChange={(e) => setNewItem({ ...newItem, cost: e.target.value === "" ? "" as any : parseFloat(e.target.value) })} />
                        <Input label="Sell Price" type="number" value={newItem.sell} onChange={(e) => setNewItem({ ...newItem, sell: e.target.value === "" ? "" as any : parseFloat(e.target.value) })} />
                    </div>
                    <button onClick={handleAdd} className="btn-save px-6 py-2.5">
                        <FaPlus className="mr-2" /> Add Item
                    </button>
                </Card>

                {loading ? <div className="text-center py-20 text-slate-400">Loading Inventory...</div> :
                    viewMode === "card" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(item => (
                                <Card key={item.id} className="relative group transition-colors overflow-hidden">
                                    {isEditing === item.id ? (
                                        <div className="space-y-3">
                                            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "" })} />
                                            <Input label="Default Plan (e.g. Pro)" value={editForm.plan || ""} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "" })} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input label="Cost" type="number" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value === "" ? "" as any : parseFloat(e.target.value) })} />
                                                <Input label="Sell" type="number" value={editForm.sell} onChange={(e) => setEditForm({ ...editForm, sell: e.target.value === "" ? "" as any : parseFloat(e.target.value) })} />
                                            </div>
                                            <div className="flex gap-2 justify-end mt-2">
                                                <button onClick={() => setIsEditing(null)} className="btn-secondary text-[10px] py-1 px-3">Cancel</button>
                                                <button onClick={handleUpdate} className="btn-save text-[10px] py-1 px-3">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                                    <h4 className="font-black text-[11px] uppercase tracking-widest text-[var(--foreground)] truncate">
                                                        {item.name}
                                                    </h4>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(item)} className="icon-edit"><FaPen className="text-[14px]" /></button>
                                                    <button onClick={() => handleDeleteClick(item.id!, item.name)} className="icon-delete"><FaTrash className="text-[14px]" /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-3">
                                                <div className="text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Cost: </span>
                                                    <span className="font-black text-slate-600 dark:text-slate-400">Rs. {item.cost}</span>
                                                </div>
                                                <div className="text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Sell: </span>
                                                    <span className="font-black text-emerald-600">Rs. {item.sell}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-transparent">
                                                    {item.type}
                                                </span>
                                                {item.plan && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-100 dark:border-indigo-800">
                                                        {item.plan}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar max-w-[85vw] sm:max-w-full mx-auto">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-5 dark:bg-slate-800/50 text-slate-500 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Tool Name</th>
                                            <th className="px-6 py-4">Plan</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Cost Price</th>
                                            <th className="px-6 py-4">Sell Price</th>
                                            <th className="px-6 py-4">Profit</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition group">
                                                <td className="px-6 py-4 font-black text-[var(--foreground)]">{item.name}</td>
                                                <td className="px-6 py-4  font-bold">{item.plan || "-"}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-[9px] font-bold uppercase bg-transparent">
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">Rs. {item.cost}</td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">Rs. {item.sell}</td>
                                                <td className="px-6 py-4 text-indigo-500 font-black italic">Rs. {item.sell - item.cost}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEdit(item)} className="icon-edit"><FaPen className="text-[16px]" /></button>
                                                        <button onClick={() => handleDeleteClick(item.id!, item.name)} className="icon-delete"><FaTrash className="text-[16px]" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

            </div>
        </PlanFeatureGuard>
    );
}
