import { useState, useRef, useEffect } from "react";
import { Input } from "./Shared";

interface AutocompleteProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (val: string) => void;
    onSelect: (item: any) => void;
    suggestions: any[];
    searchKey: string;
    secondaryKey?: string; // e.g. Phone number to show alongside name
    className?: string;
    required?: boolean;
    readOnly?: boolean;
}

export default function Autocomplete({
    label, placeholder, value, onChange, onSelect, suggestions, searchKey, secondaryKey, className, required, readOnly
}: AutocompleteProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const filtered = suggestions.filter(item => {
        const val = item[searchKey]?.toString().toLowerCase() || "";
        return val.includes(value.toLowerCase());
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <Input
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                required={required}
                readOnly={readOnly}
                className={readOnly ? "cursor-not-allowed" : ""}
            />
            {showSuggestions && value && filtered.length > 0 && !readOnly && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filtered.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                onSelect(item);
                                setShowSuggestions(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-[var(--border)] last:border-0 text-xs"
                        >
                            <div className="font-bold text-[var(--foreground)]">{item[searchKey]}</div>
                            {secondaryKey && (
                                <div className="text-[var(--foreground)] opacity-60 text-[10px]">{item[secondaryKey]}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
