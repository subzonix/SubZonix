import { jsPDF } from "jspdf";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const INSTRUCTION_TEXTS: Record<string, string> = {
    "Shared": `Don't try to change email/password.\nLogin on Single Device only.\nDon't Change billing settings.\nDon't Share Credentials with anyone else.\nFor Personal use only.\nAll tools with 25-27 days replacement/refund warranty.\nNo Warranty in case of any rules violation.`,
    "Mail Access": `Change Password of the Email.\nChange Password to the given Tool.\nSecure your mail by adding a recovery email and mobile number.\nLogout from all previous devices.\nNever mess with billing details.\nCheck official website for features.\n25-27 days Replacement/Refund Warranty.\nNo Warranty in case of any violation.\nNo Warranty if account suspended due to multiple logins.`,
    "Private": `Must change password of the given tool to make it secure.\nAlways check official website for more details.\nNever mess with billing details.\n25-27 Days Replacement/Refund Warranty.\nNo Warranty in case of any violation.\nNo Warranty if Account Suspended due to multiple logins.`,
    "OTT": `OTT single-screen subscription is restricted to one device only. The account will be accessible on that device for the entire month, and logging in on a second device is strictly prohibited. Logout from the first device and then login in to another device is also not allowed\nChanging the screen name is not permitted.\nChanging the PIN is not allowed.\nThe warranty is valid for 28 days.\nTampering with billing settings or any other settings is strictly prohibited.\nNote : Failure to comply with any of these rules will result in immediate termination of your subscription, and no warranty, replacement, or refund will be provided thereafter.`,
    "Microsoft": `Microsoft Office 365 (1-Year Subscription) – Terms & Conditions\n\nAccount Security\nUpon receiving the account, you must immediately change the password and enable Two-Step Verification (2FA) using Google Authenticator or Microsoft Authenticator to secure your account.\n\nData Responsibility\nThis subscription is provided through a Microsoft panel. In case the panel gets suspended in the future, a replacement will be issued from a secondary panel. However, we are not responsible for any data loss during this process. You must maintain your own backups to prevent data loss.\n\nPassword Management\nAlways remember and securely store your password.\nIf you forget your password, a one-time reset will be provided. Repeated requests will not be entertained.\n\nTroubleshooting & Support\nFor any issues, first attempt to resolve them independently by referring to YouTube tutorials or online resources.\nIf the issue persists, contact us, and we will assist in resolving it.\n\nPost-Expiry Responsibility\nAfter 1 year (upon expiry), we are not responsible for your data. You must keep track of the expiry date and back up your data before the subscription ends.`
};

export function cleanPhone(phone: string, countryCode: string = "+92") {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d]/g, "");

    // If it starts with 0, remove it
    if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
    }

    // If it doesn't start with the country code digits (e.g. 92), add it
    const cc = countryCode.replace("+", "");
    if (!cleaned.startsWith(cc)) {
        cleaned = cc + cleaned;
    }

    return cleaned;
}

