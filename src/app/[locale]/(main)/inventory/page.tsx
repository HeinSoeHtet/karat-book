"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Package, Plus, Edit, AlertTriangle, TrendingDown, Trash2, Filter, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import { Item } from '@/types';
import { getItemsAction, deleteItemAction } from '@/app/actions/itemActions';
import { useSettings } from '@/context/SettingsContext';

import { useTranslations } from 'next-intl';

export default function InventoryPage() {
    const t = useTranslations('inventory');
    const [dbItems, setDbItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10
    });
    const [stats, setStats] = useState({
        totalCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalStockUnits: 0
    });

    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { categories: dbCategories, materials: dbMaterials } = useSettings();
    const router = useRouter();

    // Active card filter
    const [activeCard, setActiveCard] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');

    // Temporary filter states (before applying)
    const [tempCategoryFilter, setTempCategoryFilter] = useState<string>('all');
    const [tempMaterialFilters, setTempMaterialFilters] = useState<string[]>([]);

    // Applied filter states
    const [appliedCategoryFilter, setAppliedCategoryFilter] = useState<string>('all');
    const [appliedMaterialFilters, setAppliedMaterialFilters] = useState<string[]>([]);

    const fetchItems = useCallback(async (page: number) => {
        setIsLoading(true);
        const result = await getItemsAction({
            page,
            pageSize: pagination.pageSize,
            category: appliedCategoryFilter,
            materials: appliedMaterialFilters,
            stockStatus: activeCard
        });

        if (result.success && result.data) {
            setDbItems(result.data);
            if (result.pagination) {
                setPagination(result.pagination);
            }
            if (result.stats) {
                setStats(result.stats);
            }
        } else {
            toast.error(t('errorLoadingInventory'));
        }
        setIsLoading(false);
    }, [appliedCategoryFilter, appliedMaterialFilters, activeCard, pagination.pageSize, t]);

    useEffect(() => {
        fetchItems(pagination.currentPage);
    }, [fetchItems, pagination.currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [appliedCategoryFilter, appliedMaterialFilters, activeCard]);

    const handleEdit = (item: Item) => {
        router.push(`/inventory/edit/${item.id}`);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        const result = await deleteItemAction(itemToDelete.id);
        if (result.success) {
            // Re-fetch current page to ensure stats and pagination are updated
            fetchItems(pagination.currentPage);
            toast.success(`${itemToDelete.name} ${t('deleteSuccess')}`);
            setItemToDelete(null);
        } else {
            toast.error(t('deleteError'));
        }
        setIsDeleting(false);
    };

    const applyFilters = () => {
        setAppliedCategoryFilter(tempCategoryFilter);
        setAppliedMaterialFilters(tempMaterialFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        toast.success(t('filtersApplied'));
    };

    const clearFilters = () => {
        setTempCategoryFilter('all');
        setTempMaterialFilters([]);
        setAppliedCategoryFilter('all');
        setAppliedMaterialFilters([]);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        toast.success(t('filtersCleared'));
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                        <Package className="size-6 sm:size-8 text-primary" />
                        {t('title')}
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-lg">{t('subtitle')}</p>
                </div>

                <Button
                    onClick={() => router.push('/inventory/new')}
                    className="bg-primary hover:brightness-95 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground font-bold shadow-lg shadow-primary/20 w-full sm:w-auto transition-all duration-200"
                >
                    <Plus className="size-5 mr-2" />
                    {t('addItem')}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total Stock Units Card */}
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 dark:from-purple-500/10 dark:to-purple-600/5 border-purple-500/10 dark:border-purple-500/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {t('stockUnits')}
                        </CardTitle>
                        <div className="bg-purple-500/10 p-2 sm:p-2.5 rounded-lg border border-purple-500/20">
                            <Package className="size-4 sm:size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-300 dark:to-purple-500 bg-clip-text text-transparent">
                            {stats.totalStockUnits}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 border-blue-500/10 dark:border-blue-500/20 hover:shadow-md ${activeCard === 'all'
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/40 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20'
                        : 'bg-blue-500/5 dark:bg-blue-500/10 hover:border-blue-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('all')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {t('totalItems')}
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg border border-blue-500/20 ${activeCard === 'all' ? 'bg-blue-500/20' : 'bg-blue-500/10'
                            }`}>
                            <Package className="size-4 sm:size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
                            {stats.totalCount}
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 border-amber-500/10 dark:border-amber-500/20 hover:shadow-md ${activeCard === 'low-stock'
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20'
                        : 'bg-amber-500/5 dark:bg-amber-500/10 hover:border-amber-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('low-stock')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {t('lowStock')}
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg border border-amber-500/20 ${activeCard === 'low-stock' ? 'bg-amber-500/20' : 'bg-amber-500/10'
                            }`}>
                            <AlertTriangle className="size-4 sm:size-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
                            {stats.lowStockCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            ≤ 5 {t('units')}
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 border-red-500/10 dark:border-red-500/20 hover:shadow-md ${activeCard === 'out-of-stock'
                        ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500/40 shadow-lg shadow-red-500/10 dark:shadow-red-500/20'
                        : 'bg-red-500/5 dark:bg-red-500/10 hover:border-red-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('out-of-stock')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-xs font-bold text-red-600 dark:text-red-400">
                            {t('outOfStock')}
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg border border-red-500/20 ${activeCard === 'out-of-stock' ? 'bg-red-500/20' : 'bg-red-500/10'
                            }`}>
                            <TrendingDown className="size-4 sm:size-5 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 dark:from-red-300 dark:to-red-500 bg-clip-text text-transparent">
                            {stats.outOfStockCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-card backdrop-blur-sm rounded-2xl border border-border p-4 sm:p-5 mb-6 sm:mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <Select value={tempCategoryFilter} onValueChange={setTempCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[280px] bg-muted/50 border-border text-foreground h-10 sm:h-11 text-sm sm:text-base rounded-xl">
                            <SelectValue placeholder={t('allCategories')} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="all">{t('allCategories')}</SelectItem>
                            {dbCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="w-full sm:w-[280px]">
                        <MultiSelect
                            options={dbMaterials.map(m => ({ label: m.name, value: m.id }))}
                            selected={tempMaterialFilters}
                            onChange={setTempMaterialFilters}
                            placeholder={t('selectMaterials')}
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-4">
                        <Button
                            onClick={applyFilters}
                            className="flex-1 sm:flex-none bg-primary hover:brightness-95 hover:shadow-lg hover:scale-[1.02] text-primary-foreground font-bold h-10 sm:h-11 px-5 text-sm sm:text-base rounded-xl shadow-sm transition-all duration-200"
                        >
                            <Filter className="size-4 mr-2" />
                            {t('search')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="flex-1 sm:flex-none border-border bg-card text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-10 sm:h-11 px-6 text-sm sm:text-base rounded-xl transition-all font-bold"
                        >
                            <X className="size-4 mr-2 text-foreground/40" />
                            {t('clear')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/30">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Package className="size-5 text-primary" />
                        {t('itemInventory')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-muted/10">
                                    <Skeleton className="size-12 rounded-lg bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4 bg-muted" />
                                        <Skeleton className="h-3 w-1/2 bg-muted" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                                    <Skeleton className="h-6 w-24 bg-muted" />
                                    <Skeleton className="h-8 w-20 bg-muted" />
                                </div>
                            ))}
                        </div>
                    ) : dbItems.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <Package className="size-16 text-muted/30 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-foreground mb-3">{t('noItemsFound')}</h3>
                            <p className="text-foreground/60 font-medium ">{t('addItemsToStart')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                                            <TableHead className="text-muted-foreground font-bold text-xs">{t('item')}</TableHead>
                                            <TableHead className="text-muted-foreground font-bold text-xs">{t('category')}</TableHead>
                                            <TableHead className="text-muted-foreground font-bold text-xs">{t('weight')}</TableHead>
                                            <TableHead className="text-muted-foreground font-bold text-xs">{t('material')}</TableHead>
                                            <TableHead className="text-muted-foreground font-bold text-xs">{t('stock')}</TableHead>
                                            <TableHead className="text-right text-muted-foreground font-bold text-xs">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dbItems.map((item) => (
                                            <TableRow key={item.id} className="border-border hover:bg-muted/20 transition-colors duration-200">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-500/20 font-medium">
                                                        {item.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-foreground text-sm font-medium">{item.weight} g</TableCell>
                                                <TableCell className="text-foreground text-sm font-medium">{item.material}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`w-12 justify-center font-bold border-none shadow-sm ${item.stock === 0
                                                            ? 'bg-red-500 text-white dark:bg-red-500/20 dark:text-red-400'
                                                            : item.stock <= 5
                                                                ? 'bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-400'
                                                                : 'bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-400'
                                                            }`}
                                                    >
                                                        {item.stock}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(item)}
                                                            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8"
                                                        >
                                                            <Edit className="size-3.5 mr-1.5" />
                                                            {t('edit')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setItemToDelete(item)}
                                                            className="border-border text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-8"
                                                        >
                                                            <Trash2 className="size-3.5 mr-1.5" />
                                                            {t('delete')}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {dbItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-muted/20 rounded-2xl border border-border overflow-hidden backdrop-blur-sm shadow-sm"
                                    >
                                        <div className="p-4 flex gap-4">
                                            <div className="size-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative border border-border">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="font-bold text-foreground text-base mb-1 line-clamp-1">{item.name}</div>
                                                <div className="text-[10px] text-muted-foreground line-clamp-1 uppercase tracking-widest mb-2 font-bold">
                                                    {item.category} • {item.weight}g • {item.material}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`w-fit py-0.5 text-[10px] font-bold border-none ${item.stock === 0
                                                        ? 'bg-red-500 text-white dark:bg-red-500/20 dark:text-red-500'
                                                        : item.stock <= 5
                                                            ? 'bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-500'
                                                            : 'bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-500'
                                                        }`}
                                                >
                                                    {item.stock === 0 ? t('outOfStock') : `${item.stock} ${t('units')}`}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="px-4 pb-4 flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(item)}
                                                variant="outline"
                                                className="flex-1 border-border text-muted-foreground hover:bg-muted h-10 text-xs font-bold rounded-xl"
                                            >
                                                <Edit className="size-3.5 mr-2" />
                                                {t('edit')}
                                            </Button>
                                            <Button
                                                onClick={() => setItemToDelete(item)}
                                                variant="outline"
                                                className="flex-1 border-border text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-10 text-xs font-bold rounded-xl"
                                            >
                                                <Trash2 className="size-3.5 mr-2" />
                                                {t('delete')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-muted/30">
                                <div className="text-xs text-muted-foreground font-bold">
                                    {t('page')} <span className="text-foreground font-bold">{pagination.currentPage}</span> {t('of')} <span className="text-foreground font-bold">{pagination.totalPages}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage === 1 || isLoading}
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        className="border-border text-muted-foreground hover:bg-muted h-8 rounded-lg"
                                    >
                                        {t('previous')}
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(pagination.totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            if (
                                                pagination.totalPages <= 5 ||
                                                pageNum === 1 ||
                                                pageNum === pagination.totalPages ||
                                                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                                            ) {
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        size="sm"
                                                        variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                                                        className={`h-8 w-8 p-0 rounded-lg font-bold ${pagination.currentPage === pageNum
                                                            ? 'bg-primary text-primary-foreground border-none hover:bg-primary/90'
                                                            : 'border-border text-muted-foreground hover:bg-muted'
                                                            }`}
                                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            } else if (
                                                pageNum === pagination.currentPage - 2 ||
                                                pageNum === pagination.currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-muted/40 px-0.5">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage === pagination.totalPages || isLoading}
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        className="border-border text-muted-foreground hover:bg-muted h-8 rounded-lg"
                                    >
                                        {t('next')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="bg-card border-border text-foreground rounded-2xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-5" />
                            {t('confirmDeletion')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {t('deleteDescription', { name: itemToDelete?.name || '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-xl">
                            {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg shadow-rose-500/20 rounded-xl"
                        >
                            {isDeleting ? t('deleting') : t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
