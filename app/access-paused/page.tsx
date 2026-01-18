"use client";
import { useAuth } from "@/context/AuthContext";
import { FaBan } from "react-icons/fa6";

export default function AccessPausedPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaBan className="text-4xl text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Paused</h1>
                <p className="text-slate-400 mb-8">
                    Your account access has been temporarily paused by the administrator.
                    Please contact support if you believe this is a mistake.
                </p>
                <button
                    onClick={() => logout()}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-medium text-sm"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
