"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaBell, FaFileInvoiceDollar, FaClock, FaEye, FaPenToSquare, FaTrash, FaCheck, FaXmark, FaPlus, FaTable, FaAddressCard, FaArrowRotateRight, FaWhatsapp, FaCircleInfo } from "react-icons/fa6";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { INSTRUCTION_TEXTS } from "@/lib/utils";
import clsx from "clsx";

const TEMPLATE_DEFAULTS: any = {
    "Renewal Reminder": "Dear [Client],\n\nTo continue uninterrupted access to [Tool Name], kindly confirm your renewals. Your current plan expires on [Date].\n\nThank you!",
    "Payment Pending": "*Payment Reminder*\n\nDear *[Client]*,\n\nThe following memberships you activated on [ActivationDate]. Dues are *pending*.\n\n* Tool Name : [Tool Name]\n* Email : [Email]\n* *Pending Amount: [PendingAmount]*\n\nExpiry Date : [ExpiryDate]\n\nTo continue uninterrupted access, kindly clear all the dues.\n\n*Account Information:*\n* Bank Name: [Bank Name]\n* Holder Name: [Holder Name]\n* IBAN or Account No.: [Account No]\n\n> *Sent by [Company Name]*\n_© Powered by TapnTools_",
    "Renewal Successful": "Dear [Client],\n\nYour [Tool Name] has been renewed successfully! Thank you for choosing us.\n\nEnjoy your service!",
    "Order Receipt": "*Order Receipt*\n\nDear *[Client]*,\n\nThe following memberships are [ActionType] on [Date].\n`Thank u for choosing and trusting [TrustText] [Company Name]`\n\n[ToolsList]\n\n*Payment Summary*\nTotal : [Total]\nStatus : [Status]\n\n[AccountInfo]\n\n> Thank you for trusting *[Company Name]*.\n_© Powered by TapnTools_"
};

