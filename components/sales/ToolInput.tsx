"use client"; // needed if using app directory in Next.js

import { ToolItem, InventoryItem } from "@/types";
import { FaTrash, FaPlus } from "react-icons/fa6";
import { Card, Input, Select } from "@/components/ui/Shared";
import Autocomplete from "@/components/ui/Autocomplete";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Props {
    // ... existing Props continue ...
    data: ToolItem;
    index: number;
    onChange: (field: keyof ToolItem | null, value: any) => void;
    onRemove: () => void;
    onAdd: () => void;
    showRemove: boolean;
    inventoryItems?: InventoryItem[];
    suggestions?: InventoryItem[];
}

export default function ToolInput({
    data,
    index,
    onChange,
    onRemove,
    onAdd,
    showRemove,
    inventoryItems = [],
    suggestions = [],
}: Props) {
    const isNetflix =
        data.name.toLowerCase().includes("netflix") ||
        data.name.toLowerCase().includes("prime");
    const [isCustomTool, setIsCustomTool] = useState(data.inventoryId === "custom");
    const [isCustomDuration, setIsCustomDuration] = useState(false);

    // Sync custom tool state if data changes (e.g. from shop order population)
    useEffect(() => {
        if (data.inventoryId === "custom") {
            setIsCustomTool(true);
        } else if (data.inventoryId) {
            setIsCustomTool(false);
        }
    }, [data.inventoryId]);

    // Auto-link to inventory ID
    const selectedId = data.inventoryId || inventoryItems.find(i => i.name === data.name)?.id || (isCustomTool ? "custom" : "");

    const handleInventorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (id === "custom") {
            setIsCustomTool(true);
            onChange("name", "");
            return;
        }

        setIsCustomTool(false);
        const item = inventoryItems.find((i) => i.id === id);
        if (item) {
            onChange(null, {
                name: item.name,
                type: item.type,
                plan: item.plan || "", // Default to inventory item plan, or fallback
                cost: item.cost ?? 0,
                sell: item.sell ?? 0,
            });
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "custom") {
            setIsCustomDuration(true);
            return;
        }

        setIsCustomDuration(false);
        const days = parseInt(value);
        if (isNaN(days)) return;

        const pDate = new Date(data.pDate || Date.now());
        const eDate = new Date(pDate);

        if (days === 365) {
            eDate.setFullYear(eDate.getFullYear() + 1);
        } else {
            eDate.setDate(eDate.getDate() + days);
        }

        onChange("eDate", eDate.toISOString().slice(0, 10));
        // Removed auto-setting of "plan" text here to separate duration from plan name (Pro/Premium)
    };

    const formatDate = (value: string) =>
        value ? format(new Date(value), "dd-MMM-yyyy") : "";

    return (
        <Card className="relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase">
                    Tool #{index + 1}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAdd}
                        className="icon-edit"
                        title="Add another tool"
                    >
                        <FaPlus className="text-xs" />
                    </button>
                    {showRemove && (
                        <button
                            onClick={onRemove}
                            className="icon-delete"
                        >
                            <FaTrash className="text-xs" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tool Selection */}
            <div className="grid md:grid-cols-4 gap-3 mb-3">
                <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">
                        Tool Selection
                    </label>
                    <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                        onChange={handleInventorySelect}
                        value={selectedId}
                    >
                        <option value="" disabled>
                            Choose Tool...
                        </option>
                        <option value="custom">-- Custom Tool --</option>
                        {inventoryItems.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name}
                            </option>
                        ))}
                    </select>
                </div>

                {isCustomTool && (
                    <div className="col-span-1">
                        <Autocomplete
                            label="Custom Tool Name"
                            placeholder="e.g. Canva Pro"
                            value={data.name}
                            onChange={(val) => onChange("name", val)}
                            onSelect={(item: InventoryItem) =>
                                onChange(null, {
                                    name: item.name,
                                    type: item.type,
                                    cost: item.cost ?? 0,
                                    sell: item.sell ?? 0,
                                })
                            }
                            suggestions={inventoryItems}
                            searchKey="name"
                            className="border-indigo-200"
                        />
                    </div>
                )}

                <Select
                    label="Type"
                    value={data.type}
                    onChange={(e) => onChange("type", e.target.value)}
                >
                    <option value="Shared">Shared</option>
                    <option value="Private">Private</option>
                    <option value="Screen">Screen</option>
                </Select>

                <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">
                        Duration Plan
                    </label>
                    <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition"
                        onChange={handleDurationChange}
                        defaultValue="30"
                    >
                        <option value="30">1 Month (30 Days)</option>
                        <option value="60">2 Months (60 Days)</option>
                        <option value="365">1 Year (12 Months)</option>
                        <option value="custom">Custom Duration</option>
                    </select>
                </div>

                <div className="col-span-1">
                    <Input
                        label="Plan Text (e.g. Pro, Premium)"
                        placeholder="e.g. Pro Plan, Premium"
                        value={data.plan || ""}
                        onChange={(e) => onChange("plan", e.target.value)}
                    />
                </div>
            </div>

            {/* Netflix / Prime Fields */}
            {isNetflix && (
                <div className="grid grid-cols-2 gap-3 mb-3 bg-indigo-50 dark:bg-slate-900/50 p-3 rounded-lg border border-indigo-100 dark:border-slate-700">
                    <Input
                        label="Profile Name"
                        placeholder="e.g. User 1"
                        value={data.profileName || ""}
                        onChange={(e) => onChange("profileName", e.target.value)}
                    />
                    <Input
                        label="Profile Pin"
                        placeholder="e.g. 1234"
                        value={data.profilePin || ""}
                        onChange={(e) => onChange("profilePin", e.target.value)}
                    />
                </div>
            )}

            {/* Custom Duration Dates */}
            {isCustomDuration && (
                <div className="grid grid-cols-2 gap-3 mb-3 animate-in fade-in duration-300">
                    {/* Purchase Date */}
                    <div>
                        <Input
                            label="Purchase Date"
                            type="date"
                            value={data.pDate}
                            onChange={(e) => onChange("pDate", e.target.value)}
                        />
                        {data.pDate && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {formatDate(data.pDate)}
                            </div>
                        )}
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <Input
                            label="Expiry Date"
                            type="date"
                            value={data.eDate}
                            onChange={(e) => onChange("eDate", e.target.value)}
                        />
                        {data.eDate && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {formatDate(data.eDate)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Login Fields */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                    label="Login Email"
                    placeholder="email@example.com"
                    value={data.email || ""}
                    onChange={(e) => onChange("email", e.target.value)}
                />
                <Input
                    label="Login Password"
                    placeholder="password"
                    value={data.pass || ""}
                    onChange={(e) => onChange("pass", e.target.value)}
                />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Selling Price"
                    placeholder="0"
                    type="number"
                    value={data.sell === 0 ? "" : data.sell}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange("sell", isNaN(val) ? 0 : val);
                    }}
                    className="border-emerald-200"
                />
                <Input
                    label="Cost Price"
                    placeholder="0"
                    type="number"
                    value={data.cost === 0 ? "" : data.cost}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange("cost", isNaN(val) ? 0 : val);
                    }}
                    className="border-rose-200"
                />
            </div>
        </Card>
    );
}
