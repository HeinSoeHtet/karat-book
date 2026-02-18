"use server";

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { invoices, invoiceItems, items } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface CreateInvoiceData {
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    total: number;
    type: 'sales' | 'pawn' | 'buy';
    dueDate?: string | Date;
    notes?: string;
    items: {
        productId?: string;
        name: string;
        category?: string;
        quantity: number;
        price: number;
        discount?: number;
        returnType?: string;
    }[];
}

export async function createInvoiceAction(data: CreateInvoiceData) {
    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        const db = getDb(env.DB);

        if (data.type === 'pawn' && !data.dueDate) {
            throw new Error('Due date is required for pawn invoices');
        }

        const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // --- Unique Invoice Number Generation (Larger Random Space) ---
        let invoiceNumber = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
            const year = new Date().getFullYear();
            const candidateNumber = `INV-${year}-${randomSuffix}`;

            // Check if this number already exists
            const existing = await db.query.invoices.findFirst({
                where: eq(invoices.invoiceNumber, candidateNumber)
            });

            if (!existing) {
                invoiceNumber = candidateNumber;
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new Error('Failed to generate a unique invoice number. Please try again.');
        }

        const newInvoice = {
            id: invoiceId,
            invoiceNumber,
            customerName: data.customerName,
            customerPhone: data.customerPhone || null,
            customerAddress: data.customerAddress || null,
            total: data.total,
            type: data.type,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes || null,
        };

        // 1. Insert invoice
        await db.insert(invoices).values(newInvoice);

        // 2. Insert items
        const itemsToInsert = (data.items || []).map((item) => ({
            id: `inv-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            invoiceId: invoiceId,
            itemId: item.productId || null,
            name: item.name,
            category: item.category || null,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: (item.price * item.quantity) - (item.discount || 0),
            returnType: item.returnType || null,
        }));

        if (itemsToInsert.length > 0) {
            await db.insert(invoiceItems).values(itemsToInsert);
        }

        // 3. Update stock for sales (decrease) or buy (increase)
        if (data.type === 'sales' || data.type === 'buy') {
            for (const item of data.items) {
                if (item.productId) {
                    await db.update(items)
                        .set({
                            stock: data.type === 'sales'
                                ? sql`${items.stock} - ${item.quantity}`
                                : sql`${items.stock} + ${item.quantity}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(items.id, item.productId));
                }
            }
        }

        revalidatePath('/invoice');
        revalidatePath('/inventory');
        revalidatePath('/sales');

        return { success: true, data: { id: invoiceId, invoiceNumber } };
    } catch (error) {
        console.error('Error creating invoice:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' };
    }
}

export async function getInvoicesAction() {
    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        const db = getDb(env.DB);

        const allInvoices = await db.query.invoices.findMany({
            with: {
                items: true,
            },
            orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
        });

        return { success: true, data: allInvoices };
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoices' };
    }
}

export async function getInvoiceByIdAction(id: string) {
    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        const db = getDb(env.DB);

        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, id),
            with: {
                items: true,
            },
        });

        if (!invoice) {
            return { success: false, error: 'Invoice not found' };
        }

        return { success: true, data: invoice };
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoice' };
    }
}

export async function getInvoiceByNumberAction(invoiceNumber: string) {
    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        const db = getDb(env.DB);

        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.invoiceNumber, invoiceNumber),
            with: {
                items: true,
            },
        });

        if (!invoice) {
            return { success: false, error: 'Invoice not found' };
        }

        return { success: true, data: invoice };
    } catch (error) {
        console.error('Error fetching invoice by number:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoice' };
    }
}
