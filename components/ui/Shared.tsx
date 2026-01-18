import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={clsx("bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm transition-colors", className)}>
            {children}
        </div>
    );
}

export function Button({
    children, onClick, variant = "primary", className, type = "button", disabled
}: {
    children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "success" | "outline"; className?: string; type?: "button" | "submit"; disabled?: boolean
}) {
    const baseStyle = "px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white shadow-lg hover:brightness-110",
        secondary: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:brightness-105",
        danger: "bg-rose-500 text-white shadow-lg hover:bg-rose-600",
        success: "bg-emerald-600 text-white shadow-lg hover:bg-emerald-500",
        outline: "border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
    };

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={clsx(baseStyle, variants[variant], className)}>
            {children}
        </button>
    );
}

export function Input({
    label, type = "text", value, onChange, placeholder, required, className, min, disabled, readOnly, icon: Icon
}: {
    label?: string; type?: string; value?: string | number; onChange?: (e: any) => void; placeholder?: string; required?: boolean; className?: string; min?: string; disabled?: boolean; readOnly?: boolean; icon?: any;
}) {
    return (
        <div className={className}>
            {label && <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">{label}</label>}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                )}
                <input
                    type={type}
                    value={value === null || value === undefined || Number.isNaN(value) ? "" : value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={clsx(
                        "w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium",
                        Icon && "pl-10",
                        disabled && "opacity-50 cursor-not-allowed",
                        readOnly && "cursor-default"
                    )}
                />
            </div>
        </div>
    );
}


export function Select({
    label, value, onChange, children, className, icon: Icon
}: {
    label?: string; value?: string; onChange?: (e: any) => void; children: ReactNode; className?: string; icon?: any;
}) {
    return (
        <div className={className}>
            {label && <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">{label}</label>}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                )}
                <select
                    value={value}
                    onChange={onChange}
                    className={clsx(
                        "w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium appearance-none",
                        Icon && "pl-10"
                    )}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </div>
    );
}