const EditableTemplate = ({ title, icon: Icon, color, value, variables, onSave, onReset, renameInstruction, deleteInstruction, confirm, showToast }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const handleSave = () => {
        if (!tempValue.trim()) {
            showToast("Content cannot be empty", "error");
            return;
        }
        onSave(tempValue);
        setIsEditing(false);
    };

    const handleReset = () => {
        if (onReset) {
            setTempValue(onReset());
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={color} />
                    {isEditing && title.includes("Instruction") ? (
                        <input
                            type="text"
                            defaultValue={title}
                            onBlur={(e) => renameInstruction(title, e.target.value)}
                            className="bg-transparent border-b border-indigo-200 dark:border-indigo-700 outline-none text-[11px] font-black uppercase tracking-widest text-[var(--foreground)] w-40"
                        />
                    ) : (
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                            {title}
                        </h3>
                    )}
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            {onReset && (
                                <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-amber-500 transition" title="Restore Default">
                                    <FaArrowRotateRight className="text-[10px]" />
                                </button>
                            )}
                            <button onClick={handleSave} className="icon-edit" title="Save Changes">
                                <FaCheck className="text-[10px]" />
                            </button>
                            <button onClick={() => { setIsEditing(false); setTempValue(value); }} className="icon-delete" title="Cancel">
                                <FaXmark className="text-[10px]" />
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(true)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition shadow-sm border border-indigo-100 dark:border-indigo-800/30">
                                <FaPenToSquare className="text-[10px]" />
                            </button>
                            {title.includes("Instruction") && (
                                <button
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: "Delete Slot",
                                            message: `Are you sure you want to delete instruction slot "${title}"?`,
                                            confirmText: "Delete",
                                            variant: "danger"
                                        });
                                        if (ok) {
                                            deleteInstruction(title);
                                        }
                                    }}
                                    className="icon-delete"
                                >
                                    <FaTrash className="text-[14px]" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                        ref={(el) => {
                            if (el) {
                                const handleKeyDown = (e: KeyboardEvent) => {
                                    // Ctrl+B for Bold
                                    if (e.ctrlKey && e.key === 'b') {
                                        e.preventDefault();
                                        const start = el.selectionStart;
                                        const end = el.selectionEnd;
                                        const selectedText = tempValue.substring(start, end);
                                        const newText = tempValue.substring(0, start) + `*${selectedText}*` + tempValue.substring(end);
                                        setTempValue(newText);
                                        setTimeout(() => {
                                            el.selectionStart = start + 1;
                                            el.selectionEnd = end + 1;
                                            el.focus();
                                        }, 0);
                                    }
                                    // Ctrl+I for Italic
                                    else if (e.ctrlKey && e.key === 'i') {
                                        e.preventDefault();
                                        const start = el.selectionStart;
                                        const end = el.selectionEnd;
                                        const selectedText = tempValue.substring(start, end);
                                        const newText = tempValue.substring(0, start) + `_${selectedText}_` + tempValue.substring(end);
                                        setTempValue(newText);
                                        setTimeout(() => {
                                            el.selectionStart = start + 1;
                                            el.selectionEnd = end + 1;
                                            el.focus();
                                        }, 0);
                                    }
                                    // Ctrl+Shift+S for Strikethrough
                                    else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                                        e.preventDefault();
                                        const start = el.selectionStart;
                                        const end = el.selectionEnd;
                                        const selectedText = tempValue.substring(start, end);
                                        const newText = tempValue.substring(0, start) + `~${selectedText}~` + tempValue.substring(end);
                                        setTempValue(newText);
                                        setTimeout(() => {
                                            el.selectionStart = start + 1;
                                            el.selectionEnd = end + 1;
                                            el.focus();
                                        }, 0);
                                    }
                                };
                                el.addEventListener('keydown', handleKeyDown);
                                return () => el.removeEventListener('keydown', handleKeyDown);
                            }
                        }}
                        className="w-full h-40 p-4 text-[11px] bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none font-medium leading-relaxed"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="Type your message here..."
                    />
                    <div className="flex flex-wrap gap-1.5 p-3  rounded-xl border border-[var(--border)]">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1 self-center">Format:</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = tempValue.substring(start, end);
                                    const newText = tempValue.substring(0, start) + `*${selectedText}*` + tempValue.substring(end);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = start + 1;
                                        textarea.selectionEnd = end + 1;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                            title="Ctrl+B"
                        >
                            *Bold*
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = tempValue.substring(start, end);
                                    const newText = tempValue.substring(0, start) + `_${selectedText}_` + tempValue.substring(end);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = start + 1;
                                        textarea.selectionEnd = end + 1;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer italic"
                            title="Ctrl+I"
                        >
                            _Italic_
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = tempValue.substring(start, end);
                                    const newText = tempValue.substring(0, start) + `~${selectedText}~` + tempValue.substring(end);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = start + 1;
                                        textarea.selectionEnd = end + 1;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer line-through"
                            title="Ctrl+Shift+S"
                        >
                            ~Strike~
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const selectedText = tempValue.substring(start, end);
                                    const newText = tempValue.substring(0, start) + `\`\`\`${selectedText}\`\`\`` + tempValue.substring(end);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = start + 3;
                                        textarea.selectionEnd = end + 3;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-mono border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            ```Code```
                        </button>
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center"></div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const textBeforeCursor = tempValue.substring(0, start);
                                    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
                                    const isAtLineStart = lastNewlineIndex === start - 1 || start === 0;
                                    const bullet = isAtLineStart ? '• ' : '\n• ';
                                    const newText = tempValue.substring(0, start) + bullet + tempValue.substring(start);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = textarea.selectionEnd = start + bullet.length;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            • Bullet
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                if (textarea) {
                                    const start = textarea.selectionStart;
                                    const textBeforeCursor = tempValue.substring(0, start);
                                    const lines = textBeforeCursor.split('\n');
                                    const lastLine = lines[lines.length - 1];
                                    const numberMatch = lastLine.match(/^(\d+)\./);
                                    const nextNumber = numberMatch ? parseInt(numberMatch[1]) + 1 : 1;
                                    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
                                    const isAtLineStart = lastNewlineIndex === start - 1 || start === 0;
                                    const numbered = isAtLineStart ? `${nextNumber}. ` : `\n${nextNumber}. `;
                                    const newText = tempValue.substring(0, start) + numbered + tempValue.substring(start);
                                    setTempValue(newText);
                                    setTimeout(() => {
                                        textarea.focus();
                                        textarea.selectionStart = textarea.selectionEnd = start + numbered.length;
                                    }, 0);
                                }
                            }}
                            className="text-[12px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            1. List
                        </button>
                        {variables?.map((v: string) => (
                            <button
                                key={v}
                                onClick={() => setTempValue(tempValue + v)}
                                className="text-[12px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className="p-5 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-[var(--border)] cursor-pointer group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all min-h-[100px]"
                >
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">
                        {value || "No template defined. Click to set one up."}
                    </p>
                </div>
            )}
        </Card>
    );
};

