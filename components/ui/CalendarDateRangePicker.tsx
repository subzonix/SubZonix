"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CalendarDateRangePickerProps {
    from: string;
    to: string;
    onFromChange: (val: string) => void;
    onToChange: (val: string) => void;
    onApply?: (from: string, to: string) => void; // Updated signature
    className?: string;
}

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

        const update = () => setIsMobile(media.matches);
        update();

        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, [breakpoint]);

    return isMobile;
}


export function CalendarDateRangePicker({
    from,
    to,
    onFromChange,
    onToChange,
    onApply,
    className
}: CalendarDateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isMobile = useIsMobile();
    const [range, setRange] = useState<DateRange | undefined>({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
    });

    useEffect(() => {
        if (isOpen) {
            setRange({
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
            });
        }
    }, [isOpen, from, to]);

    const handleApply = () => {
        if (range?.from) {
            const f = format(range.from, "yyyy-MM-dd");
            const t = range.to ? format(range.to, "yyyy-MM-dd") : f;

            onFromChange(f);
            onToChange(t);

            if (onApply) onApply(f, t);
        }
        setIsOpen(false);
    };

    const handleReset = () => {
        setRange(undefined);
        onFromChange("");
        onToChange("");
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className || ""}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-indigo-500 hover:text-indigo-500 transition-all group"
            >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-[var(--foreground)]">
                    {from && to ? `${format(new Date(from), "dd MMM, yy")} - ${format(new Date(to), "dd MMM, yy")}` : "Select Date Range"}
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-3 lg:min-w-[520px]">
                        <div className="space-y-3">
                            <DayPicker
                                mode="range"
                                defaultMonth={range?.from || new Date()}
                                selected={range}
                                onSelect={setRange}
                                numberOfMonths={isMobile ? 1 : 2}
                                className="rdp-custom"
                                modifiersClassNames={{
                                    selected: "rdp-selected",
                                    today: "rdp-today",
                                    range_middle: "rdp-range-middle",
                                }}
                            />

                            <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                                <button
                                    onClick={handleReset}
                                    className="btn-delete-cdrp flex-1"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="btn-save-cdrp  flex-1 "
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                .rdp-custom {
                    --rdp-cell-size: ${isMobile ? "8px" : "10px"};
                    --rdp-accent-color: rgb(79, 70, 229);
                    margin: 0;
                    font-size: 11px;
                }
                .rdp-custom .rdp-months {
                    display: flex;
                    gap: 1.5rem;
                }
                .rdp-custom .rdp-caption_label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--foreground);
                }
                .rdp-custom .rdp-head_cell {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--muted-foreground);
                }
                .rdp-custom .rdp-day {
                    font-size: 0.7rem;
                    border-radius: 2px;
                }
                .rdp-custom .rdp-day:hover:not(.rdp-day_selected) {
                    background-color: var(--accent);
                }
                .rdp-custom .rdp-selected {
                    background-color: var(--rdp-accent-color);
                    color: white;
                    font-weight: 700;
                }
                .rdp-custom .rdp-range-middle {
                    background-color: rgba(99, 102, 241, 0.1) !important;
                    color: var(--rdp-accent-color) !important;
                }
                .dark .rdp-custom .rdp-day:hover:not(.rdp-day_selected) {
                    background-color: rgba(255,255,255,0.1);
                }
                @media (min-width: 800px) {
                    .rdp-custom .rdp-months {
                        flex-direction: row;
                        flex-wrap: nowrap;
                        gap: 1rem;
                    }
                }

                @media (max-width: 670px) {
                     .rdp-custom .rdp-months {/* Stack only on VERY small screens if needed, user requested row but on mobile 2 months row might overflow? */
                        gap: 1rem;
                    }
                    /* Actually user said "make sure in dashboard that apply after click apply filter 2 tims" and "both calender in a row like style not in a column" */
                    /* I'll try to keep row even on small screens by reducing size? Or maybe allow wrap but prefer row. */
                    .rdp-custom {
                        --rdp-cell-size: 20px; /* Smaller on mobile */
                    }
                }
            `}</style>
        </div>
    );
}
