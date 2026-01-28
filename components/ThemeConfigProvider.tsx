"use client";

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

function hexToHslString(hex: string): string | null {
    const normalized = hex.trim().replace("#", "");
    const full = normalized.length === 3
        ? normalized.split("").map((c) => c + c).join("")
        : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `${h} ${sPct}% ${lPct}%`;
}

function sidebarChoiceToHslValue(choice: string): string {
    switch (choice) {
        case "background":
            return "var(--background)";
        case "card":
            return "var(--card)";
        case "white":
            return "0 0% 100%";
        case "black":
            return "222.2 84% 4.9%";
        case "slate":
            return "222.2 84% 6.5%";
        default:
            return "var(--card)";
    }
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const { accentColor, sidebarLight, sidebarDark, sidebarMode } = useAuth();

    const primaryHsl = useMemo(() => {
        return hexToHslString(accentColor) ?? "243 75% 59%";
    }, [accentColor]);

    const effectiveSidebarTheme = useMemo(() => {
        if (sidebarMode === "light") return "light";
        if (sidebarMode === "dark") return "dark";
        return resolvedTheme === "dark" ? "dark" : "light";
    }, [resolvedTheme, sidebarMode]);

    const sidebarChoice = useMemo(() => {
        if (sidebarMode === "light") return sidebarLight || "card";
        if (sidebarMode === "dark") return sidebarDark || "card";
        return (resolvedTheme === "dark" ? sidebarDark : sidebarLight) || "card";
    }, [resolvedTheme, sidebarDark, sidebarLight, sidebarMode, sidebarLight, sidebarDark]);

    const sidebarBg = useMemo(() => {
        return sidebarChoiceToHslValue(sidebarChoice);
    }, [sidebarChoice]);

    const sidebarTone = useMemo(() => {
        if (sidebarChoice === "black" || sidebarChoice === "slate") return "dark";
        if (sidebarChoice === "white") return "light";
        return effectiveSidebarTheme;
    }, [effectiveSidebarTheme, sidebarChoice]);

    const sidebarFg = useMemo(() => {
        return sidebarTone === "dark" ? "210 40% 98%" : "222.2 47.4% 11.2%";
    }, [sidebarTone]);

    const sidebarMuted = useMemo(() => {
        return sidebarTone === "dark" ? "215 20.2% 65.1%" : "215.4 16.3% 46.9%";
    }, [sidebarTone]);

    const sidebarBorder = useMemo(() => {
        return sidebarTone === "dark" ? "0 0% 100% / 0.14" : "222.2 47.4% 11.2% / 0.10";
    }, [sidebarTone]);

    const sidebarHover = useMemo(() => {
        return sidebarTone === "dark" ? "0 0% 100% / 0.06" : "222.2 47.4% 11.2% / 0.04";
    }, [sidebarTone]);

    const style = useMemo(() => {
        return {
            ["--brand-accent" as any]: accentColor || "#4f46e5",
            ["--primary" as any]: primaryHsl,
            ["--ring" as any]: primaryHsl,
            ["--sidebar-bg" as any]: sidebarBg,
            ["--sidebar-fg" as any]: sidebarFg,
            ["--sidebar-muted" as any]: sidebarMuted,
            ["--sidebar-border" as any]: sidebarBorder,
            ["--sidebar-hover" as any]: sidebarHover,
        } as React.CSSProperties;
    }, [accentColor, primaryHsl, sidebarBg, sidebarBorder, sidebarFg, sidebarHover, sidebarMuted]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--brand-accent", accentColor || "#4f46e5");
        root.style.setProperty("--primary", primaryHsl);
        root.style.setProperty("--ring", primaryHsl);
        root.style.setProperty("--sidebar-bg", sidebarBg);
        root.style.setProperty("--sidebar-fg", sidebarFg);
        root.style.setProperty("--sidebar-muted", sidebarMuted);
        root.style.setProperty("--sidebar-border", sidebarBorder);
        root.style.setProperty("--sidebar-hover", sidebarHover);
    }, [accentColor, primaryHsl, sidebarBg, sidebarBorder, sidebarFg, sidebarHover, sidebarMuted]);

    return <div style={style}>{children}</div>;
}