export function toHumanDate(dateStr: string) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function generateInvoicePDF(sale: any, companyInfo?: { name?: string, slogan?: string, logo?: string, contact?: string, account?: string, iban?: string, bankName?: string, accountHolder?: string }) {
    const doc = new jsPDF();
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [241, 245, 249]; // Slate-100
    const accentColor = [16, 185, 129]; // Emerald-500

    const companyName = companyInfo?.name || "Tapn Tools";
    const logoUrl = companyInfo?.logo;

    // --- Header Background ---
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, 210, 60, 'F');

    // --- Logo & Name ---
    if (logoUrl) {
        try {
            doc.addImage(logoUrl, 'PNG', 20, 10, 30, 30);
        } catch (e) {
            console.error("PDF Logo Error", e);
        }
    }

    const textX = logoUrl ? 55 : 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), textX, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo?.slogan || "Premium Digital Solutions Provider", textX, 32);

    if (companyInfo?.contact) {
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Contact: ${companyInfo.contact}`, textX, 38);
    }

    // --- Invoice Meta ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("INVOICE TO:", 20, 75);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(sale.client.name, 20, 83);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Phone: ${sale.client.phone}`, 20, 89);
    if (sale.client.email) doc.text(`Email: ${sale.client.email}`, 20, 94);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ORDER INFO:", 130, 75);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`, 130, 83);
    doc.text(`Status: ${sale.client.status.toUpperCase()}`, 130, 89);

    // --- Items Table Header ---
    let y = 110;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, y, 170, 10, 'F');

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255);
    doc.text("DESCRIPTION", 25, y + 7);
    doc.text("PLAN", 85, y + 7);
    doc.text("EXPIRY", 125, y + 7);
    doc.text("PRICE", 170, y + 7);

    y += 10;

    // --- Items ---
    sale.items.forEach((item: any, idx: number) => {
        if (y > 230) { doc.addPage(); y = 20; } // Adjusted page break threshold

        // Alternate row background
        if (idx % 2 !== 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(20, y, 170, 25, 'F');
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text(item.name, 25, y + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Type: ${item.type}`, 25, y + 14);
        doc.text(`Login: ${item.email || '-'} / ${item.pass || '-'}`, 25, y + 20);

        doc.setTextColor(0);
        doc.text(item.plan || "-", 85, y + 8);
        doc.text(toHumanDate(item.eDate), 125, y + 8);

        if (item.profileName) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Profile: ${item.profileName} (PIN: ${item.profilePin || '-'})`, 85, y + 14);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Rs. ${item.sell.toLocaleString()}`, 170, y + 8);

        y += 25;
        doc.setDrawColor(241, 245, 249);
        doc.line(20, y, 190, y);
    });

    // --- Bottom Panels Logic ---
    y += 10;
    if (y > 230) { doc.addPage(); y = 20; }

    const panelHeight = 50;
    const panelY = y;

    // -- Left Panel: Payment Info --
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, panelY, 80, panelHeight, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAYMENT DETAILS", 25, panelY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70);

    let paymentY = panelY + 18;

    if (companyInfo?.bankName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Bank:", 25, paymentY);
        doc.setFont("helvetica", "normal");
        doc.text(companyInfo.bankName, 25, paymentY + 4);
        paymentY += 10;
    }

    if (companyInfo?.accountHolder) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Account Holder:", 25, paymentY);
        doc.setFont("helvetica", "normal");
        doc.text(companyInfo.accountHolder, 25, paymentY + 4);
        paymentY += 10;
    }

    if (companyInfo?.iban) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("IBAN:", 25, paymentY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const splitIban = doc.splitTextToSize(companyInfo.iban, 70);
        doc.text(splitIban, 25, paymentY + 4);
        paymentY += (splitIban.length * 3) + 4;
    }

    if (companyInfo?.account) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Account:", 25, paymentY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const splitAccount = doc.splitTextToSize(companyInfo.account, 70);
        doc.text(splitAccount, 25, paymentY + 4);
    }

    if (!companyInfo?.bankName && !companyInfo?.accountHolder && !companyInfo?.iban && !companyInfo?.account) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(70);
        const accountDetails = "Contact administrator for details.";
        const splitAccount = doc.splitTextToSize(accountDetails, 70);
        doc.text(splitAccount, 25, panelY + 18);
    }


    // -- Right Panel: Instructions & Branding --
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(110, panelY, 80, panelHeight, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("INSTRUCTIONS / WARRANTY", 115, panelY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70);

    let instructionsText = sale.instructions || "No specific instructions.";
    if (instructionsText === "No Instructions") instructionsText = "Standard terms apply.";

    const cleanInstr = instructionsText.replace(/\*/g, '');
    const splitInstr = doc.splitTextToSize(cleanInstr, 70);
    const maxLines = 8;
    const renderInstr = splitInstr.length > maxLines ? splitInstr.slice(0, maxLines).concat(["..."]) : splitInstr;

    doc.text(renderInstr, 115, panelY + 18);

    // --- Document Footer ---
    const footerY = 280;
    doc.setDrawColor(200);
    doc.line(20, footerY, 190, footerY);
    const year = new Date().getFullYear();
    const slogan = companyInfo?.slogan || "Premium Digital Services";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`© ${year} ${companyName}`, 20, footerY + 8);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(slogan, 105, footerY + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generated by ${companyName}`, 190, footerY + 8, { align: "right" });

    const safeFileName = sale.client.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Invoice_${safeFileName}_${Date.now()}.pdf`);
}

const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export function exportToCSV(sales: any[], filename: string, columnPreferences?: Record<string, boolean>) {
    if (sales.length === 0) return;

    // Definition of all available columns and their data accessors
    const columnDefinitions = [
        { key: "Activation Date", accessor: (s: any, item: any) => s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-" },
        { key: "Client", accessor: (s: any, item: any) => s.client?.name || "-" },
        { key: "Number", accessor: (s: any, item: any) => s.client?.phone || "-" },
        { key: "Tool Name", accessor: (s: any, item: any) => item.toolName || item.name || "N/A" },
        { key: "Plan", accessor: (s: any, item: any) => item.plan || "-" },
        { key: "Duration", accessor: (s: any, item: any) => item.pDate && item.eDate ? Math.ceil((new Date(item.eDate).getTime() - new Date(item.pDate).getTime()) / (1000 * 60 * 60 * 24)) + " Days" : "N/A" },
        { key: "Expiry Date", accessor: (s: any, item: any) => item.eDate || "-" },
        { key: "Type", accessor: (s: any, item: any) => item.type || "-" },
        { key: "Email", accessor: (s: any, item: any) => item.email || "-" },
        { key: "Password", accessor: (s: any, item: any) => item.pass || "-" },
        { key: "Profile Name", accessor: (s: any, item: any) => item.profileName || "-" },
        { key: "Profile PIN", accessor: (s: any, item: any) => item.profilePin || "-" },
        { key: "Vendor", accessor: (s: any, item: any) => s.vendor?.name || "-" },
        { key: "Cost", accessor: (s: any, item: any) => item.cost || 0, isCurrency: true },
        { key: "Sale", accessor: (s: any, item: any) => item.sell || 0, isCurrency: true },
        { key: "Profit", accessor: (s: any, item: any) => (item.sell || 0) - (item.cost || 0), isCurrency: true }
    ];

    // Filter columns based on preferences (default to true if not specified/empty)
    const activeColumns = columnDefinitions.filter(col => {
        if (!columnPreferences || Object.keys(columnPreferences).length === 0) return true;
        return columnPreferences[col.key] !== false;
    });

    const headers = activeColumns.map(c => c.key);

    let totalSale = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalOrders = 0;

    const rows = sales.flatMap(s => {
        const safeItems = Array.isArray(s.items) ? s.items : [];
        if (safeItems.length === 0) return [];

        return safeItems.map((item: any) => {
            totalOrders++;
            totalSale += item.sell || 0;
            totalCost += item.cost || 0;
            totalProfit += (item.sell || 0) - (item.cost || 0);

            return activeColumns.map(col => col.accessor(s, item));
        });
    });

    // Summary Row Logic
    // We want to try to align totals under their respective columns if they exist.
    // If "Cost", "Sale", "Profit" are present, put totals there. 
    // Otherwise, append to the end or just skip.
    const summaryRow = activeColumns.map(col => {
        if (col.key === "Cost") return totalCost;
        if (col.key === "Sale") return totalSale;
        if (col.key === "Profit") return totalProfit;
        if (col.key === "Tool Name") return `Total Orders: ${totalOrders}`; // Arbitrary placement
        return "";
    });

    // Formatting values with proper escaping
    const processRow = (row: any[]) => row.map(v => {
        if (v === null || v === undefined) return "";
        const str = String(v);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(",");

    const csvContent = [
        headers.join(","),
        ...rows.map(processRow),
        processRow(summaryRow)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function importFromCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split("\n").filter(l => l.trim().length > 0);
                const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

                const data = lines.slice(1).map(line => {
                    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                    const obj: any = {};
                    headers.forEach((h, i) => {
                        obj[h] = values[i]?.replace(/"/g, "").trim();
                    });
                    return obj;
                });
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

