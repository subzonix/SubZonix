"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import clsx from "clsx";

interface CalendarDatePickerProps {
    value?: string; // yyyy-MM-dd
    onChange: (val: string) => void;
    label?: string;
    required?: boolean;
    className?: string;
}

export function CalendarDatePicker({
    value,
    onChange,
    label,
    required,
    className
}: CalendarDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        value ? new Date(value) : undefined
    );

    useEffect(() => {
        setSelectedDate(value ? new Date(value) : undefined);
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            const formatted = format(date, "yyyy-MM-dd");
            onChange(formatted);
            setSelectedDate(date);
            setIsOpen(false);
        }
    };

    return (
        <div className={clsx("relative", className)}>
            {label && (
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 bg-background border border-border px-3 py-2.5 rounded-xl text-[11px] font-medium hover:border-indigo-500 transition-all group text-left"
            >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className={clsx(!value && "text-slate-400")}>
                    {value ? format(new Date(value), "dd-MM-yyyy") : "Select Date"}
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-2xl p-3">
                        <DayPicker
                            mode="single"
                            defaultMonth={selectedDate || new Date()}
                            selected={selectedDate}
                            onSelect={handleSelect}
                            className="rdp-custom-single"
                            modifiersClassNames={{
                                selected: "rdp-selected",
                                today: "rdp-today",
                            }}
                        />
                    </div>
                </>
            )}

            <style jsx global>{`
                .rdp-custom-single {
                    --rdp-cell-size: 32px;
                    --rdp-accent-color: rgb(79, 70, 229);
                    margin: 0;
                    font-size: 11px;
                }
                .rdp-custom-single .rdp-caption_label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--foreground);
                }
                .rdp-custom-single .rdp-head_cell {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--muted-foreground);
                }
                .rdp-custom-single .rdp-day {
                    font-size: 0.7rem;
                    border-radius: 6px;
                }
                .rdp-custom-single .rdp-day:hover:not(.rdp-day_selected) {
                    background-color: var(--accent);
                }
                .rdp-custom-single .rdp-selected {
                    background-color: var(--rdp-accent-color);
                    color: white;
                    font-weight: 700;
                }
                .dark .rdp-custom-single .rdp-day:hover:not(.rdp-day_selected) {
                    background-color: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
}
