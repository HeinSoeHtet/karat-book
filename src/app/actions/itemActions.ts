"use server";

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { items } from '@/db/schema';
import { eq, and, or, sql, count } from 'drizzle-orm';
import { Item } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createItemAction(formData: FormData) {
    console.log('Starting createItemAction...');
    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        if (!env.BUCKET) throw new Error('R2 Bucket not configured');

        const db = getDb(env.DB);
        const bucket = env.BUCKET;

        // 1. Extract and upload image if present
        const file = formData.get('image') as File;
        let imageUrl = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop';

        if (file && file.size > 0) {
            // Validation: Check MIME type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
            if (!allowedMimeTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only standard images (JPEG, PNG, WEBP, GIF, SVG) are allowed.');
            }

            console.log('Uploading image to R2...');
            const bytes = await file.arrayBuffer();
            const fileExtension = file.name.split('.').pop() || 'jpg';

            // Validation: Basic extension check
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
            if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
                throw new Error('Invalid file extension.');
            }

            const fileName = `inventory/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

            await bucket.put(fileName, bytes, {
                httpMetadata: { contentType: file.type },
            });
            console.log('Image uploaded successfully:', fileName);
            imageUrl = `/api/images/${fileName}`;
        }

        // 2. Insert into database
        const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
            id,
            name: formData.get('name') as string,
            category: (formData.get('category') as string) || '',
            description: (formData.get('description') as string) || null,
            material: formData.get('material') as string,
            stock: Number(formData.get('stock')),
            image: imageUrl,
        };

        console.log('Inserting item into DB:', newItem.id);
        await db.insert(items).values(newItem);
        console.log('Item inserted successfully');

        revalidatePath('/inventory');
        return { success: true, data: newItem };
    } catch (error) {
        console.error('Error creating item:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create item' };
    }
}

export async function updateItemAction(id: string, formData: FormData) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        const bucket = env.BUCKET;

        const updateData: Record<string, string | number | Date | null> = {
            name: formData.get('name') as string,
            category: (formData.get('category') as string) || '',
            description: (formData.get('description') as string) || null,
            material: formData.get('material') as string,
            stock: Number(formData.get('stock')),
            updatedAt: new Date(),
        };

        // Handle image update if a new one is provided
        const imagePart = formData.get('image');

        if (imagePart instanceof File && imagePart.size > 0) {
            // Validation: Check MIME type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
            if (!allowedMimeTypes.includes(imagePart.type)) {
                throw new Error('Invalid file type. Only standard images (JPEG, PNG, WEBP, GIF, SVG) are allowed.');
            }

            const bytes = await imagePart.arrayBuffer();
            const fileExtension = imagePart.name.split('.').pop() || 'jpg';

            // Validation: Basic extension check
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
            if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
                throw new Error('Invalid file extension.');
            }

            const fileName = `inventory/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

            await bucket.put(fileName, bytes, {
                httpMetadata: { contentType: imagePart.type },
            });
            updateData.image = `/api/images/${fileName}`;
        } else if (typeof imagePart === 'string' && imagePart.length > 0) {
            updateData.image = imagePart;
        }

        await db.update(items)
            .set(updateData)
            .where(eq(items.id, id));

        revalidatePath('/inventory');
        revalidatePath(`/inventory/edit/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating item:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update item' };
    }
}

export async function deleteItemAction(id: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);

        await db.delete(items).where(eq(items.id, id));

        revalidatePath('/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error deleting item:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete item' };
    }
}

export async function getItemsAction(params: {
    page?: number;
    pageSize?: number;
    category?: string;
    materials?: string[];
    stockStatus?: 'all' | 'low-stock' | 'out-of-stock';
} = {}) {
    const {
        page = 1,
        pageSize = 10,
        category = 'all',
        materials: materialFilters = [],
        stockStatus = 'all'
    } = params;

    try {
        const { env } = await getCloudflareContext();
        if (!env.DB) throw new Error('D1 Database not configured');
        const db = getDb(env.DB);
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const whereClauses = [];

        if (category && category !== 'all') {
            whereClauses.push(eq(items.category, category));
        }

        if (stockStatus === 'low-stock') {
            whereClauses.push(sql`${items.stock} > 0 AND ${items.stock} <= 5`);
        } else if (stockStatus === 'out-of-stock') {
            whereClauses.push(eq(items.stock, 0));
        }

        if (materialFilters && materialFilters.length > 0) {
            const materialConditions = materialFilters.map(mat =>
                sql`LOWER(${items.material}) LIKE ${'%' + mat.toLowerCase() + '%'}`
            );
            whereClauses.push(or(...materialConditions));
        }

        const finalWhere = whereClauses.length > 0 ? and(...whereClauses) : undefined;

        // Get total count for these filters
        const countResult = await db.select({ value: count() })
            .from(items)
            .where(finalWhere);
        const filteredTotal = countResult[0].value;

        // Get global counts for stats cards
        const totalResult = await db.select({ value: count() }).from(items);
        const lowStockResult = await db.select({ value: count() }).from(items).where(and(sql`${items.stock} > 0`, sql`${items.stock} <= 5`));
        const outOfStockResult = await db.select({ value: count() }).from(items).where(eq(items.stock, 0));

        // Get paginated items
        const paginatedItems = await db.query.items.findMany({
            where: finalWhere,
            orderBy: (items, { desc }) => [desc(items.createdAt)],
            limit: pageSize,
            offset: offset,
        });

        return {
            success: true,
            data: paginatedItems as Item[],
            pagination: {
                total: filteredTotal,
                totalPages: Math.ceil(filteredTotal / pageSize),
                currentPage: page,
                pageSize
            },
            stats: {
                totalCount: totalResult[0].value,
                lowStockCount: lowStockResult[0].value,
                outOfStockCount: outOfStockResult[0].value
            }
        };
    } catch (error) {
        console.error('Error fetching items:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch items' };
    }
}

export async function getItemByIdAction(id: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);

        const item = await db.query.items.findFirst({
            where: eq(items.id, id),
        });

        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        return { success: true, data: item as Item };
    } catch (error) {
        console.error('Error fetching item:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch item' };
    }
}

export async function updateStockAction(id: string, newStock: number) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);

        await db.update(items)
            .set({
                stock: newStock,
                updatedAt: new Date(),
            })
            .where(eq(items.id, id));

        revalidatePath('/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error updating stock:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update stock' };
    }
}

export async function searchItemsAction(params: {
    searchTerm?: string;
    category?: string;
    materials?: string[];
}) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);

        // Fetch all items from DB and filter in-memory for D1 efficiency 
        // (D1 doesn't have robust full-text search, and items count is usually manageable)
        const allItems = await db.query.items.findMany({
            orderBy: (items, { desc }) => [desc(items.createdAt)],
        });

        const filtered = (allItems as Item[]).filter(item => {
            const matchesCategory = !params.category || params.category === 'all' || item.category === params.category;
            const matchesMaterial = !params.materials || params.materials.length === 0 ||
                params.materials.some(mat => item.material.toLowerCase().includes(mat.toLowerCase()));
            const matchesSearch = !params.searchTerm ||
                item.name.toLowerCase().includes(params.searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(params.searchTerm.toLowerCase());

            return matchesCategory && matchesMaterial && matchesSearch;
        });

        // Limit results for performance
        return { success: true, data: filtered.slice(0, 50) };
    } catch (error) {
        console.error('Error searching items:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to search items' };
    }
}
