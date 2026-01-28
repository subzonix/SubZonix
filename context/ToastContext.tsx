"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: { title: string; message: string; okText?: string }) => Promise<void>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        options: { title: string; message: string; okText?: string };
        resolve: () => void;
    } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve,
            });
        });
    }, []);

    const alert = useCallback((options: { title: string; message: string; okText?: string }): Promise<void> => {
        return new Promise((resolve) => {
            setAlertState({
                isOpen: true,
                options,
                resolve,
            });
        });
    }, []);

    const handleConfirm = (value: boolean) => {
        if (confirmState) {
            confirmState.resolve(value);
            setConfirmState(null);
        }
    };

    const handleAlert = () => {
        if (alertState) {
            alertState.resolve();
            setAlertState(null);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, confirm, alert }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl 
              animate-in slide-in-from-right-10 duration-300
              ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                                toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' :
                                    toast.type === 'warning' ? 'bg-amber-500 border-amber-400 text-white' :
                                        'bg-indigo-600 border-indigo-500 text-white'}
            `}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/20 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmState && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[var(--border)]">
                            <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{confirmState.options.title}</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{confirmState.options.message}</p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/10 flex gap-3">
                            <button
                                onClick={() => handleConfirm(false)}
                                className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                {confirmState.options.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleConfirm(true)}
                                className={`
                  flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition shadow-lg
                  ${confirmState.options.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' :
                                        confirmState.options.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' :
                                            confirmState.options.variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' :
                                                confirmState.options.variant === 'info' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/20' :
                                                    'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}
                `}
                            >
                                {confirmState.options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {alertState && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{alertState.options.title}</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{alertState.options.message}</p>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/10">
                            <button
                                onClick={handleAlert}
                                className="w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-900/20 active:scale-95"
                            >
                                {alertState.options.okText || 'Got it'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
