"use client"; // needed if using app directory in Next.js

import { ToolItem, InventoryItem } from "@/types";
import { FaTrash, FaPlus } from "react-icons/fa6";
import { Card, Input, Select } from "@/components/ui/Shared";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";
import Autocomplete from "@/components/ui/Autocomplete";
import { useState, useEffect } from "react";
import { format, addMonths, addDays, addYears, parseISO } from "date-fns";
import { getLocalIsoDate } from "@/lib/utils";

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
    isStaff?: boolean;
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
    isStaff = false,
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
                plan: item.plan || "",
                cost: item.cost ?? 0,
                sell: item.sell ?? 0,
            });
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "custom") {
            setIsCustomDuration(true);
            onChange("duration", "custom");
            return;
        }

        setIsCustomDuration(false);
        const days = parseInt(value);
        if (isNaN(days)) return;

        const pDateStr = data.pDate || getLocalIsoDate();
        const pDate = parseISO(pDateStr);
        let eDate: Date;

        if (days === 365) {
            eDate = addYears(pDate, 1);
        } else if (days === 30) {
            eDate = addMonths(pDate, 1);
        } else if (days === 60) {
            eDate = addMonths(pDate, 2);
        } else {
            eDate = addDays(pDate, days);
        }

        onChange(null, {
            eDate: format(eDate, "yyyy-MM-dd"),
            duration: value
        });
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
                <Select
                    label="Tool Selection"
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
                </Select>

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

                <Select
                    label="Duration Plan"
                    onChange={handleDurationChange}
                    value={data.duration || "30"}
                >
                    <option value="30">1 Month (Calendar)</option>
                    <option value="60">2 Months (Calendar)</option>
                    <option value="365">1 Year (Calendar)</option>
                    <option value="custom">Custom Duration</option>
                </Select>

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
                    <CalendarDatePicker
                        label="Purchase Date"
                        value={data.pDate}
                        onChange={(val) => onChange("pDate", val)}
                        className="bg-white dark:bg-slate-900"
                    />

                    <CalendarDatePicker
                        label="Expiry Date"
                        value={data.eDate}
                        onChange={(val) => onChange("eDate", val)}
                        className="bg-white dark:bg-slate-900"
                    />
                </div>
            )}

            {/* Login Fields */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-3">
                <Input
                    label="Login Email"
                    placeholder="email@example.com"
                    value={data.email || ""}
                    onChange={(e) => onChange("email", e.target.value)}
                    className="col-span-1 md:col-span-1"
                />
                <Input
                    label="Login Password"
                    placeholder="password"
                    value={data.pass || ""}
                    onChange={(e) => onChange("pass", e.target.value)}
                    className="col-span-1 md:col-span-1"
                />

                <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input
                        label="Login Link / URL"
                        placeholder="https://..."
                        value={data.loginLink || ""}
                        onChange={(e) => onChange("loginLink", e.target.value)}
                        className="col-span-2 md:col-span-1"
                    />
                    <Input
                        label="Mail Access (Optional)"
                        placeholder="mail link or info"
                        value={data.mailAccess || ""}
                        onChange={(e) => onChange("mailAccess", e.target.value)}
                        className="col-span-1 md:col-span-1"
                    />
                    <Input
                        label="Mail Password (Optional)"
                        placeholder="mail pass"
                        value={data.mailAccessPassword || ""}
                        onChange={(e) => onChange("mailAccessPassword", e.target.value)}
                        className="col-span-1 md:col-span-1"
                    />
                </div>
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
                {!isStaff && (
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
                )}
            </div>
        </Card >
    );
}