export default function RemindersPage() {
    const [settings, setSettings] = useState<any>({
        reminderTemplate: TEMPLATE_DEFAULTS["Renewal Reminder"],
        pendingTemplate: TEMPLATE_DEFAULTS["Payment Pending"],
        renewalTemplate: TEMPLATE_DEFAULTS["Renewal Successful"],
        receiptTemplate: TEMPLATE_DEFAULTS["Order Receipt"],
        instructions: {
            "Shared": "• Don't change password\n• Don't add phone number\n• Use only one device",
            "Mail Access": "• Log in to Gmail first\n• Check recovery mail for code\n• Don't change security settings",
            "Private": "• Full access to personal account\n• You can change password\n• No restrictions on usage",
            "Instruction 4": "• Custom text here\n• Double click heading to edit",
            "Instruction 5": "• Custom text here\n• Multi-slot support"
        }
    });
    const [newHeading, setNewHeading] = useState("");
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedSettings, setLastSavedSettings] = useState("");
    const [editingItem, setEditingItem] = useState<{ title: string, value: string, variables?: string[], isInstruction?: boolean } | null>(null);
    const { user } = useAuth();
    const { showToast, confirm } = useToast();

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const snap = await getDoc(doc(db, "users", user.uid, "settings", "general"));
                if (snap.exists()) {
                    const data = snap.data();
                    const loadedSettings = {
                        ...settings,
                        reminderTemplate: data.reminderTemplate || settings.reminderTemplate,
                        pendingTemplate: data.pendingTemplate || settings.pendingTemplate,
                        renewalTemplate: data.renewalTemplate || settings.renewalTemplate,
                        receiptTemplate: data.receiptTemplate || settings.receiptTemplate,
                        instructions: {
                            ...settings.instructions,
                            ...(data.instructions || {})
                        }
                    };
                    setSettings(loadedSettings);
                    setLastSavedSettings(JSON.stringify(loadedSettings));
                    setIsDirty(false);
                } else {
                    setLastSavedSettings(JSON.stringify(settings));
                }
            } catch (error: any) {
                console.error("Error loading reminders settings:", error);
                showToast("Failed to load settings: " + error.message, "error");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.uid, showToast]);

    useEffect(() => {
        if (!lastSavedSettings) return;
        const current = JSON.stringify(settings);
        setIsDirty(current !== lastSavedSettings);
    }, [settings, lastSavedSettings]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Use { merge: true } to preserve other settings (branding, logos etc)
            await setDoc(doc(db, "users", user.uid, "settings", "general"), settings, { merge: true });
            setLastSavedSettings(JSON.stringify(settings));
            setIsDirty(false);
            showToast("All templates saved successfully!", "success");
        } catch (e: any) {
            showToast("Error saving templates: " + e.message, "error");
        }
        setLoading(false);
    };

    const addInstruction = () => {
        if (!newHeading.trim()) {
            showToast("Please enter a heading", "error");
            return;
        }
        if (settings.instructions[newHeading]) {
            showToast("Heading already exists", "error");
            return;
        }
        setSettings((prev: any) => ({
            ...prev,
            instructions: {
                ...prev.instructions,
                [newHeading]: ""
            }
        }));
        setNewHeading("");
    };

    const deleteInstruction = useCallback(async (key: string) => {
        const ok = await confirm({
            title: "Delete Slot",
            message: `Are you sure you want to delete instruction slot "${key}"?`,
            confirmText: "Delete",
            variant: "danger"
        });
        if (!ok) return;

        setSettings((prev: any) => {
            const newIns = { ...prev.instructions };
            delete newIns[key];
            return { ...prev, instructions: newIns };
        });
        showToast("Slot deleted", "success");
    }, [confirm, showToast]);

    const renameInstruction = useCallback((oldKey: string, newKey: string) => {
        if (!newKey.trim() || oldKey === newKey) return;
        setSettings((prev: any) => {
            if (prev.instructions[newKey]) {
                showToast("Heading already exists", "error");
                return prev;
            }
            const newIns = { ...prev.instructions };
            newIns[newKey] = newIns[oldKey];
            delete newIns[oldKey];
            return { ...prev, instructions: newIns };
        });
    }, [showToast]);

    const updateInstruction = useCallback((key: string, value: string) => {
        setSettings((prev: any) => ({
            ...prev,
            instructions: {
                ...prev.instructions,
                [key]: value
            }
        }));
    }, []);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm  z-40 backdrop-blur-md">
                <h1 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                    <FaBell className="text-indigo-500" /> Templates & Instructions
                </h1>
                <div className="flex items-center gap-2">
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
                            <FaTable /> Table View
                        </button>

                    </div>
                    {isDirty && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <FaCircleInfo className="text-[10px]" /> Unsaved Changes
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={clsx(
                            "btn-save",
                            !isDirty && "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {loading ? "Saving..." : "Save All"}
                    </button>
                </div>
            </div>

            {viewMode === "card" ? (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: Message Reminders */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Message Reminders</h4>

                        <EditableTemplate
                            title="Renewal Reminder"
                            icon={FaBell}
                            color="text-amber-500"
                            value={settings.reminderTemplate}
                            variables={["[Client]", "[Tool Name]", "[Date]"]}
                            onSave={(val: string) => setSettings((prev: any) => ({ ...prev, reminderTemplate: val }))}
                            onReset={() => TEMPLATE_DEFAULTS["Renewal Reminder"]}
                            renameInstruction={renameInstruction}
                            deleteInstruction={deleteInstruction}
                            confirm={confirm}
                            showToast={showToast}
                        />
                        <EditableTemplate
                            title="Payment Pending"
                            icon={FaFileInvoiceDollar}
                            color="text-rose-500"
                            value={settings.pendingTemplate}
                            variables={["[Client]", "[ActivationDate]", "[Tool Name]", "[Email]", "[PendingAmount]", "[ExpiryDate]", "[Bank Name]", "[Holder Name]", "[Account No]", "[Company Name]"]}
                            onSave={(val: string) => setSettings((prev: any) => ({ ...prev, pendingTemplate: val }))}
                            onReset={() => TEMPLATE_DEFAULTS["Payment Pending"]}
                            renameInstruction={renameInstruction}
                            deleteInstruction={deleteInstruction}
                            confirm={confirm}
                            showToast={showToast}
                        />
                        <EditableTemplate
                            title="Order Receipt"
                            icon={FaCheck}
                            color="text-emerald-500"
                            value={settings.receiptTemplate}
                            variables={["[Client]", "[ActionType]", "[Date]", "[TrustText]", "[Company Name]", "[ToolsList]", "[Total]", "[Status]", "[AccountInfo]"]}
                            onSave={(val: string) => setSettings((prev: any) => ({ ...prev, receiptTemplate: val }))}
                            onReset={() => TEMPLATE_DEFAULTS["Order Receipt"]}
                            renameInstruction={renameInstruction}
                            deleteInstruction={deleteInstruction}
                            confirm={confirm}
                            showToast={showToast}
                        />
                        <EditableTemplate
                            title="Renewal Successful"
                            icon={FaCheck}
                            color="text-emerald-500"
                            value={settings.renewalTemplate}
                            variables={["[Client]", "[Tool Name]"]}
                            onSave={(val: string) => setSettings((prev: any) => ({ ...prev, renewalTemplate: val }))}
                            onReset={() => TEMPLATE_DEFAULTS["Renewal Successful"]}
                            renameInstruction={renameInstruction}
                            deleteInstruction={deleteInstruction}
                            confirm={confirm}
                            showToast={showToast}
                        />
                    </div>

                    {/* Right: Category Instructions */}
                    <div className="space-y-6">
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                                        <FaPlus className="text-xl" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Instructions</h4>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">{Object.keys(settings.instructions || {}).length} / 8 Slots</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(settings.instructions || {}).map(([key, val]) => (
                                    <EditableTemplate
                                        key={key}
                                        title={key}
                                        icon={FaClock}
                                        color="text-indigo-500"
                                        value={val}
                                        onSave={(v: string) => updateInstruction(key, v)}
                                        onReset={() => updateInstruction(key, INSTRUCTION_TEXTS[key] || "")}
                                        renameInstruction={renameInstruction}
                                        deleteInstruction={deleteInstruction}
                                        confirm={confirm}
                                        showToast={showToast}
                                    />
                                ))}
                            </div>
                        </Card>

                        {/* Add New Slot Button */}
                        {Object.keys(settings.instructions || {}).length < 8 && (
                            <button
                                onClick={() => {
                                    const nextNum = Object.keys(settings.instructions).length + 1;
                                    // Find a unique name
                                    let newName = `Instruction ${nextNum}`;
                                    if (settings.instructions[newName]) newName = `Instruction ${nextNum}_${Date.now()}`;

                                    updateInstruction(newName, "• Edit this text...");
                                }}
                                className="flex items-center justify-center p-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all group w-full"
                            >
                                <FaPlus className="text-sm mr-2 opacity-50 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Add Slot</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Table View */
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 p-4">
                        {/* Message Reminders Mobile */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Message Reminders</h4>
                            {[
                                { title: "Renewal Reminder", value: settings.reminderTemplate, variables: ["[Client]", "[Tool Name]", "[Date]"] },
                                { title: "Payment Pending", value: settings.pendingTemplate, variables: ["[Client]", "[ActivationDate]", "[Tool Name]", "[Email]", "[PendingAmount]", "[ExpiryDate]", "[Bank Name]", "[Holder Name]", "[Account No]", "[Company Name]"] },
                                { title: "Order Receipt", value: settings.receiptTemplate, variables: ["[Client]", "[ActionType]", "[Date]", "[TrustText]", "[Company Name]", "[ToolsList]", "[Total]", "[Status]", "[AccountInfo]"] },
                                { title: "Renewal Successful", value: settings.renewalTemplate, variables: ["[Client]", "[Tool Name]"] }
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    onClick={() => setEditingItem(item)}
                                    className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-xs text-[var(--foreground)]">{item.title}</span>
                                        <FaPenToSquare className="text-indigo-500 text-xs" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Instructions Mobile */}
                        <div className="space-y-2 mt-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Instructions</h4>
                            {Object.entries(settings.instructions || {}).map(([key, val]: any) => (
                                <div
                                    key={key}
                                    onClick={() => setEditingItem({ title: key, value: val, isInstruction: true })}
                                    className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-xs text-[var(--foreground)]">{key}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingItem({ title: key, value: val, isInstruction: true }); }}
                                                className="icon-edit"
                                            >
                                                <FaPenToSquare className="text-[14px]" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const ok = await confirm({
                                                        title: "Delete Slot",
                                                        message: `Are you sure you want to delete "${key}"?`,
                                                        confirmText: "Delete",
                                                        variant: "danger"
                                                    });
                                                    if (ok) deleteInstruction(key);
                                                }}
                                                className="icon-delete"
                                            >
                                                <FaTrash className="text-[14px]" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-2">{val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-b border-[var(--border)]">
                                <tr>
                                    <th className="px-6 py-4">Template Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 w-1/2">Content Preview</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {/* Message Reminders */}
                                <tr
                                    onClick={() => setEditingItem({
                                        title: "Renewal Reminder",
                                        value: settings.reminderTemplate,
                                        variables: ["[Client]", "[Tool Name]", "[Date]"]
                                    })}
                                    className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-black text-[var(--foreground)]">Renewal Reminder</td>
                                    <td className="px-6 py-4 text-xs font-bold text-emerald-500">Message</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{settings.reminderTemplate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="icon-edit">
                                            <FaPenToSquare className="text-[14px]" />
                                        </button>
                                    </td>
                                </tr>
                                <tr
                                    onClick={() => setEditingItem({
                                        title: "Payment Pending Alert",
                                        value: settings.pendingTemplate,
                                        variables: ["[Client]", "[ActivationDate]", "[Tool Name]", "[Email]", "[PendingAmount]", "[ExpiryDate]", "[Bank Name]", "[Holder Name]", "[Account No]", "[Company Name]"]
                                    })}
                                    className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-black text-[var(--foreground)]">Payment Pending Alert</td>
                                    <td className="px-6 py-4 text-xs font-bold text-rose-500">Message</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{settings.pendingTemplate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="icon-edit">
                                            <FaPenToSquare className="text-[14px]" />
                                        </button>
                                    </td>
                                </tr>
                                <tr
                                    onClick={() => setEditingItem({
                                        title: "Order Receipt",
                                        value: settings.receiptTemplate,
                                        variables: ["[Client]", "[ActionType]", "[Date]", "[TrustText]", "[Company Name]", "[ToolsList]", "[Total]", "[Status]", "[AccountInfo]"]
                                    })}
                                    className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-black text-[var(--foreground)]">Order Receipt</td>
                                    <td className="px-6 py-4 text-xs font-bold text-emerald-500">Message</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{settings.receiptTemplate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="icon-edit">
                                            <FaPenToSquare className="text-[14px]" />
                                        </button>
                                    </td>
                                </tr>
                                <tr
                                    onClick={() => setEditingItem({
                                        title: "Renewal Successful",
                                        value: settings.renewalTemplate,
                                        variables: ["[Client]", "[Tool Name]"]
                                    })}
                                    className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-black text-[var(--foreground)]">Renewal Successful</td>
                                    <td className="px-6 py-4 text-xs font-bold text-indigo-500">Message</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{settings.renewalTemplate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="icon-edit">
                                            <FaPenToSquare className="text-[14px]" />
                                        </button>
                                    </td>
                                </tr>

                                {/* Instructions */}
                                {Object.entries(settings.instructions || {}).map(([key, val]: any) => (
                                    <tr
                                        key={key}
                                        onClick={() => setEditingItem({
                                            title: key,
                                            value: val,
                                            isInstruction: true
                                        })}
                                        className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-black text-[var(--foreground)]">{key}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">Instruction</td>
                                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{val}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setEditingItem({ title: key, value: val, isInstruction: true })}
                                                className="icon-edit"
                                                title="Edit"
                                            >
                                                <FaPenToSquare className="text-[14px]" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const ok = await confirm({
                                                        title: "Delete Slot",
                                                        message: `Are you sure you want to delete "${key}"?`,
                                                        confirmText: "Delete",
                                                        variant: "danger"
                                                    });
                                                    if (ok) deleteInstruction(key);
                                                }}
                                                className="icon-delete"
                                                title="Delete"
                                            >
                                                <FaTrash className="text-[14px]" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {/* Edit Modal */}
            {
                editingItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingItem(null)} />
                        <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                    <FaPenToSquare className="text-indigo-500" /> Edit {editingItem.title}
                                </h3>
                                <button onClick={() => setEditingItem(null)} className="btn-delete">
                                    <FaXmark />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <textarea
                                    ref={(el) => {
                                        if (el) {
                                            const handleKeyDown = (e: KeyboardEvent) => {
                                                if (e.ctrlKey && e.key === 'b') {
                                                    e.preventDefault();
                                                    const start = el.selectionStart;
                                                    const end = el.selectionEnd;
                                                    const selectedText = editingItem.value.substring(start, end);
                                                    const newText = editingItem.value.substring(0, start) + `*${selectedText}*` + editingItem.value.substring(end);
                                                    setEditingItem({ ...editingItem, value: newText });
                                                    setTimeout(() => {
                                                        el.selectionStart = start + 1;
                                                        el.selectionEnd = end + 1;
                                                        el.focus();
                                                    }, 0);
                                                } else if (e.ctrlKey && e.key === 'i') {
                                                    e.preventDefault();
                                                    const start = el.selectionStart;
                                                    const end = el.selectionEnd;
                                                    const selectedText = editingItem.value.substring(start, end);
                                                    const newText = editingItem.value.substring(0, start) + `_${selectedText}_` + editingItem.value.substring(end);
                                                    setEditingItem({ ...editingItem, value: newText });
                                                    setTimeout(() => {
                                                        el.selectionStart = start + 1;
                                                        el.selectionEnd = end + 1;
                                                        el.focus();
                                                    }, 0);
                                                } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                                                    e.preventDefault();
                                                    const start = el.selectionStart;
                                                    const end = el.selectionEnd;
                                                    const selectedText = editingItem.value.substring(start, end);
                                                    const newText = editingItem.value.substring(0, start) + `~${selectedText}~` + editingItem.value.substring(end);
                                                    setEditingItem({ ...editingItem, value: newText });
                                                    setTimeout(() => {
                                                        el.selectionStart = start + 1;
                                                        el.selectionEnd = end + 1;
                                                        el.focus();
                                                    }, 0);
                                                }
                                            };
                                            el.addEventListener('keydown', handleKeyDown);
                                            return () => el.removeEventListener('keydown', handleKeyDown);
                                        }
                                    }}
                                    className="w-full h-64 p-5 text-[11px] bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none font-medium leading-relaxed"
                                    value={editingItem.value}
                                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                    placeholder="Type your template here..."
                                />
                                <div className="flex flex-wrap gap-1.5 p-3  rounded-xl border border-[var(--border)]">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1 self-center">Format:</span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const selectedText = editingItem.value.substring(start, end);
                                                const newText = editingItem.value.substring(0, start) + `*${selectedText}*` + editingItem.value.substring(end);
                                                setEditingItem({ ...editingItem, value: newText });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = start + 1;
                                                    textarea.selectionEnd = end + 1;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                        title="Ctrl+B"
                                    >
                                        *Bold*
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const selectedText = editingItem.value.substring(start, end);
                                                const newText = editingItem.value.substring(0, start) + `_${selectedText}_` + editingItem.value.substring(end);
                                                setEditingItem({ ...editingItem, value: newText });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = start + 1;
                                                    textarea.selectionEnd = end + 1;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer italic"
                                        title="Ctrl+I"
                                    >
                                        _Italic_
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const selectedText = editingItem.value.substring(start, end);
                                                const newText = editingItem.value.substring(0, start) + `~${selectedText}~` + editingItem.value.substring(end);
                                                setEditingItem({ ...editingItem, value: newText });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = start + 1;
                                                    textarea.selectionEnd = end + 1;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-black border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer line-through"
                                        title="Ctrl+Shift+S"
                                    >
                                        ~Strike~
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const selectedText = editingItem.value.substring(start, end);
                                                const newText = editingItem.value.substring(0, start) + `\`\`\`${selectedText}\`\`\`` + editingItem.value.substring(end);
                                                setEditingItem({ ...editingItem, value: newText });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = start + 3;
                                                    textarea.selectionEnd = end + 3;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-slate-700 text-white font-mono border border-slate-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                    >
                                        ```Code```
                                    </button>
                                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center"></div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const textBeforeCursor = editingItem.value.substring(0, start);
                                                const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
                                                const isAtLineStart = lastNewlineIndex === start - 1 || start === 0;
                                                const bullet = isAtLineStart ? '• ' : '\n• ';
                                                setEditingItem({ ...editingItem, value: editingItem.value.substring(0, start) + bullet + editingItem.value.substring(start) });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = textarea.selectionEnd = start + bullet.length;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                    >
                                        • Bullet
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const textBeforeCursor = editingItem.value.substring(0, start);
                                                const lines = textBeforeCursor.split('\n');
                                                const lastLine = lines[lines.length - 1];
                                                const numberMatch = lastLine.match(/^(\d+)\./);
                                                const nextNumber = numberMatch ? parseInt(numberMatch[1]) + 1 : 1;
                                                const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
                                                const isAtLineStart = lastNewlineIndex === start - 1 || start === 0;
                                                const numbered = isAtLineStart ? `${nextNumber}. ` : `\n${nextNumber}. `;
                                                setEditingItem({ ...editingItem, value: editingItem.value.substring(0, start) + numbered + editingItem.value.substring(start) });
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.selectionStart = textarea.selectionEnd = start + numbered.length;
                                                }, 0);
                                            }
                                        }}
                                        className="text-[12px] px-2 py-1 rounded-lg bg-indigo-600 text-white font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                    >
                                        1. List
                                    </button>
                                    {editingItem.variables?.map((v: string) => (
                                        <button
                                            key={v}
                                            onClick={() => setEditingItem({ ...editingItem, value: editingItem.value + v })}
                                            className="text-[12px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 border-t border-[var(--border)] bg-slate-50/30 dark:bg-slate-600/10 flex justify-between items-center gap-3">
                                <div className="flex gap-2">
                                    {!editingItem.isInstruction && TEMPLATE_DEFAULTS[editingItem.title] && (
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, value: TEMPLATE_DEFAULTS[editingItem.title] })}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition shadow-sm"
                                        >
                                            <FaArrowRotateRight className="text-[10px]" /> Set Default
                                        </button>
                                    )}
                                    {editingItem.isInstruction && INSTRUCTION_TEXTS[editingItem.title] && (
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, value: INSTRUCTION_TEXTS[editingItem.title] })}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition shadow-sm"
                                        >
                                            <FaArrowRotateRight className="text-[10px]" /> Set Default
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditingItem(null)} className="btn-pdf">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (editingItem.isInstruction) {
                                                updateInstruction(editingItem.title, editingItem.value);
                                            } else {
                                                const keyMap: any = {
                                                    "Renewal Reminder": "reminderTemplate",
                                                    "Payment Pending": "pendingTemplate",
                                                    "Order Receipt": "receiptTemplate",
                                                    "Renewal Successful": "renewalTemplate"
                                                };
                                                const settingKey = keyMap[editingItem.title];
                                                if (settingKey) {
                                                    setSettings((prev: any) => ({ ...prev, [settingKey]: editingItem.value }));
                                                }
                                            }

                                            setEditingItem(null);
                                            showToast("Template updated temporarily. Click 'Save All' to confirm permanently.", "success");
                                        }}
                                        className="btn-whatsapp"
                                    >
                                        Update Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
