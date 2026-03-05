import { useState } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import clsx from "clsx";

import { EMOJI_CATEGORIES } from "@/lib/emojis";

export default function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Smileys");

    const filteredEmojis = search
        ? Object.values(EMOJI_CATEGORIES).flat().filter((e: any) => e.includes(search)) // Simple check, might need better emoji search
        : EMOJI_CATEGORIES[activeTab];

    return (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[110] animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-3 border-b border-border bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="relative flex-1">
                    <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                    <input
                        type="text"
                        placeholder="Search emojis..."
                        className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <button onClick={onClose} className="ml-2 text-slate-400 hover:text-rose-500 transition">
                    <FaXmark className="text-xs" />
                </button>
            </div>

            {!search && (
                <div className="flex border-b border-border overflow-x-auto no-scrollbar">
                    {Object.keys(EMOJI_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={clsx(
                                "px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors",
                                activeTab === cat ? "text-indigo-500 border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="p-2 h-48 overflow-y-auto grid grid-cols-6 gap-1 custom-scrollbar">
                {filteredEmojis.map((emoji: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => { onSelect(emoji); if (!search) onClose(); }}
                        className="text-xl p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all transform hover:scale-125"
                    >
                        {emoji}
                    </button>
                ))}
                {filteredEmojis.length === 0 && (
                    <div className="col-span-6 py-10 text-center text-xs text-slate-400 font-medium">
                        No emojis found
                    </div>
                )}
            </div>
        </div>
    );
}
