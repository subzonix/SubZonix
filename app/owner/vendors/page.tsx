"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vendor } from "@/types";
import { FaUser, FaAddressBook, FaWrench } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Shared";

interface UserProfile {
    id: string;
    email: string;
    companyName?: string;
    role: "owner" | "user";
}

const TOOL_COLORS = [
    "text-blue-500",
    "text-emerald-500",
    "text-amber-500",
    "text-rose-500",
    "text-indigo-500",
    "text-violet-500",
    "text-orange-500",
    "text-cyan-500",
];

export default function OwnerVendorsPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch users for dropdown
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "users"), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            setUsers(data.filter(u => u.role !== "owner"));
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch vendors for selected user
    useEffect(() => {
        if (!selectedUserId) {
            setVendors([]);
            return;
        }

        const unsub = onSnapshot(collection(db, "users", selectedUserId, "vendors"), (snap) => {
            setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
        });
        return () => unsub();
    }, [selectedUserId]);

    return (
        <div className="space-y-8 pb-20">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <FaAddressBook className="text-indigo-500" /> Vendor Directory
            </h1>

            {/* User Selector */}
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Select User to View Vendors
                </label>
                <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-slate-500" />
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">-- Choose User --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.email} {u.companyName ? `(${u.companyName})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedUserId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {vendors.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 text-center text-slate-600 border border-dashed border-slate-800 rounded-3xl"
                            >
                                <FaAddressBook className="text-4xl mx-auto mb-4 opacity-10" />
                                <p>No vendors found for this user.</p>
                            </motion.div>
                        ) : (
                            vendors.map((vendor, idx) => (
                                <motion.div
                                    key={vendor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="h-full border border-slate-800/50 hover:border-indigo-500/30 transition-all group">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-100 group-hover:text-indigo-400 transition-colors">
                                                    {vendor.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-mono mt-1">
                                                    {vendor.phone || "No Contact"}
                                                </p>
                                            </div>

                                            {vendor.relatedTools && vendor.relatedTools.length > 0 && (
                                                <div className="pt-4 border-t border-slate-800/50">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                                        <FaWrench className="text-[8px]" /> Related Tools
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                        {vendor.relatedTools.map((tool, tIdx) => (
                                                            <span
                                                                key={tool}
                                                                className={`text-xs font-bold ${TOOL_COLORS[tIdx % TOOL_COLORS.length]}`}
                                                            >
                                                                {tool}{tIdx < vendor.relatedTools!.length - 1 ? "," : ""}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-600 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                    <FaUser className="text-4xl mx-auto mb-4 opacity-20" />
                    <p>Please select a user to view their vendor list.</p>
                </div>
            )}
        </div>
    );
}
