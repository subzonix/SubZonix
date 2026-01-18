"use client";

import { useEffect } from "react";
import { FaCircleExclamation, FaTriangleExclamation, FaCircleInfo, FaXmark } from "react-icons/fa6";
import clsx from "clsx";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "info",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantConfig = {
        danger: {
            icon: FaCircleExclamation,
            iconColor: "text-rose-500",
            iconBg: "bg-rose-50 dark:bg-rose-900/20",
            confirmButton: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
        },
        warning: {
            icon: FaTriangleExclamation,
            iconColor: "text-amber-500",
            iconBg: "bg-amber-50 dark:bg-amber-900/20",
            confirmButton: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
        },
        info: {
            icon: FaCircleInfo,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
            confirmButton: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
        },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                onClick={onCancel}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Dialog */}
            <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                    <FaXmark className="text-sm" />
                </button>

                {/* Icon */}
                <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", config.iconBg)}>
                    <Icon className={clsx("text-2xl", config.iconColor)} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-black text-[var(--foreground)] mb-2 pr-8">
                    {title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={clsx(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg",
                            config.confirmButton
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
