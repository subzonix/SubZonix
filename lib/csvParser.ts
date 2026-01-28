import Papa from 'papaparse';
import { Sale, Client, ToolItem } from '@/types';
import { isValidDate } from './utils';

export interface CSVRow {
    'Activation Date'?: string;
    'Client'?: string;
    'Number'?: string;
    'Tool Name'?: string;
    'Duration'?: string;
    'Expiry Date'?: string;
    'Type'?: string;
    'Plan'?: string;
    'Email'?: string;
    'Password'?: string;
    'Profile Name'?: string;
    'Profile PIN'?: string;
    'Vendor'?: string;
    'Cost'?: string;
    'Sale'?: string;
    'Profit'?: string;
}

export function parseCSVToSales(csvText: string): { success: boolean; sales: Partial<Sale>[]; errors: string[] } {
    const errors: string[] = [];
    const sales: Partial<Sale>[] = [];

    try {
        const result = Papa.parse<CSVRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });

        if (result.errors.length > 0) {
            result.errors.forEach(err => errors.push(`Row ${err.row}: ${err.message}`));
        }

        // Group rows by client and date to create sales
        const salesMap = new Map<string, { client: Client, items: ToolItem[], date: string, vendor: string }>();

        result.data.forEach((row, idx) => {
            try {
                const clientName = row['Client']?.trim();
                const clientPhone = row['Number']?.trim();
                const activationDate = row['Activation Date']?.trim();

                if (!clientName || !clientPhone || !activationDate) {
                    errors.push(`Row ${idx + 2}: Missing required fields (Client, Number, or Activation Date)`);
                    return;
                }

                if (!isValidDate(activationDate)) {
                    errors.push(`Row ${idx + 2}: Invalid Activation Date format ("${activationDate}")`);
                    return;
                }

                const key = `${clientName}_${activationDate}`;

                if (!salesMap.has(key)) {
                    salesMap.set(key, {
                        client: {
                            name: clientName,
                            phone: clientPhone,
                            status: "Clear"
                        },
                        items: [],
                        date: activationDate,
                        vendor: row['Vendor']?.trim() || ""
                    });
                }

                const sale = salesMap.get(key)!;

                // Add tool item
                const toolName = row['Tool Name']?.trim();
                if (toolName) {
                    const cost = parseFloat(row['Cost'] || '0') || 0;
                    const sell = parseFloat(row['Sale'] || '0') || 0;

                    sale.items.push({
                        name: toolName,
                        type: row['Type']?.trim() as any || 'Shared',
                        plan: row['Plan']?.trim() || '',
                        pDate: activationDate,
                        eDate: row['Expiry Date']?.trim() || '',
                        email: row['Email']?.trim() || '',
                        pass: row['Password']?.trim() || '',
                        profileName: row['Profile Name']?.trim() || '',
                        profilePin: row['Profile PIN']?.trim() || '',
                        cost,
                        sell
                    });
                }
            } catch (e: any) {
                errors.push(`Row ${idx + 2}: ${e.message}`);
            }
        });

        // Convert map to sales array
        salesMap.forEach((saleData) => {
            const totalCost = saleData.items.reduce((sum, item) => sum + (item.cost || 0), 0);
            const totalSell = saleData.items.reduce((sum, item) => sum + (item.sell || 0), 0);

            sales.push({
                client: saleData.client,
                items: saleData.items,
                vendor: { name: saleData.vendor, phone: '', status: 'Paid' },
                finance: {
                    totalCost,
                    totalSell,
                    totalProfit: totalSell - totalCost,
                    pendingAmount: 0
                },
                instructions: "No Instructions",
                createdAt: new Date(saleData.date).getTime()
            });
        });

        return {
            success: errors.length === 0,
            sales,
            errors
        };
    } catch (e: any) {
        return {
            success: false,
            sales: [],
            errors: [`Parse error: ${e.message}`]
        };
    }
}
