"use client";
import { useAuth } from "@/context/AuthContext";
import { FaClock } from "react-icons/fa6";

export default function VerificationPendingPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaClock className="text-4xl text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Verification Pending</h1>
                <p className="text-slate-300 mb-6">
                    Your account is currently under review by the administrator.
                    You will receive access once your account has been verified.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.href = `mailto:${process.env.NEXT_PUBLIC_OWNER_EMAIL}?subject=Account Verification Request`}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition"
                    >
                        Contact Support
                    </button>
                    <button
                        onClick={logout}
                        className="w-full px-6 btn-edit dark:text-white"
                    >

                        Logout & Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
