import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const dailyMarketRate = sqliteTable('daily_market_rate', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(), // 'gold' | 'exchange_rate'
    hourlyRate: text('hourly_rate').notNull(), // JSON array
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const items = sqliteTable('items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description'),
    material: text('material').notNull(),
    stock: integer('stock').notNull().default(0),
    image: text('image').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const invoices = sqliteTable('invoices', {
    id: text('id').primaryKey(),
    invoiceNumber: text('invoice_number').notNull().unique(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone'),
    customerAddress: text('customer_address'),
    total: real('total').notNull(),
    type: text('type').notNull(), // sales, pawn
    status: text('status').notNull().default('paid'), // sales/buy: paid, unpaid, partially_paid, cancelled | pawn: active, overdue, expired, redeemed
    dueDate: integer('due_date', { mode: 'timestamp' }),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const invoiceItems = sqliteTable('invoice_items', {
    id: text('id').primaryKey(),
    invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    itemId: text('item_id'), // Nullable for manual/pawn items, no formal relationship
    name: text('name').notNull(),
    category: text('category'),
    quantity: integer('quantity').notNull(),
    price: real('price').notNull(),
    discount: real('discount').default(0),
    total: real('total').notNull(),
    returnType: text('return_type'), // making-charges, percentage
    weight: real('weight'),
});

export const invoiceRelations = relations(invoices, ({ many }) => ({
    items: many(invoiceItems),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceItems.invoiceId],
        references: [invoices.id],
    }),
}));

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey(), // Using slug/value as ID
    name: text('name').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const materials = sqliteTable('materials', {
    id: text('id').primaryKey(), // Using slug/value as ID
    name: text('name').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

