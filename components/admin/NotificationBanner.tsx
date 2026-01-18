"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { FaBullhorn, FaXmark } from "react-icons/fa6";

interface AppNotification {
    id: string;
    message: string;
    createdAt: number;
    type: "info" | "warning" | "alert";
    target: "global" | "user";
    userId?: string;
    expiresAt?: number;
    behavior?: "moving" | "fixed";
}

export default function NotificationBanner() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        if (!user) return;

        const qGlobal = query(
            collection(db, "notifications"),
            where("target", "==", "global")
        );

        const qUser = query(
            collection(db, "notifications"),
            where("target", "==", "user"),
            where("userId", "==", user.uid)
        );

        const unsubGlobal = onSnapshot(qGlobal, (snap) => {
            const globals = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            setNotifications(prev => {
                const userNotifs = prev.filter(n => n.target === "user");
                const merged = [...userNotifs, ...globals];
                const now = Date.now();
                return merged.filter(n => !n.expiresAt || n.expiresAt > now).sort((a, b) => b.createdAt - a.createdAt);
            });
        });

        const unsubUser = onSnapshot(qUser, (snap) => {
            const userNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            setNotifications(prev => {
                const globals = prev.filter(n => n.target === "global");
                const merged = [...globals, ...userNotifs];
                const now = Date.now();
                return merged.filter(n => !n.expiresAt || n.expiresAt > now).sort((a, b) => b.createdAt - a.createdAt);
            });
        });

        return () => {
            unsubGlobal();
            unsubUser();
        };
    }, [user]);

    if (notifications.length === 0) return null;

    // Show only the latest notification
    const latest = notifications[0];
    const isMoving = (latest.behavior || "moving") === "moving";

    const bgColors = {
        info: "bg-indigo-600",
        warning: "bg-amber-500",
        alert: "bg-rose-500"
    };

    return (
        <div className={`${bgColors[latest.type]} text-white h-8 overflow-hidden relative flex items-center animate-in slide-in-from-top-2`}>
            {isMoving ? (
                <>
                    <style jsx>{`
                        @keyframes marquee {
                            0% { transform: translateX(100%); }
                            100% { transform: translateX(-100%); }
                        }
                        .marquee-text {
                            animation: marquee 30s linear infinite;
                            white-space: nowrap;
                            display: inline-flex;
                            align-items: center;
                            gap: 0.5rem;
                            position: absolute;
                            left: 0;
                            width: 100%;
                        }
                        .marquee-text:hover {
                            animation-play-state: paused;
                        }
                    `}</style>
                    <div className="marquee-text text-xs font-bold w-full px-4">
                        <FaBullhorn className="shrink-0" />
                        <span>{latest.message}</span>
                    </div>
                </>
            ) : (
                <div className="w-full flex items-center justify-center gap-2 text-xs font-bold px-4">
                    <FaBullhorn className="shrink-0" />
                    <span className="truncate">{latest.message}</span>
                </div>
            )}
        </div>
    );
}
