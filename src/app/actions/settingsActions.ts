"use server";

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { categories, materials } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// --- Categories ---

export async function getCategoriesAction() {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        const data = await db.query.categories.findMany({
            orderBy: [asc(categories.name)]
        });
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: 'Failed to fetch categories' };
    }
}

export async function createCategoryAction(name: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        const id = name.toLowerCase().replace(/\s+/g, '-');
        await db.insert(categories).values({ id, name });
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed to create category. It might already exist.' };
    }
}

export async function updateCategoryAction(id: string, name: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        await db.update(categories).set({ name }).where(eq(categories.id, id));
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error updating category:', error);
        return { success: false, error: 'Failed to update category' };
    }
}

export async function deleteCategoryAction(id: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        await db.delete(categories).where(eq(categories.id, id));
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

// --- Materials ---

export async function getMaterialsAction() {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        const data = await db.query.materials.findMany({
            orderBy: [asc(materials.name)]
        });
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching materials:', error);
        return { success: false, error: 'Failed to fetch material quality' };
    }
}

export async function createMaterialAction(name: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        const id = name.toLowerCase().replace(/\s+/g, '-');
        await db.insert(materials).values({ id, name });
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error creating material:', error);
        return { success: false, error: 'Failed to create material quality. It might already exist.' };
    }
}

export async function updateMaterialAction(id: string, name: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        await db.update(materials).set({ name }).where(eq(materials.id, id));
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error updating material:', error);
        return { success: false, error: 'Failed to update material quality' };
    }
}

export async function deleteMaterialAction(id: string) {
    try {
        const { env } = await getCloudflareContext();
        const db = getDb(env.DB);
        await db.delete(materials).where(eq(materials.id, id));
        revalidatePath('/settings');
        revalidatePath('/inventory');
        revalidatePath('/invoice/create');
        return { success: true };
    } catch (error) {
        console.error('Error deleting material:', error);
        return { success: false, error: 'Failed to delete material quality' };
    }
}
