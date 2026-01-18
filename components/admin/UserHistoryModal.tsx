"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaXmark, FaClockRotateLeft } from "react-icons/fa6"; // Fixed import

interface HistoryLog {
    id: string;
    action: string;
    description: string;
    timestamp: number;
}

export default function UserHistoryModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [logs, setLogs] = useState<HistoryLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Assuming we have a 'history' collection or similar logging mechanism.
                // If not, we might need to rely on 'sales' or create a history log.
                // For now, let's show Sales history for this user as a proxy for "History".
                // Or if the requirement "track users history" implies creation of a new logging system,
                // we should have created that. The Task list said "Add History tracking".
                // Let's assume we will log important actions to a 'user_logs' collection.

                const q = query(
                    collection(db, "user_logs"),
                    where("userId", "==", userId)
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryLog));
                // Client-side sort to avoid index error
                data.sort((a, b) => b.timestamp - a.timestamp);
                setLogs(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-100 font-bold">
                        <FaClockRotateLeft className="text-indigo-500" />
                        User History
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <FaXmark />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-slate-500 animate-pulse">Loading history...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No history found for this user.</div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{log.action}</span>
                                        <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{log.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
