import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={clsx("bg-card border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-5 shadow-sm shadow-black/5 dark:shadow-black/40 transition-colors", className)}>
            {children}
        </div>
    );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "success" | "outline";
}

export function Button({
    children, onClick, variant = "primary", className, type = "button", disabled, ...props
}: ButtonProps) {
    const baseStyle = "min-h-9 px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 hover:shadow-primary/30",
        secondary: "bg-muted/60 hover:bg-muted text-foreground border border-border shadow-sm hover:shadow-md",
        danger: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:brightness-110 hover:shadow-destructive/30",
        success: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-600/30",
        outline: "bg-transparent border border-border text-foreground hover:bg-muted/60 hover:shadow-sm",
    };

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={clsx(baseStyle, variants[variant], className)} {...props}>
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
                        "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium",
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
                        "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[11px] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all font-medium appearance-none",
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

