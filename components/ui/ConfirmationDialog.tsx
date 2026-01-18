"use client";

import { Button, Card } from "./Shared";

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary" | "success";
}

export default function ConfirmationDialog({
    isOpen, title, message, onConfirm, onCancel,
    confirmText = "Confirm", cancelText = "Cancel", variant = "danger"
}: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                <div className="flex gap-2 justify-end">
                    <Button onClick={onCancel} variant="secondary">{cancelText}</Button>
                    <Button onClick={onConfirm} variant={variant}>{confirmText}</Button>
                </div>
            </Card>
        </div>
    );
}
