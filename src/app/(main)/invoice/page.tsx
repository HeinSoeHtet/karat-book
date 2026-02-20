"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getInvoicesAction, updateInvoiceStatusAction } from '@/app/actions/invoiceActions';
import { Invoice } from '@/types';
import { SITE_CONFIG } from '@/lib/config';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Separator } from '@/components/ui/separator';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
    Receipt,
    Printer,
    Download,
    Filter,
    Calendar,
    User,
    Phone,
    MapPin,
    Diamond,
    Sparkles,
    Plus,
    Mail,
    ShoppingCart,
    HandCoins,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';



export default function InvoicePage() {
    const router = useRouter();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showInvoiceTypeDialog, setShowInvoiceTypeDialog] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const invoicesPerPage = 5;

    // --- Premium PDF Template Generation ---
    const generateInvoiceHTML = (invoice: Invoice) => {
        const totalDiscount = invoice.items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const itemRows = invoice.items.map(item => `
            <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 12px 16px; text-align: left;">
                    <div style="font-weight: 600; color: #000;">${item.name}</div>
                    <div style="font-size: 11px; color: #666;">${item.category || 'N/A'}</div>
                </td>
                <td style="padding: 12px 16px; text-align: center; color: #000;">${item.quantity}</td>
                <td style="padding: 12px 16px; text-align: right; color: #000;">${item.price.toFixed(0)}</td>
                ${invoice.type !== 'buy' ? `<td style="padding: 12px 16px; text-align: right; color: #000;">${(item.discount || 0) > 0 ? `-${(item.discount || 0).toFixed(0)}` : '0'}</td>` : ''}
                <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #000;">${item.total.toFixed(0)}</td>
            </tr>
        `).join('');

        return `
            <div style="padding: 60px; background: white; color: black; font-family: 'Helvetica', 'Arial', sans-serif; width: 750px;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 50px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: #000; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l3 12"/><path d="M13 3l3 6-3 12"/><path d="M2.3 9h19.4"/></svg>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${SITE_CONFIG.name}</h1>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${invoice.invoiceNumber}</p>
                                <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; background: #000; color: #fff; padding: 2px 8px; border-radius: 40px; letter-spacing: 0.5px;">${invoice.type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info Grid -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #000; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Customer Information
                        </div>
                        <div style="font-size: 20px; font-weight: bold; color: #000; margin-bottom: 8px;">${invoice.customerName}</div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #444; font-size: 14px; margin-bottom: 5px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            ${invoice.customerPhone || 'N/A'}
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 8px; color: #444; font-size: 14px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span style="max-width: 250px; line-height: 1.4;">${invoice.customerAddress || 'N/A'}</span>
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 20px;">
                        <div style="text-align: right;">
                            <div style="color: #666; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px;">Issue Date</div>
                            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 15px; font-weight: 600; color: #000;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                                ${format(invoice.date, 'MMMM dd, yyyy')}
                            </div>
                        </div>
                        ${invoice.dueDate ? `
                        <div style="text-align: right;">
                            <div style="color: #666; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px;">Due Date</div>
                            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 15px; font-weight: 600; color: #000;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                                ${format(invoice.dueDate, 'MMMM dd, yyyy')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Table Container -->
                <div style="border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f8f8;">
                                <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; font-weight: 500;">Item Details</th>
                                <th style="padding: 12px 16px; text-align: center; font-size: 12px; text-transform: uppercase; width: 60px; color: #666; font-weight: 500;">Qty</th>
                                <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; width: 100px; color: #666; font-weight: 500;">Price</th>
                                ${invoice.type !== 'buy' ? `<th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; width: 100px; color: #666; font-weight: 500;">Discount</th>` : ''}
                                <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; width: 100px; color: #666; font-weight: 500;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                        <tfoot style="background: #f8f8f8; border-top: 2px solid #ddd;">
                            <tr>
                                <td colspan="${invoice.type !== 'buy' ? 4 : 3}" style="padding: 10px 16px; text-align: right; color: #666; font-size: 14px;">Subtotal:</td>
                                <td style="padding: 10px 16px; text-align: right; font-weight: 600; color: #000;">${subtotal.toFixed(0)}</td>
                            </tr>
                            ${(totalDiscount > 0 && invoice.type !== 'buy') ? `
                            <tr>
                                <td colspan="4" style="padding: 10px 16px; text-align: right; color: #666; font-size: 14px;">Total Discount:</td>
                                <td style="padding: 10px 16px; text-align: right; font-weight: 600; color: #000;">-${totalDiscount.toFixed(0)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td colspan="${invoice.type !== 'buy' ? 4 : 3}" style="padding: 16px; text-align: right; font-size: 18px; font-weight: bold; text-transform: uppercase; color: #000;">Total Amount</td>
                                <td style="padding: 16px; text-align: right; font-size: 24px; font-weight: bold; color: #000;">${invoice.total.toFixed(0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                ${invoice.notes ? `
                <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                    <div style="color: #000; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Notes</div>
                    <p style="margin: 0; font-size: 13px; color: #444; line-height: 1.5;">${invoice.notes}</p>
                </div>
                ` : ''}

            </div>
        `;
    };

    const processPdfGeneration = async (invoice: Invoice): Promise<{ pdf: jsPDF, fileName: string } | null> => {
        const container = document.createElement('div');
        // Ensure the container is in the DOM but hidden from view
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '750px';
        container.innerHTML = generateInvoiceHTML(invoice);
        document.body.appendChild(container);

        try {
            // Give the browser time to paint the new element
            await new Promise(resolve => setTimeout(resolve, 300));

            const targetElement = container.querySelector('div') as HTMLElement;
            if (!targetElement) throw new Error('Failed to find template element');

            const dataUrl = await toPng(targetElement, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            document.body.removeChild(container);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return { pdf, fileName: `invoice-${invoice.invoiceNumber}.pdf` };
        } catch (e) {
            if (document.body.contains(container)) document.body.removeChild(container);
            console.error('PDF Generation Error:', e);
            throw e;
        }
    };

    // --- UI Filters Implementation ---
    const [idFilter, setIdFilter] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'sales' | 'pawn' | 'buy'>('all');
    const [dueDateRange, setDueDateRange] = useState<DateRange | undefined>();

    const [appliedIdFilter, setAppliedIdFilter] = useState('');
    const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();
    const [appliedInvoiceTypeFilter, setAppliedInvoiceTypeFilter] = useState<'all' | 'sales' | 'pawn' | 'buy'>('all');
    const [appliedDueDateRange, setAppliedDueDateRange] = useState<DateRange | undefined>();

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            setIsLoading(true);
            const result = await getInvoicesAction();
            if (result.success && result.data) {
                setInvoices(result.data.map((inv) => ({
                    ...inv,
                    date: new Date(inv.createdAt || Date.now()),
                    dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
                })) as Invoice[]);
            } else {
                toast.error('Failed to load invoices');
            }
            setIsLoading(false);
        };
        fetchInvoices();
    }, []);

    const handleApplyFilters = () => {
        setAppliedIdFilter(idFilter);
        setAppliedDateRange(dateRange);
        setAppliedInvoiceTypeFilter(invoiceTypeFilter);
        setAppliedDueDateRange(dueDateRange);
        setSelectedInvoice(null);
        setCurrentPage(1);
    };

    const handleStatusChange = (newStatus: string) => {
        if (!selectedInvoice) return;
        setPendingStatus(newStatus);
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!selectedInvoice || !pendingStatus) return;

        const loadingToast = toast.loading('Updating status...');
        try {
            const result = await updateInvoiceStatusAction(selectedInvoice.id, pendingStatus);
            if (result.success) {
                toast.success('Status updated successfully');
                // Update local state
                setInvoices(prev => prev.map(inv =>
                    inv.id === selectedInvoice.id ? { ...inv, status: pendingStatus as any } : inv
                ));
                setSelectedInvoice(prev => prev ? { ...prev, status: pendingStatus as any } : null);
            } else {
                toast.error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Status Update Error:', error);
            toast.error('An error occurred while updating status');
        } finally {
            toast.dismiss(loadingToast);
            setIsStatusConfirmOpen(false);
            setPendingStatus(null);
        }
    };

    const handleClearFilters = () => {
        setIdFilter('');
        setDateRange(undefined);
        setInvoiceTypeFilter('all');
        setDueDateRange(undefined);
        setAppliedDueDateRange(undefined);
        setSelectedInvoice(null);
        setCurrentPage(1);
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (appliedIdFilter && !invoice.invoiceNumber.toLowerCase().includes(appliedIdFilter.toLowerCase())) return false;
        if (appliedDateRange?.from) {
            const start = startOfDay(appliedDateRange.from);
            const end = appliedDateRange.to ? endOfDay(appliedDateRange.to) : endOfDay(appliedDateRange.from);
            if (!isWithinInterval(invoice.date, { start, end })) return false;
        }
        if (appliedInvoiceTypeFilter !== 'all' && invoice.type !== appliedInvoiceTypeFilter) return false;
        if (appliedDueDateRange?.from) {
            if (!invoice.dueDate) return false;
            const start = startOfDay(appliedDueDateRange.from);
            const end = appliedDueDateRange.to ? endOfDay(appliedDueDateRange.to) : endOfDay(appliedDueDateRange.from);
            if (!isWithinInterval(invoice.dueDate, { start, end })) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * invoicesPerPage,
        currentPage * invoicesPerPage
    );

    const handlePrint = async (invoice: Invoice) => {
        setIsGenerating(true);
        const loadingToast = toast.loading('Preparing premium B&W print document...');
        try {
            const result = await processPdfGeneration(invoice);
            if (result) {
                result.pdf.autoPrint();
                window.open(result.pdf.output('bloburl'), '_blank');
                toast.success('Print dialog opened');
            }
        } catch (error) {
            console.error('Print Error:', error);
            toast.error('Failed to prepare print');
        } finally {
            setIsGenerating(false);
            toast.dismiss(loadingToast);
        }
    };

    const handleDownload = async (invoice: Invoice) => {
        setIsGenerating(true);
        const loadingToast = toast.loading('Generating premium B&W PDF...');
        try {
            const result = await processPdfGeneration(invoice);
            if (result) {
                result.pdf.save(result.fileName);
                toast.success('Invoice downloaded');
            }
        } catch (error) {
            console.error('Download Error:', error);
            toast.error('Failed to download invoice');
        } finally {
            setIsGenerating(false);
            toast.dismiss(loadingToast);
        }
    };


    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                        <Receipt className="size-6 sm:size-8 text-amber-400" />
                        Invoices
                    </h2>
                    <p className="text-amber-200/60 text-xs sm:text-lg">View and manage customer invoices</p>
                </div>

                <Button
                    onClick={() => setShowInvoiceTypeDialog(true)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold shadow-lg shadow-amber-500/30 w-full sm:w-auto"
                >
                    <Plus className="size-5 mr-2" />
                    Create Invoice
                </Button>
            </div>

            {/* Filters Top Bar */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20 mb-6 sm:mb-8">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider ml-1">Invoice ID</Label>
                            <Input
                                placeholder="Search..."
                                value={idFilter}
                                onChange={(e) => setIdFilter(e.target.value)}
                                className="bg-slate-900/50 border-amber-500/20 text-amber-50 h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider ml-1">Type</Label>
                            <Select value={invoiceTypeFilter} onValueChange={(value) => setInvoiceTypeFilter(value as 'all' | 'sales' | 'pawn' | 'buy')}>
                                <SelectTrigger className="bg-slate-900/50 border-amber-500/20 text-amber-50 h-10 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-amber-500/20">
                                    <SelectItem value="all" className="text-amber-50">All Types</SelectItem>
                                    <SelectItem value="sales" className="text-amber-50">Sales</SelectItem>
                                    <SelectItem value="pawn" className="text-amber-50">Pawn</SelectItem>
                                    <SelectItem value="buy" className="text-amber-50">Buy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                            <Label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider ml-1">Date Range</Label>
                            <DateRangePicker
                                id="top-invoice-date-range"
                                date={dateRange}
                                setDate={setDateRange}
                                placeholder="Select range"
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                            <Label className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider ml-1">Due Date</Label>
                            <DateRangePicker
                                id="top-due-date-range"
                                date={dueDateRange}
                                setDate={setDueDateRange}
                                placeholder="Select range"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleApplyFilters}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 h-10 text-sm"
                            >
                                <Filter className="size-4 mr-2" />
                                Apply
                            </Button>
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                                className="px-3 border-amber-500/30 text-amber-50 hover:bg-amber-500/10 h-10"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Invoice List */}
                <div className={`lg:col-span-4 flex flex-col gap-4 ${selectedInvoice ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Invoice Cards */}
                    <div className="space-y-4 flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 border border-amber-500/10 rounded-xl gap-4">
                                <div className="size-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                <p className="text-amber-200/60 font-medium">Loading invoices...</p>
                            </div>
                        ) : paginatedInvoices.length > 0 ? (
                            <>
                                {paginatedInvoices.map((invoice) => {
                                    return (
                                        <Card
                                            key={invoice.id}
                                            onClick={() => setSelectedInvoice(invoice)}
                                            className={`cursor-pointer transition-all hover:border-amber-500/40 ${selectedInvoice?.id === invoice.id
                                                ? 'bg-slate-700/50 border-amber-500/40'
                                                : 'bg-slate-800/30 border-amber-500/20'
                                                }`}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="font-semibold text-amber-50">{invoice.invoiceNumber}</div>
                                                    <Badge className={`text-[10px] px-2 py-0 h-4 uppercase font-bold tracking-wider ${invoice.type === 'sales'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : invoice.type === 'pawn'
                                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        }`}>
                                                        {invoice.type}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-amber-200/70 mb-1">{invoice.customerName}</div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-amber-200/50 flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {format(invoice.date, 'MMM dd, yyyy')}
                                                        <span className="mx-1">•</span>
                                                        <span className={`capitalize ${['active', 'paid', 'redeemed'].includes(invoice.status) ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                            {invoice.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-amber-400">
                                                        {invoice.total.toFixed(0)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-2 py-4 border-t border-amber-500/10">
                                        <div className="text-xs text-amber-200/40 font-medium">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    setCurrentPage(p => Math.max(1, p - 1));
                                                    setSelectedInvoice(null);
                                                }}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 border-amber-500/20 bg-slate-800/50 text-amber-50 hover:bg-amber-500/10 disabled:opacity-30"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                                    setSelectedInvoice(null);
                                                }}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 border-amber-500/20 bg-slate-800/50 text-amber-50 hover:bg-amber-500/10 disabled:opacity-30"
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-slate-800/20 border border-amber-500/10 rounded-xl">
                                <Receipt className="size-12 text-amber-500/20 mx-auto mb-4" />
                                <p className="text-amber-200/60 font-medium">No invoices found</p>
                                <p className="text-amber-200/40 text-sm mt-1">Adjust your filters or create a new one</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Detail */}
                <div className={`lg:col-span-8 ${selectedInvoice ? 'block' : 'hidden lg:block'}`}>
                    {selectedInvoice ? (
                        <div className="space-y-4">
                            <Button
                                onClick={() => setSelectedInvoice(null)}
                                variant="ghost"
                                className="lg:hidden text-amber-200/60 hover:text-amber-200 mb-2"
                            >
                                <ChevronLeft className="size-5 mr-1" />
                                Back to Invoices
                            </Button>
                            <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                                <CardHeader className="p-4 sm:p-6 lg:p-8">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg blur-sm opacity-75"></div>
                                                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-2 sm:p-3 rounded-lg">
                                                    <Diamond className="size-5 sm:size-6 text-slate-900" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-bold text-amber-50 flex items-center gap-2">
                                                    {SITE_CONFIG.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-amber-200/60">{SITE_CONFIG.tagline}</p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <div className="text-xl sm:text-2xl font-bold text-amber-400">{selectedInvoice.invoiceNumber}</div>
                                            <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-1">
                                                <Badge className={`uppercase text-[10px] sm:text-xs font-bold tracking-wider ${selectedInvoice.type === 'sales'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                    : selectedInvoice.type === 'pawn'
                                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                    }`}>
                                                    {selectedInvoice.type} Invoice
                                                </Badge>

                                                {(selectedInvoice.type === 'pawn' || selectedInvoice.type === 'sales') ? (
                                                    <Select
                                                        value={selectedInvoice.status}
                                                        onValueChange={handleStatusChange}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-8 bg-slate-900/50 border-amber-500/20 text-xs text-amber-50">
                                                            <SelectValue placeholder="Change Status" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-amber-500/20">
                                                            {selectedInvoice.type === 'pawn' ? (
                                                                <>
                                                                    <SelectItem value="active" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="size-3 text-amber-400" />
                                                                            Active
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="overdue" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <AlertCircle className="size-3 text-red-400" />
                                                                            Overdue
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="expired" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <X className="size-3 text-slate-400" />
                                                                            Expired
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="redeemed" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle2 className="size-3 text-emerald-400" />
                                                                            Redeemed
                                                                        </div>
                                                                    </SelectItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <SelectItem value="paid" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle2 className="size-3 text-emerald-400" />
                                                                            Paid
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="partially_paid" className="text-amber-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="size-3 text-amber-400" />
                                                                            Partially Paid
                                                                        </div>
                                                                    </SelectItem>
                                                                </>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-500/20 text-amber-200/60 text-[10px] uppercase">
                                                        Status: {selectedInvoice.status.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
                                    {/* Top Header Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                                                <User className="size-3" />
                                                Customer Information
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-lg sm:text-xl font-bold text-amber-50">{selectedInvoice.customerName}</div>
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-200/60">
                                                    <Phone className="size-3.5" />
                                                    {selectedInvoice.customerPhone || 'N/A'}
                                                </div>
                                                <div className="flex items-start gap-2 text-xs sm:text-sm text-amber-200/60">
                                                    <MapPin className="size-3.5 mt-0.5" />
                                                    <span className="max-w-[200px]">{selectedInvoice.customerAddress || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start sm:items-end gap-4 sm:gap-6">
                                            <div className="text-left sm:text-right space-y-1">
                                                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest block">Issue Date</span>
                                                <div className="flex items-center sm:justify-end gap-2 text-amber-50 text-xs sm:text-base">
                                                    <Calendar className="size-3.5 sm:size-4 text-amber-400" />
                                                    {format(selectedInvoice.date, 'MMMM dd, yyyy')}
                                                </div>
                                            </div>

                                            {selectedInvoice.dueDate && (
                                                <div className="text-left sm:text-right space-y-1">
                                                    <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest block">Due Date</span>
                                                    <div className="flex items-center sm:justify-end gap-2 text-red-400 font-medium text-xs sm:text-base">
                                                        <Calendar className="size-3.5 sm:size-4" />
                                                        {format(selectedInvoice.dueDate, 'MMMM dd, yyyy')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator className="bg-amber-500/10" />

                                    {/* Items Table with Totals in Footer */}
                                    <div className="border border-amber-500/20 rounded-xl overflow-x-auto">
                                        <table className="w-full min-w-[500px]">
                                            <thead className="bg-slate-900/50">
                                                <tr>
                                                    <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-[10px] sm:text-xs text-amber-200/70 font-bold uppercase tracking-wider">Item Details</th>
                                                    <th className="py-2 sm:py-3 px-3 sm:px-4 text-center text-[10px] sm:text-xs text-amber-200/70 font-bold uppercase tracking-wider">Qty</th>
                                                    <th className="py-2 sm:py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs text-amber-200/70 font-bold uppercase tracking-wider">Price</th>
                                                    {selectedInvoice.type !== 'buy' && <th className="py-2 sm:py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs text-amber-200/70 font-bold uppercase tracking-wider">Discount</th>}
                                                    <th className="py-2 sm:py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs text-amber-200/70 font-bold uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedInvoice.items.map((item) => (
                                                    <tr key={item.id} className="border-t border-amber-500/10">
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4">
                                                            <div className="text-amber-50 text-xs sm:text-sm font-medium">{item.name}</div>
                                                            <div className="text-[10px] sm:text-xs text-amber-200/50 tracking-wide uppercase">{item.category}</div>
                                                        </td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-center text-amber-50 text-xs sm:text-sm">{item.quantity}</td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-amber-50 text-xs sm:text-sm">{item.price.toFixed(0)}</td>
                                                        {selectedInvoice.type !== 'buy' && <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-red-400 text-xs sm:text-sm">-{(item.discount || 0).toFixed(0)}</td>}
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-amber-50 font-bold text-xs sm:text-sm">{item.total.toFixed(0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-900/30 border-t-2 border-amber-500/20">
                                                <tr>
                                                    <td colSpan={selectedInvoice.type !== 'buy' ? 4 : 3} className="py-2 px-3 sm:px-4 text-right text-xs text-amber-200/70 font-medium">Subtotal:</td>
                                                    <td className="py-2 px-3 sm:px-4 text-right text-amber-50 text-xs font-bold">
                                                        {selectedInvoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}
                                                    </td>
                                                </tr>
                                                {selectedInvoice.type !== 'buy' && selectedInvoice.items.some(item => (item.discount || 0) > 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="py-2 px-3 sm:px-4 text-right text-xs text-amber-200/70 font-medium">Discount:</td>
                                                        <td className="py-2 px-3 sm:px-4 text-right text-red-400 text-xs font-bold">-{selectedInvoice.items.reduce((sum, item) => sum + (item.discount || 0), 0).toFixed(0)}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan={selectedInvoice.type !== 'buy' ? 4 : 3} className="py-3 px-3 sm:px-4 text-right text-sm sm:text-xl font-bold text-amber-50">Total:</td>
                                                    <td className="py-3 px-3 sm:px-4 text-right text-amber-400 text-lg sm:text-2xl font-black">{selectedInvoice.total.toFixed(0)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {selectedInvoice.notes && (
                                        <div className="bg-slate-900/50 rounded-xl p-6 border border-amber-500/10">
                                            <div className="text-xs font-bold text-amber-500/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Mail className="size-3" />
                                                Notes & Reminders
                                            </div>
                                            <p className="text-amber-200/70 text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedInvoice.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            onClick={() => handlePrint(selectedInvoice)}
                                            disabled={isGenerating}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold disabled:opacity-50 h-11"
                                        >
                                            <Printer className="size-4 mr-2" />
                                            Print Invoice
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload(selectedInvoice)}
                                            disabled={isGenerating}
                                            variant="outline"
                                            className="flex-1 border-amber-500/30 text-amber-50 hover:bg-amber-500/10 disabled:opacity-50 h-11"
                                        >
                                            <Download className="size-4 mr-2" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20 h-full flex items-center justify-center min-h-[600px]">
                            <CardContent className="text-center">
                                <Receipt className="size-16 text-amber-400/40 mx-auto mb-4" />
                                <p className="text-amber-200/60 text-lg">Select an invoice to view details</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Invoice Type Selection Dialog */}
            {showInvoiceTypeDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="bg-slate-800/95 backdrop-blur-md border-amber-500/20 w-full max-w-2xl">
                        <CardHeader className="border-b border-amber-500/20 text-center">
                            <div className="text-2xl font-bold text-amber-50 mb-2 font-serif tracking-wide">Select Invoice Type</div>
                            <p className="text-amber-200/60 uppercase tracking-widest text-xs font-bold">Choose your transaction flow</p>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {/* Sales Invoice */}
                                <div
                                    onClick={() => {
                                        setShowInvoiceTypeDialog(false);
                                        router.push('/invoice/create?type=sales');
                                    }}
                                    className="group cursor-pointer"
                                >
                                    <Card className="bg-slate-900/50 border-2 border-amber-500/20 hover:border-emerald-500/60 transition-all hover:scale-[1.02] sm:hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 h-full">
                                        <CardContent className="p-4 sm:p-8 text-center flex flex-col items-center">
                                            <div className="mb-3 sm:mb-6">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md group-hover:bg-emerald-500/40 transition-colors"></div>
                                                    <div className="relative bg-slate-900 border border-emerald-500/30 p-4 sm:p-6 rounded-2xl">
                                                        <ShoppingCart className="size-8 sm:size-12 text-emerald-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-amber-50 mb-1 sm:mb-3">Sales</h3>
                                            <p className="text-amber-200/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                                Direct customer purchase with automated inventory management.
                                            </p>
                                            <div className="text-[10px] sm:text-xs text-emerald-400/60 font-medium space-y-0.5 sm:space-y-1">
                                                <div>• Stock Deductions</div>
                                                <div>• Inventory Selection</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Pawn Invoice */}
                                <div
                                    onClick={() => {
                                        setShowInvoiceTypeDialog(false);
                                        router.push('/invoice/create?type=pawn');
                                    }}
                                    className="group cursor-pointer"
                                >
                                    <Card className="bg-slate-900/50 border-2 border-amber-500/20 hover:border-amber-500/60 transition-all hover:scale-[1.02] sm:hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20 h-full">
                                        <CardContent className="p-4 sm:p-8 text-center flex flex-col items-center">
                                            <div className="mb-3 sm:mb-6">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-md group-hover:bg-amber-500/40 transition-colors"></div>
                                                    <div className="relative bg-slate-900 border border-amber-500/30 p-4 sm:p-6 rounded-2xl">
                                                        <HandCoins className="size-8 sm:size-12 text-amber-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-amber-50 mb-1 sm:mb-3">Pawn</h3>
                                            <p className="text-amber-200/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                                Loan-based transaction with collateral and maturity tracking.
                                            </p>
                                            <div className="text-[10px] sm:text-xs text-amber-400/60 font-medium space-y-0.5 sm:space-y-1">
                                                <div>• Collateral Entry</div>
                                                <div>• Due Date Tracking</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Buy Invoice */}
                                <div
                                    onClick={() => {
                                        setShowInvoiceTypeDialog(false);
                                        router.push('/invoice/create?type=buy');
                                    }}
                                    className="group cursor-pointer"
                                >
                                    <Card className="bg-slate-900/50 border-2 border-amber-500/20 hover:border-blue-500/60 transition-all hover:scale-[1.02] sm:hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 h-full">
                                        <CardContent className="p-4 sm:p-8 text-center flex flex-col items-center">
                                            <div className="mb-3 sm:mb-6">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md group-hover:bg-blue-500/40 transition-colors"></div>
                                                    <div className="relative bg-slate-900 border border-blue-500/30 p-4 sm:p-6 rounded-2xl">
                                                        <Diamond className="size-8 sm:size-12 text-blue-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-amber-50 mb-1 sm:mb-3">Buy</h3>
                                            <p className="text-amber-200/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                                Purchase from customer. Support for reuse of old invoice data.
                                            </p>
                                            <div className="text-[10px] sm:text-xs text-blue-400/60 font-medium space-y-0.5 sm:space-y-1">
                                                <div>• Stock Inbound</div>
                                                <div>• History Retrieval</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <Button
                                    onClick={() => setShowInvoiceTypeDialog(false)}
                                    variant="ghost"
                                    className="text-amber-200/40 hover:text-amber-200/70 hover:bg-amber-500/5 px-8 h-10 sm:h-11"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Status Change Confirmation Dialog */}
            <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                <AlertDialogContent className="bg-slate-900 border-amber-500/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-50">Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription className="text-amber-200/60">
                            Are you sure you want to change the status of this invoice to <span className="text-amber-400 font-bold capitalize">{pendingStatus?.replace('_', ' ')}</span>? This action will be recorded in the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-amber-500/20 text-amber-50 hover:bg-slate-700 hover:text-amber-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmStatusChange}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                        >
                            Confirm Change
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
