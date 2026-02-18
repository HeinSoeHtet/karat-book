"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
    Receipt,
    User,
    ShoppingCart,
    Plus,
    X,
    Trash2,
    ArrowLeft,
    Diamond,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/components/ui/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { searchItemsAction } from '@/app/actions/itemActions';
import { createInvoiceAction, getInvoiceByNumberAction } from '@/app/actions/invoiceActions';
import { Item, Invoice, InvoiceItem } from '@/types';

export default function CreateInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceType = (searchParams.get('type') as 'sales' | 'pawn' | 'buy') || 'sales';
    const [dbItems, setDbItems] = useState<Item[]>([]);

    const [isSearchingItems, setIsSearchingItems] = useState(false);
    const [hasSearchedItems, setHasSearchedItems] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState<Date>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sales invoice items (from inventory)
    const [selectedItems, setSelectedItems] = useState<Array<{
        productId: string;
        quantity: number;
        returnType: 'making-charges' | 'percentage';
        price: number;
        discount: number;
    }>>([]);

    // Pawn invoice items (manual entry)
    const [pawnItems, setPawnItems] = useState<Array<{
        name: string;
        quantity: number;
        price: number;
        productId?: string;
    }>>([]);

    // Dialog state
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [isSearchingHistory, setIsSearchingHistory] = useState(false);
    const [foundInvoice, setFoundInvoice] = useState<Invoice | null>(null);
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    const handleSearchHistory = async () => {
        if (!historySearchTerm.trim()) return;
        setIsSearchingHistory(true);
        setFoundInvoice(null);
        try {
            const result = await getInvoiceByNumberAction(historySearchTerm.trim());
            if (result.success && result.data) {
                setFoundInvoice(result.data as unknown as Invoice);
            } else {
                toast.error('Invoice not found');
            }
        } catch (error) {
            console.error('Search failed', error);
            toast.error('Search failed');
        } finally {
            setIsSearchingHistory(false);
        }
    };

    // Filter states for product selection (used in dialog)
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [materialFilters, setMaterialFilters] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchFilteredItems = useCallback(async () => {
        setIsSearchingItems(true);
        setHasSearchedItems(true);
        try {
            const result = await searchItemsAction({
                searchTerm,
                category: categoryFilter,
                materials: materialFilters
            });
            if (result.success) {
                setDbItems(result.data || []);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearchingItems(false);
        }
    }, [categoryFilter, materialFilters, searchTerm]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setMaterialFilters([]);
        setDbItems([]);
        setHasSearchedItems(false);
    };

    useEffect(() => {
        if (!showItemDialog) {
            handleClearFilters();
        }
    }, [showItemDialog]);

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'rings', label: 'Rings' },
        { value: 'necklaces', label: 'Necklaces' },
        { value: 'bracelets', label: 'Bracelets' },
        { value: 'earrings', label: 'Earrings' },
        { value: 'watches', label: 'Watches' },
    ];

    const materials = [
        { value: '24K Gold', label: '24K Gold' },
        { value: '22K Gold', label: '22K Gold' },
        { value: '18K Gold', label: '18K Gold' },
        { value: '14K Gold', label: '14K Gold' },
        { value: 'White Gold', label: 'White Gold' },
        { value: 'Yellow Gold', label: 'Yellow Gold' },
        { value: 'Rose Gold', label: 'Rose Gold' },
        { value: 'Platinum', label: 'Platinum' },
        { value: 'Sterling Silver', label: 'Sterling Silver' },
        { value: 'Stainless Steel', label: 'Stainless Steel' },
        { value: 'Diamond', label: 'Diamond' },
        { value: 'Pearl', label: 'Pearl' },
        { value: 'Gemstone', label: 'Gemstone' },
        { value: 'Sapphire', label: 'Sapphire' },
        { value: 'Emerald', label: 'Emerald' },
        { value: 'Ruby', label: 'Ruby' },
    ];


    // Pawn item functions
    const addPawnItem = () => {
        setPawnItems([...pawnItems, { name: '', quantity: 1, price: 0 }]);
    };

    const removePawnItem = (index: number) => {
        setPawnItems(pawnItems.filter((_, i) => i !== index));
    };

    const updatePawnItemName = (index: number, name: string) => {
        const updated = [...pawnItems];
        updated[index].name = name;
        setPawnItems(updated);
    };

    const updatePawnItemQuantity = (index: number, quantity: number) => {
        const updated = [...pawnItems];
        updated[index].quantity = quantity;
        setPawnItems(updated);
    };

    const updatePawnItemPrice = (index: number, price: number) => {
        const updated = [...pawnItems];
        updated[index].price = price;
        setPawnItems(updated);
    };

    const copyFromInvoice = (invoice: Invoice) => {
        setCustomerName(invoice.customerName);
        setCustomerPhone(invoice.customerPhone || '');
        setCustomerAddress(invoice.customerAddress || '');

        const itemsToCopy = (invoice.items || []).map((item: InvoiceItem) => ({
            name: item.name,
            quantity: item.quantity,
            price: 0, // Reset price as requested
            productId: item.itemId, // Keep link if it was an inventory item
        }));
        setPawnItems(itemsToCopy);
        setShowHistoryDialog(false);
        toast.success(`Data copied from ${invoice.invoiceNumber}`);
    };

    const calculatePawnTotal = () => {
        const total = pawnItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        return { total };
    };

    const addItemToInvoice = (productId: string) => {
        const product = dbItems.find(p => p.id === productId);
        if (product) {
            if (invoiceType === 'buy') {
                // For 'buy', add to pawnItems list which allows custom editing
                setPawnItems([...pawnItems, {
                    name: product.name,
                    quantity: 1,
                    price: 0,
                    productId: product.id
                }]);
            } else {
                const price = 0; // Or get from product if available
                setSelectedItems([...selectedItems, { productId, quantity: 1, returnType: 'percentage', price, discount: 0 }]);
            }
        }
        setShowItemDialog(false);
        // Reset filters
        setCategoryFilter('all');
        setMaterialFilters([]);
        setSearchTerm('');
        toast.success('Item added to invoice');
    };

    const removeItemFromInvoice = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const updateInvoiceItemQuantity = (index: number, quantity: number) => {
        const updated = [...selectedItems];
        updated[index].quantity = quantity;
        setSelectedItems(updated);
    };

    const updateInvoiceItemReturnType = (index: number, returnType: 'making-charges' | 'percentage') => {
        const updated = [...selectedItems];
        updated[index].returnType = returnType;
        setSelectedItems(updated);
    };

    const updateInvoiceItemPrice = (index: number, price: number) => {
        const updated = [...selectedItems];
        updated[index].price = price;
        setSelectedItems(updated);
    };

    const updateInvoiceItemDiscount = (index: number, discount: number) => {
        const updated = [...selectedItems];
        updated[index].discount = discount;
        setSelectedItems(updated);
    };

    const calculateInvoiceTotal = () => {
        const subtotal = selectedItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        const totalDiscount = selectedItems.reduce((sum, item) => sum + item.discount, 0);
        const total = subtotal - totalDiscount;
        return { total, totalDiscount, subtotal };
    };

    const handleCreateInvoice = async () => {
        if (!customerName || (invoiceType === 'sales' && selectedItems.length === 0) || ((invoiceType === 'pawn' || invoiceType === 'buy') && pawnItems.length === 0)) {
            toast.error('Please fill customer name and add at least one item');
            return;
        }

        if (invoiceType === 'pawn' && !dueDate) {
            toast.error('Please select a due date for pawn invoice');
            return;
        }

        setIsSubmitting(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invoiceData: any = {
                customerName,
                customerPhone,
                customerAddress,
                type: invoiceType,
                notes,
            };

            if (invoiceType === 'sales') {
                const { total } = calculateInvoiceTotal();
                invoiceData.total = total;
                invoiceData.items = selectedItems.map(item => {
                    const product = dbItems.find(p => p.id === item.productId);
                    return {
                        productId: item.productId,
                        name: product?.name || 'Unknown Product',
                        category: product?.category,
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount,
                        returnType: item.returnType,
                    };
                });
            } else {
                const { total } = calculatePawnTotal();
                invoiceData.total = total;
                if (invoiceType === 'pawn') {
                    invoiceData.dueDate = dueDate || null;
                }
                invoiceData.items = pawnItems.map(item => ({
                    productId: item.productId || null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    discount: 0,
                }));
            }

            const result = await createInvoiceAction(invoiceData);
            if (result.success) {
                toast.success(`Invoice created successfully!`);
                router.push('/invoice');
            } else {
                toast.error(result.error || 'Failed to create invoice');
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold text-amber-50 mb-3 flex items-center gap-3">
                        <Receipt className="size-8 text-amber-400" />
                        Create New Invoice
                        <Badge className={invoiceType === 'buy'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 text-lg px-4 py-1.5'
                            : invoiceType === 'pawn'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-lg px-4 py-1.5'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-lg px-4 py-1.5'
                        }>
                            {invoiceType === 'buy' ? 'Buy' : invoiceType === 'pawn' ? 'Pawn' : 'Sales'}
                        </Badge>
                    </h2>
                    <p className="text-amber-200/60 text-lg">
                        {invoiceType === 'buy'
                            ? 'Fill in details for purchasing items from customers'
                            : invoiceType === 'pawn'
                                ? 'Fill in the details to create a new pawn invoice with custom items'
                                : 'Fill in the details to create a new sales invoice from inventory'
                        }
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/invoice')}
                    variant="outline"
                    className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                >
                    <ArrowLeft className="size-5 mr-2" />
                    Back to Invoices
                </Button>
            </div>

            <div className="space-y-6">
                {/* Customer Info */}
                <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                    <CardHeader>
                        <div className="text-lg font-semibold text-amber-50 flex items-center gap-2">
                            <User className="size-5 text-amber-400" />
                            Customer Information
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm text-amber-200/60 mb-1.5 block">Name *</Label>
                                <Input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter customer name"
                                    className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                            <div>
                                <Label className="text-sm text-amber-200/60 mb-1.5 block">Phone</Label>
                                <Input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-amber-200/60 mb-1.5 block">Address</Label>
                            <Input
                                type="text"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Enter address"
                                className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold text-amber-50 flex items-center gap-2">
                                <ShoppingCart className="size-5 text-amber-400" />
                                Invoice Items
                            </div>
                            <div className="flex gap-2">
                                {invoiceType === 'buy' && (
                                    <>
                                        <Button
                                            onClick={() => setShowHistoryDialog(true)}
                                            variant="outline"
                                            className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                                        >
                                            <Search className="size-4 mr-2" />
                                            Old Invoice
                                        </Button>
                                        <Button
                                            onClick={() => setShowItemDialog(true)}
                                            variant="outline"
                                            className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                                        >
                                            <Diamond className="size-4 mr-2" />
                                            Pick Inventory Item
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={() => {
                                        if (invoiceType === 'sales') {
                                            setShowItemDialog(true);
                                        } else {
                                            addPawnItem();
                                        }
                                    }}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900"
                                >
                                    <Plus className="size-4 mr-2" />
                                    {invoiceType === 'sales' ? 'Add Item' : 'Add Custom Item'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Items Table */}
                        {(invoiceType === 'pawn' || invoiceType === 'buy') ? (
                            pawnItems.length > 0 ? (
                                <div className="border border-amber-500/20 rounded-xl overflow-hidden overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Item</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Qty</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Price</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Total</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pawnItems.map((item, index) => {
                                                const lineTotal = item.price * item.quantity;
                                                return (
                                                    <tr key={index} className="border-t border-amber-500/10">
                                                        <td className="py-3 px-4">
                                                            <Input
                                                                type="text"
                                                                value={item.name}
                                                                onChange={(e) => updatePawnItemName(index, e.target.value)}
                                                                placeholder="Enter item name"
                                                                className="w-full min-w-[200px] px-3 py-2 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 placeholder-amber-200/40 h-9"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity || ''}
                                                                onChange={(e) => updatePawnItemQuantity(index, e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                                className="w-20 px-2 py-1 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 h-9"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.price || ''}
                                                                onChange={(e) => updatePawnItemPrice(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                className="w-28 px-2 py-1 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 h-9"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left text-amber-50 font-medium">
                                                            {lineTotal.toFixed(0)}
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Button
                                                                onClick={() => removePawnItem(index)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-900/50 border-t-2 border-amber-500/30">
                                            <tr>
                                                <td colSpan={3} className="py-2 px-4 text-right text-amber-200/70">
                                                    Subtotal:
                                                </td>
                                                <td className="py-2 px-4 text-left text-amber-50 font-medium">
                                                    {calculatePawnTotal().total.toFixed(0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="py-3 px-4 text-right text-amber-200/70 font-semibold text-lg">
                                                    Total:
                                                </td>
                                                <td className="py-3 px-4 text-left text-amber-400 font-bold text-lg">
                                                    {calculatePawnTotal().total.toFixed(0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-amber-500/20 rounded-xl p-12 text-center">
                                    <ShoppingCart className="size-12 text-amber-400/40 mx-auto mb-4" />
                                    <p className="text-amber-200/60">No items added yet. Click &quot;Add Item&quot; to get started.</p>
                                </div>
                            )
                        ) : (
                            /* Sales Invoice Items Table */
                            selectedItems.length > 0 ? (
                                <div className="border border-amber-500/20 rounded-xl overflow-hidden overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">ID</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Item</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Return Type</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Qty</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Price</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Discount</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Total</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItems.map((item, index) => {
                                                const product = dbItems.find(p => p.id === item.productId);
                                                const lineTotal = (item.price * item.quantity) - item.discount;
                                                return (
                                                    <tr key={index} className="border-t border-amber-500/10">
                                                        <td className="py-3 px-4">
                                                            <div className="text-xs text-amber-200/50">{product?.id.slice(0, 8)}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-amber-50 text-sm">{product ? product.name : 'Unknown Product'}</span>
                                                                {product && <span className="text-xs text-amber-200/50">{product.category}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <Select
                                                                value={item.returnType}
                                                                onValueChange={(value) => updateInvoiceItemReturnType(index, value as 'making-charges' | 'percentage')}
                                                            >
                                                                <SelectTrigger className="w-[160px] bg-slate-900/50 border-amber-500/20 text-amber-50 h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-900 border-amber-500/20">
                                                                    <SelectItem value="making-charges" className="text-amber-50">Making Charges</SelectItem>
                                                                    <SelectItem value="percentage" className="text-amber-50">Percentage</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity || ''}
                                                                onChange={(e) => updateInvoiceItemQuantity(index, e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                                className="w-16 px-2 py-1 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 h-9 text-left"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.price || ''}
                                                                onChange={(e) => updateInvoiceItemPrice(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                className="w-24 px-2 py-1 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 h-9 text-left"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.discount || ''}
                                                                onChange={(e) => updateInvoiceItemDiscount(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                className="w-24 px-2 py-1 bg-slate-900/50 border-amber-500/20 rounded-lg text-amber-50 h-9 text-left"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left text-amber-50 font-medium">
                                                            {lineTotal.toFixed(0)}
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Button
                                                                onClick={() => removeItemFromInvoice(index)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-900/50 border-t-2 border-amber-500/30">
                                            <tr>
                                                <td colSpan={6} className="py-2 px-4 text-right text-amber-200/70">
                                                    Subtotal:
                                                </td>
                                                <td className="py-2 px-4 text-left text-amber-50 font-medium">
                                                    {calculateInvoiceTotal().subtotal.toFixed(0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="py-2 px-4 text-right text-amber-200/70">
                                                    Total Discount:
                                                </td>
                                                <td className="py-2 px-4 text-left text-amber-50 font-medium">
                                                    {calculateInvoiceTotal().totalDiscount.toFixed(0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="py-3 px-4 text-right text-amber-200/70 font-semibold text-lg">
                                                    Total:
                                                </td>
                                                <td className="py-3 px-4 text-left text-amber-400 font-bold text-lg">
                                                    {calculateInvoiceTotal().total.toFixed(0)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-amber-500/20 rounded-xl p-12 text-center">
                                    <ShoppingCart className="size-12 text-amber-400/40 mx-auto mb-4" />
                                    <p className="text-amber-200/60">No items added yet. Click &quot;Add Item&quot; to get started.</p>
                                </div>
                            )
                        )}

                        <Separator className="bg-amber-500/10 my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(invoiceType === 'pawn') && (
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-amber-200/60 ml-1">Due Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-4 pr-4 py-6 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 hover:bg-slate-900/80 hover:text-amber-50 text-left font-normal flex items-center justify-between",
                                                    !dueDate && "text-amber-200/40"
                                                )}
                                            >
                                                {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
                                                <CalendarIcon className="size-5 text-amber-400/60" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-slate-900 border-amber-500/20" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={setDueDate}
                                                initialFocus
                                                className="bg-slate-900 text-amber-50"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                            <div className={invoiceType === 'pawn' ? '' : 'col-span-2'}>
                                <Label className="text-sm text-amber-200/60 mb-1.5 ml-1 block">Notes</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional notes or comments..."
                                    rows={invoiceType === 'pawn' ? 2 : 3}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 resize-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Actions */}
                <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <Button
                                onClick={handleCreateInvoice}
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 py-6 text-lg"
                            >
                                <Receipt className="size-5 mr-2" />
                                {isSubmitting ? 'Creating...' : 'Create Invoice'}
                            </Button>
                            <Button
                                onClick={() => router.push('/invoice')}
                                variant="outline"
                                className="flex-1 border-amber-500/30 text-amber-50 hover:bg-amber-500/10 py-6 text-lg"
                            >
                                <X className="size-5 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Item Dialog */}
            {showItemDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="bg-slate-800/95 backdrop-blur-md border-amber-500/20 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <CardHeader className="border-b border-amber-500/20">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-amber-50 flex items-center gap-2">
                                    <ShoppingCart className="size-5 text-amber-400" />
                                    Select Item to Add
                                </h3>
                                <Button
                                    onClick={() => {
                                        setShowItemDialog(false);
                                        setCategoryFilter('all');
                                        setMaterialFilters([]);
                                        setSearchTerm('');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 flex-1 overflow-auto">
                            {/* Filters */}
                            <div className="mb-6 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-amber-400/60" />
                                    <Input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or ID..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-amber-500/20 rounded-xl text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="flex-1 bg-slate-900/50 border-amber-500/20 text-amber-50 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-amber-500/20">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value} className="text-amber-50">
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex-1">
                                        <MultiSelect
                                            options={materials}
                                            selected={materialFilters}
                                            onChange={setMaterialFilters}
                                            placeholder="Filter by materials"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={fetchFilteredItems}
                                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                    >
                                        Apply Filter
                                    </Button>
                                </div>
                            </div>

                            {!hasSearchedItems && !isSearchingItems ? (
                                <div className="text-center py-16 border border-amber-500/20 rounded-xl bg-slate-900/30 shadow-inner">
                                    <Search className="size-16 text-amber-500/20 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-amber-50/80 mb-2">Ready to Search</h4>
                                    <p className="text-amber-200/40 max-w-xs mx-auto">
                                        Adjust the filters above and click <strong>Apply Filter</strong> to browse inventory.
                                    </p>
                                </div>
                            ) : isSearchingItems ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border border-amber-500/10 rounded-xl bg-slate-900/20">
                                            <Skeleton className="size-10 rounded-lg bg-amber-500/5" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-1/3 bg-amber-500/5" />
                                                <Skeleton className="h-3 w-1/4 bg-amber-500/5" />
                                            </div>
                                            <Skeleton className="h-8 w-16 bg-amber-500/5" />
                                        </div>
                                    ))}
                                </div>
                            ) : dbItems.length > 0 ? (
                                <div className="border border-amber-500/20 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">ID</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Name</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Category</th>
                                                <th className="text-left py-3 px-4 text-amber-200/70 font-medium">Material</th>
                                                <th className="text-center py-3 px-4 text-amber-200/70 font-medium">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dbItems.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="border-t border-amber-500/10 hover:bg-slate-900/50 cursor-pointer transition-colors group"
                                                    onClick={() => addItemToInvoice(product.id)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="text-xs text-amber-200/50">{product.id.slice(0, 8)}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Diamond className="size-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                                                            <span className="text-amber-50 group-hover:text-amber-400 transition-colors font-medium">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                                            {product.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm text-amber-50">{product.material}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge className={product.stock > 10 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : product.stock > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                                            {product.stock}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 border border-amber-500/20 rounded-xl bg-slate-900/30">
                                    <Search className="size-16 text-amber-400/40 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-amber-50 mb-2">No Items Found</h4>
                                    <p className="text-amber-200/60">Try adjusting your filters or search term</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* History Retrieval Dialog */}
            {showHistoryDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="bg-slate-800/95 backdrop-blur-md border-amber-500/20 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <CardHeader className="border-b border-amber-500/20">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-amber-50 flex items-center gap-2">
                                    <Search className="size-5 text-amber-400" />
                                    Retrieve Customer History
                                </h3>
                                <Button
                                    onClick={() => setShowHistoryDialog(false)}
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-500/30 text-amber-50 hover:bg-amber-500/10"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 overflow-auto">
                            <div className="mb-6 flex gap-2">
                                <Input
                                    type="text"
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchHistory()}
                                    placeholder="Enter exact invoice number (e.g. INV-2026-...)"
                                    className="w-full bg-slate-900/50 border-amber-500/20 text-amber-50"
                                />
                                <Button
                                    onClick={handleSearchHistory}
                                    disabled={isSearchingHistory || !historySearchTerm.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                >
                                    {isSearchingHistory ? '...' : <Search className="size-4" />}
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {foundInvoice && (
                                    <div
                                        key={foundInvoice.id}
                                        className="p-4 bg-slate-900/50 border border-amber-500/20 rounded-xl hover:border-amber-500/40 cursor-pointer transition-all"
                                        onClick={() => {
                                            copyFromInvoice(foundInvoice);
                                            setShowHistoryDialog(false);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-amber-50">{foundInvoice.customerName}</div>
                                                <div className="text-sm text-amber-200/50">{foundInvoice.invoiceNumber} • {format(new Date(foundInvoice.createdAt || foundInvoice.date || Date.now()), 'PP')}</div>
                                            </div>
                                            <Badge className="bg-amber-500/20 text-amber-400 capitalize">{foundInvoice.type}</Badge>
                                        </div>
                                        <div className="text-xs text-amber-200/40 line-clamp-1">
                                            Items: {foundInvoice.items.map((i: InvoiceItem) => i.name).join(', ')}
                                        </div>
                                    </div>
                                )}
                                {isSearchingHistory && (
                                    <div className="p-4 bg-slate-900/50 border border-amber-500/10 rounded-xl space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-1/3 bg-amber-500/5" />
                                                <Skeleton className="h-3 w-1/2 bg-amber-500/5" />
                                            </div>
                                            <Skeleton className="h-5 w-16 rounded-full bg-amber-500/5" />
                                        </div>
                                        <Skeleton className="h-3 w-full bg-amber-500/5" />
                                    </div>
                                )}
                                {!foundInvoice && !isSearchingHistory && historySearchTerm.trim() && (
                                    <div className="text-center py-8 text-amber-200/30">
                                        No invoice found with that number.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
