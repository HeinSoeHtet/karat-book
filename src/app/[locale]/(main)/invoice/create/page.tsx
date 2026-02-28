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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/components/ui/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { searchItemsAction } from '@/app/actions/itemActions';
import { createInvoiceAction, getInvoiceByNumberAction } from '@/app/actions/invoiceActions';
import { useSettings } from '@/context/SettingsContext';
import { Suspense } from 'react';
import { Item, Invoice, InvoiceItem } from '@/types';

import { useTranslations, useFormatter } from 'next-intl';

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <CreateInvoiceContent />
        </Suspense>
    );
}

function CreateInvoiceContent() {
    const t = useTranslations('invoice_create');
    const formatIntl = useFormatter();

    const formatWithCommas = (value: string | number) => {
        if (value === undefined || value === null) return '';
        const sValue = value.toString();
        const cleanValue = sValue.replace(/,/g, '');
        if (cleanValue === '') return '';
        if (isNaN(Number(cleanValue))) return sValue;
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceType = (searchParams.get('type') as 'sales' | 'pawn' | 'buy') || 'sales';
    const [dbItems, setDbItems] = useState<Item[]>([]);
    const { categories: dbCategories, materials: dbMaterials, isLoading: isOptionsLoading } = useSettings();

    const [isSearchingItems, setIsSearchingItems] = useState(false);
    const [hasSearchedItems, setHasSearchedItems] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState<Date>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shouldUpdateInventory, setShouldUpdateInventory] = useState(true);

    // Sales invoice items (from inventory)
    const [selectedItems, setSelectedItems] = useState<Array<{
        productId: string;
        name: string;
        category: string;
        quantity: number;
        returnType: 'making-charges' | 'percentage';
        price: number;
        discount: number;
        weight?: number;
    }>>([]);

    // Pawn invoice items (manual entry)
    const [pawnItems, setPawnItems] = useState<Array<{
        name: string;
        quantity: number;
        price: number;
        productId?: string;
        weight?: number;
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
                toast.error(t('invoiceNotFound'));
            }
        } catch (error) {
            console.error('Search failed', error);
            toast.error(t('searchFailed'));
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


    // Pawn item functions
    const addPawnItem = () => {
        setPawnItems([...pawnItems, { name: '', quantity: 1, price: 0, weight: 0 }]);
    };

    const removePawnItem = (index: number) => {
        setPawnItems(pawnItems.filter((_, i) => i !== index));
    };

    const updatePawnItemName = (index: number, name: string) => {
        const updated = [...pawnItems];
        updated[index].name = name;
        // If the name is manually changed, it's no longer linked to the inventory item
        if (updated[index].productId) {
            delete updated[index].productId;
        }
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

    const updatePawnItemWeight = (index: number, weight: number) => {
        const updated = [...pawnItems];
        updated[index].weight = weight;
        setPawnItems(updated);
    };

    const copyFromInvoice = (invoice: Invoice) => {
        if (invoiceType === 'buy' && invoice.type === 'buy') {
            toast.error(t('cannotImportBuy'));
            return;
        }
        if (invoiceType === 'buy' && invoice.status === 'returned') {
            toast.error(t('cannotImportReturned'));
            return;
        }

        setCustomerName(invoice.customerName);
        setCustomerPhone(invoice.customerPhone || '');
        setCustomerAddress(invoice.customerAddress || '');

        const itemsToCopy = (invoice.items || []).map((item: InvoiceItem) => ({
            name: item.name,
            quantity: item.quantity,
            price: 0, // Reset price as requested
            productId: item.itemId, // Keep link if it was an inventory item
            weight: item.weight || 0,
        }));
        setPawnItems(itemsToCopy);
        setShowHistoryDialog(false);
        toast.success(t('copySuccess', { number: invoice.invoiceNumber }));
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
            if (invoiceType === 'sales' && product.stock <= 0) {
                toast.error(t('outOfStock'));
                return;
            }
            if (invoiceType === 'buy' || invoiceType === 'pawn') {
                // For 'buy' and 'pawn', add to pawnItems list which allows custom editing
                setPawnItems([...pawnItems, {
                    name: product.name,
                    quantity: 1,
                    price: 0,
                    productId: product.id,
                    weight: product.weight
                }]);
            } else {
                const price = 0; // Or get from product if available
                setSelectedItems([...selectedItems, {
                    productId,
                    name: product.name,
                    category: product.category,
                    quantity: 1,
                    returnType: 'percentage',
                    price,
                    discount: 0,
                    weight: product.weight
                }]);
            }
        }
        setShowItemDialog(false);
        // Reset filters
        setCategoryFilter('all');
        setMaterialFilters([]);
        setSearchTerm('');
        toast.success(t('addItem'));
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

    const updateInvoiceItemWeight = (index: number, weight: number) => {
        const updated = [...selectedItems];
        updated[index].weight = weight;
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
            toast.error(t('enterCustomerAndItem'));
            return;
        }

        // Validate items
        if (invoiceType === 'sales') {
            const hasInvalidItems = selectedItems.some(item =>
                !item.weight ||
                item.weight <= 0 ||
                !item.quantity ||
                item.quantity <= 0 ||
                !item.price ||
                item.price <= 0
            );
            if (hasInvalidItems) {
                toast.error(t('fillAllItemFields'));
                return;
            }
        } else {
            const hasInvalidItems = pawnItems.some(item =>
                !item.name?.trim() ||
                !item.weight ||
                item.weight <= 0 ||
                !item.quantity ||
                item.quantity <= 0 ||
                !item.price ||
                item.price <= 0
            );
            if (hasInvalidItems) {
                toast.error(t('fillAllItemFields'));
                return;
            }
        }

        if (invoiceType === 'pawn' && !dueDate) {
            toast.error(t('selectPawnDueDate'));
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
                invoiceData.items = selectedItems.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount,
                    returnType: item.returnType,
                    weight: item.weight,
                }));
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
                    weight: item.weight,
                }));
                if (invoiceType === 'buy') {
                    invoiceData.skipStockUpdate = !shouldUpdateInventory;
                }
            }

            const result = await createInvoiceAction(invoiceData);
            if (result.success) {
                toast.success(t('invoiceCreated'));
                router.push('/invoice');
            } else {
                toast.error(result.error || t('error'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3 flex items-center flex-wrap gap-2 sm:gap-3">
                        <Receipt className="size-6 sm:size-8 text-primary" />
                        {t('title')}
                        <Badge className={cn("text-white border-none py-1 sm:py-1.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-widest",
                            invoiceType === 'buy'
                                ? 'bg-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                                : invoiceType === 'pawn'
                                    ? 'bg-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'bg-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                        )}>
                            {invoiceType === 'buy' ? t('buy') : invoiceType === 'pawn' ? t('pawn') : t('sales')}
                        </Badge>
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-lg">
                        {invoiceType === 'buy'
                            ? t('buyDescription')
                            : invoiceType === 'pawn'
                                ? t('pawnDescription')
                                : t('salesDescription')
                        }
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/invoice')}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted w-full sm:w-auto font-bold"
                >
                    <ArrowLeft className="size-5 mr-2" />
                    {t('backToInvoices')}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Customer Info */}
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader>
                        <div className="text-lg font-bold text-foreground flex items-center gap-2">
                            <User className="size-5 text-primary" />
                            {t('customerInfo')}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t('name')} *</Label>
                                <Input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder={t('namePlaceholder')}
                                    className="w-full pl-4 pr-4 py-3 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t('phone')}</Label>
                                <Input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder={t('phonePlaceholder')}
                                    className="w-full pl-4 pr-4 py-3 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t('address')}</Label>
                            <Input
                                type="text"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder={t('addressPlaceholder')}
                                className="w-full pl-4 pr-4 py-3 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                <ShoppingCart className="size-5 text-primary" />
                                {t('invoiceItems')}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    {(invoiceType === 'buy' || invoiceType === 'pawn') && (
                                        <>
                                            <Button
                                                onClick={() => setShowHistoryDialog(true)}
                                                variant="outline"
                                                className="border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-10 text-xs px-3 font-bold transition-all"
                                            >
                                                <Search className="size-4 mr-2 text-primary" />
                                                {t('oldInvoice')}
                                            </Button>
                                            <Button
                                                onClick={() => setShowItemDialog(true)}
                                                variant="outline"
                                                className="border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-10 text-xs px-3 font-bold transition-all"
                                            >
                                                <Diamond className="size-4 mr-2 text-primary" />
                                                {t('pickInventoryItem')}
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
                                        className="bg-primary hover:brightness-95 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground h-10 text-xs px-4 font-bold shadow-lg shadow-primary/20 transition-all duration-200"
                                    >
                                        <Plus className="size-4 mr-2" />
                                        {invoiceType === 'sales' ? t('addItem') : t('addCustomItem')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Items Table */}
                        {(invoiceType === 'pawn' || invoiceType === 'buy') ? (
                            pawnItems.length > 0 ? (
                                <>
                                    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto bg-muted/30">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('itemName')} *</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('weight')} *</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('qty')} *</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('price')} *</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('total')}</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pawnItems.map((item, index) => {
                                                    const lineTotal = item.price * item.quantity;
                                                    return (
                                                        <tr key={index} className="border-t border-border transition-colors hover:bg-muted/20">
                                                            <td className="py-3 px-4">
                                                                <Input
                                                                    type="text"
                                                                    value={item.name}
                                                                    onChange={(e) => updatePawnItemName(index, e.target.value)}
                                                                    placeholder={t('itemPlaceholder')}
                                                                    className="w-full min-w-[200px] px-3 py-2 bg-card border-border rounded-lg text-foreground placeholder:text-foreground/40 h-9 font-medium"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4 text-left">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={item.weight || ''}
                                                                    onChange={(e) => updatePawnItemWeight(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                    className="w-20 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4 text-left">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity || ''}
                                                                    onChange={(e) => updatePawnItemQuantity(index, e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                                    className="w-16 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4 text-left">
                                                                <Input
                                                                    type="text"
                                                                    value={formatWithCommas(item.price)}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/,/g, '');
                                                                        if (val === '' || !isNaN(Number(val)) || val === '.') {
                                                                            updatePawnItemPrice(index, val === '' ? 0 : parseFloat(val));
                                                                        }
                                                                    }}
                                                                    className="w-28 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4 text-left text-foreground font-bold">
                                                                {formatIntl.number(lineTotal)}
                                                            </td>
                                                            <td className="py-3 px-4 text-left">
                                                                <Button
                                                                    onClick={() => removePawnItem(index)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-muted/50 border-t-2 border-border">
                                                <tr>
                                                    <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                        {t('subtotal')}:
                                                    </td>
                                                    <td className="py-2 px-4 text-left text-foreground font-bold">
                                                        {formatIntl.number(calculatePawnTotal().total)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="py-3 px-4 text-right text-foreground font-bold text-xl">
                                                        {t('total')}:
                                                    </td>
                                                    <td className="py-3 px-4 text-left text-primary font-bold text-2xl drop-shadow-sm">
                                                        {formatIntl.number(calculatePawnTotal().total)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    {invoiceType === 'buy' && (
                                        <div className="mt-4 flex justify-end">
                                            <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-xl border border-blue-500/20 shadow-lg">
                                                <Checkbox
                                                    id="shouldUpdateInventory"
                                                    checked={shouldUpdateInventory}
                                                    onCheckedChange={(checked) => setShouldUpdateInventory(!!checked)}
                                                    className="border-blue-500/50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white h-5 w-5"
                                                />
                                                <Label
                                                    htmlFor="shouldUpdateInventory"
                                                    className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-700 dark:text-blue-300 cursor-pointer"
                                                >
                                                    {t('refillStock')}
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="border border-border rounded-xl p-12 text-center bg-muted/20">
                                    <ShoppingCart className="size-12 text-muted/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium text-xs">{t('noItems')}</p>
                                </div>
                            )
                        ) : (
                            /* Sales Invoice Items Table */
                            selectedItems.length > 0 ? (
                                <div className="border border-border rounded-xl overflow-hidden overflow-x-auto bg-muted/30">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('itemName')}</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('returnType')}</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('weight')} *</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('qty')} *</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('price')} *</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('discount')}</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('total')}</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground text-xs font-bold uppercase tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItems.map((item, index) => {
                                                const lineTotal = (item.price * item.quantity) - item.discount;
                                                return (
                                                    <tr key={index} className="border-t border-border transition-colors hover:bg-muted/20">
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-foreground text-sm font-bold">{item.name}</span>
                                                                <span className="text-xs text-muted-foreground font-medium">{item.category}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <Select
                                                                value={item.returnType}
                                                                onValueChange={(value) => updateInvoiceItemReturnType(index, value as 'making-charges' | 'percentage')}
                                                            >
                                                                <SelectTrigger className="w-[160px] bg-card border-border text-foreground h-9 font-medium">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-card border-border">
                                                                    <SelectItem value="making-charges" className="text-foreground">{t('makingCharges')}</SelectItem>
                                                                    <SelectItem value="percentage" className="text-foreground">{t('percentage')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={item.weight || ''}
                                                                onChange={(e) => updateInvoiceItemWeight(index, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                className="w-20 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity || ''}
                                                                onChange={(e) => updateInvoiceItemQuantity(index, e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                                className="w-16 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="text"
                                                                value={formatWithCommas(item.price)}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/,/g, '');
                                                                    if (val === '' || !isNaN(Number(val)) || val === '.') {
                                                                        updateInvoiceItemPrice(index, val === '' ? 0 : parseFloat(val));
                                                                    }
                                                                }}
                                                                className="w-24 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Input
                                                                type="text"
                                                                value={formatWithCommas(item.discount)}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/,/g, '');
                                                                    if (val === '' || !isNaN(Number(val)) || val === '.') {
                                                                        updateInvoiceItemDiscount(index, val === '' ? 0 : parseFloat(val));
                                                                    }
                                                                }}
                                                                className="w-24 px-2 py-1 bg-card border-border rounded-lg text-foreground h-9 font-bold text-center"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 text-left text-foreground font-bold">
                                                            {formatIntl.number(lineTotal)}
                                                        </td>
                                                        <td className="py-3 px-4 text-left">
                                                            <Button
                                                                onClick={() => removeItemFromInvoice(index)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-muted/50 border-t-2 border-border">
                                            <tr>
                                                <td colSpan={6} className="py-2 px-4 text-right text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                    {t('subtotal')}:
                                                </td>
                                                <td className="py-2 px-4 text-left text-foreground font-bold">
                                                    {formatIntl.number(calculateInvoiceTotal().subtotal)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="py-2 px-4 text-right text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                    {t('totalDiscount')}:
                                                </td>
                                                <td className="py-2 px-4 text-left text-rose-600 dark:text-rose-400 font-bold">
                                                    {formatIntl.number(calculateInvoiceTotal().totalDiscount)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="py-3 px-4 text-right text-foreground font-bold text-xl">
                                                    {t('totalAmount')}:
                                                </td>
                                                <td className="py-3 px-4 text-left text-primary font-bold text-2xl drop-shadow-sm">
                                                    {formatIntl.number(calculateInvoiceTotal().total)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl p-12 text-center bg-muted/20">
                                    <ShoppingCart className="size-12 text-muted/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium text-xs">{t('noItems')}</p>
                                </div>
                            )
                        )}

                        <Separator className="bg-border my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(invoiceType === 'pawn') && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground mb-1.5 ml-1 block">{t('pickDueDate')} *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-4 pr-4 py-6 bg-muted/50 border-border rounded-xl text-foreground hover:bg-muted hover:text-foreground text-left font-bold flex items-center justify-between",
                                                    !dueDate && "text-muted-foreground/50"
                                                )}
                                            >
                                                {dueDate ? formatIntl.dateTime(dueDate, { year: 'numeric', month: 'long', day: 'numeric' }) : <span>{t('pickDueDate')}</span>}
                                                <CalendarIcon className="size-5 text-primary" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={setDueDate}
                                                initialFocus
                                                className="bg-card text-foreground"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                            <div className={invoiceType === 'pawn' ? '' : 'col-span-2'}>
                                <Label className="text-xs font-bold text-muted-foreground mb-1.5 ml-1 block">{t('notes')}</Label>
                                <Textarea
                                    value={notes || ''}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('notesPlaceholder')}
                                    rows={invoiceType === 'pawn' ? 2 : 3}
                                    className="w-full px-4 py-3 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Actions */}
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleCreateInvoice}
                                disabled={isSubmitting}
                                className="flex-1 bg-primary hover:brightness-95 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground h-12 sm:h-14 text-base sm:text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-200"
                            >
                                <Receipt className="size-5 mr-2" />
                                {isSubmitting ? t('creating') : t('createInvoice')}
                            </Button>
                            <Button
                                onClick={() => router.push('/invoice')}
                                variant="outline"
                                className="flex-1 border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-12 sm:h-14 text-base sm:text-lg font-bold transition-all active:scale-[0.98]"
                            >
                                <X className="size-5 mr-2 text-rose-500" />
                                {t('cancel')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Item Dialog */}
            {showItemDialog && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="bg-card/95 backdrop-blur-md border-border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <CardHeader className="p-4 sm:p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                                    <ShoppingCart className="size-5 text-primary" />
                                    {t('selectItem')}
                                </h3>
                                <Button
                                    onClick={() => {
                                        setShowItemDialog(false);
                                        setCategoryFilter('all');
                                        setMaterialFilters([]);
                                        setSearchTerm('');
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 flex-1 overflow-auto">
                            {/* Filters */}
                            <div className="mb-6 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
                                    <Input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={t('searchItems')}
                                        className="w-full pl-10 pr-4 py-3 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="flex-1 bg-muted/50 border-border text-foreground h-11 font-bold">
                                            <SelectValue placeholder={t('selectCategory')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border">
                                            <SelectItem value="all" className="text-foreground font-medium">{t('allCategories')}</SelectItem>
                                            {dbCategories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-foreground font-medium">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="w-full sm:w-[280px]">
                                        <MultiSelect
                                            options={dbMaterials.map(m => ({ label: m.name, value: m.id }))}
                                            selected={materialFilters}
                                            onChange={setMaterialFilters}
                                            placeholder={t('selectMaterials')}
                                            className="bg-muted/50 border-border text-foreground font-bold"
                                        />
                                    </div>

                                    <Button
                                        onClick={fetchFilteredItems}
                                        disabled={isSearchingItems}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 h-11 font-black uppercase tracking-widest px-6"
                                    >
                                        <Search className="size-4" />
                                        {t('search')}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-border mb-6" />

                            {/* Item List */}
                            {isSearchingItems ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-20 w-full bg-muted/50 rounded-xl" />
                                    ))}
                                </div>
                            ) : dbItems.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {dbItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-muted/30 border border-border rounded-xl hover:border-primary/30 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground font-bold">{item.name}</span>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg font-bold">{item.id}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium mt-1">
                                                    <span>{item.category}</span>
                                                    <span>•</span>
                                                    <span>{item.material}</span>
                                                    <span>•</span>
                                                    <span className={item.stock <= 2 ? 'text-rose-500' : ''}>
                                                        {item.stock} {t('units')}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => addItemToInvoice(item.id)}
                                                disabled={invoiceType === 'sales' && item.stock <= 0}
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "border-primary/20 text-primary hover:bg-primary/10 transition-all font-bold",
                                                    invoiceType === 'sales' && item.stock <= 0 ? "opacity-50 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {invoiceType === 'sales' && item.stock <= 0 ? t('outOfStock') : t('add')}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : hasSearchedItems ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground font-medium text-xs">{t('noItemsFound')}</p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingCart className="size-12 text-muted/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground/60 font-bold uppercase tracking-widest text-xs">{t('search')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Old Invoice History Dialog */}
            {showHistoryDialog && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="bg-card/95 backdrop-blur-md border-border w-full max-w-2xl shadow-2xl">
                        <CardHeader className="p-4 sm:p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                                    <Search className="size-5 text-primary" />
                                    {t('oldInvoice')}
                                </h3>
                                <Button
                                    onClick={() => {
                                        setShowHistoryDialog(false);
                                        setFoundInvoice(null);
                                        setHistorySearchTerm('');
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
                                        <Input
                                            type="text"
                                            value={historySearchTerm}
                                            onChange={(e) => setHistorySearchTerm(e.target.value)}
                                            placeholder={t('searchPlaceholder')}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchHistory()}
                                            className="w-full pl-10 pr-4 h-11 bg-muted/50 border-border rounded-xl text-foreground placeholder:text-foreground/40 font-medium"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearchHistory}
                                        disabled={isSearchingHistory}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 font-bold shadow-lg shadow-primary/20"
                                    >
                                        {t('search')}
                                    </Button>
                                </div>

                                {foundInvoice ? (
                                    <div className="p-5 bg-muted/30 border border-border rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                                            <div>
                                                <h4 className="text-lg font-bold text-foreground">{foundInvoice.customerName}</h4>
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                    {foundInvoice.invoiceNumber} • {t(foundInvoice.type)}
                                                </p>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground font-medium">
                                                {formatIntl.dateTime(new Date(foundInvoice.createdAt || new Date()), { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2 mb-6">
                                            {foundInvoice.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm py-2 border-b border-border/10 last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                                                    <span className="text-foreground font-medium">{item.name}</span>
                                                    <span className="text-foreground/70 font-bold">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => copyFromInvoice(foundInvoice!)}
                                            disabled={invoiceType === 'buy' && (foundInvoice.type === 'buy' || foundInvoice.status === 'returned')}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl shadow-xl shadow-primary/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {invoiceType === 'buy' && foundInvoice.type === 'buy'
                                                ? t('cannotImportBuy')
                                                : (invoiceType === 'buy' && foundInvoice.status === 'returned')
                                                    ? t('cannotImportReturned')
                                                    : t('apply')}
                                        </Button>
                                    </div>
                                ) : historySearchTerm && !isSearchingHistory && (
                                    <div className="text-center py-10 px-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <p className="text-muted-foreground font-medium text-xs">
                                            {t('noItemsFound')}
                                        </p>
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
