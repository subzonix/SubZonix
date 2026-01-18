import { generateInvoicePDF } from "@/lib/utils";

export function handleDownloadPDF(sale: any, companyInfo: {
    companyName?: string;
    slogan?: string;
    logoUrl?: string;
    companyPhone?: string;
    accountNumber?: string;
    iban?: string;
    bankName?: string;
    accountHolder?: string;
}) {
    generateInvoicePDF(sale, {
        name: companyInfo?.companyName,
        slogan: companyInfo?.slogan,
        logo: companyInfo?.logoUrl,
        contact: companyInfo?.companyPhone,
        account: companyInfo?.accountNumber,
        iban: companyInfo?.iban,
        bankName: companyInfo?.bankName,
        accountHolder: companyInfo?.accountHolder
    });
}
