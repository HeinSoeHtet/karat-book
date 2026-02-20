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
import { Package, Plus, Edit, AlertTriangle, TrendingDown, Sparkles, Trash2, Filter, X } from 'lucide-react';
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

export default function InventoryPage() {
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
            toast.error('Failed to load inventory from database');
        }
        setIsLoading(false);
    }, [appliedCategoryFilter, appliedMaterialFilters, activeCard, pagination.pageSize]);

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
            toast.success(`${itemToDelete.name} deleted from inventory`);
            setItemToDelete(null);
        } else {
            toast.error('Failed to delete item from database');
        }
        setIsDeleting(false);
    };

    const applyFilters = () => {
        setAppliedCategoryFilter(tempCategoryFilter);
        setAppliedMaterialFilters(tempMaterialFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        toast.success('Filters applied');
    };

    const clearFilters = () => {
        setTempCategoryFilter('all');
        setTempMaterialFilters([]);
        setAppliedCategoryFilter('all');
        setAppliedMaterialFilters([]);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        toast.success('Filters cleared');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                        <Package className="size-6 sm:size-8 text-amber-400" />
                        Inventory
                    </h2>
                    <p className="text-amber-200/60 text-xs sm:text-lg">Manage items and stock levels</p>
                </div>

                <Button
                    onClick={() => router.push('/inventory/new')}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold shadow-lg shadow-amber-500/30 w-full sm:w-auto"
                >
                    <Plus className="size-5 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total Stock Units Card (Moved from Sales) */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-[10px] sm:text-sm font-medium text-amber-200/70 uppercase tracking-wider">
                            Stock Units
                        </CardTitle>
                        <div className="bg-purple-500/20 p-2 sm:p-2.5 rounded-lg">
                            <Package className="size-4 sm:size-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                            {stats.totalStockUnits}
                        </div>
                        <p className="text-[10px] text-amber-200/40 mt-1 uppercase tracking-wider font-bold">Total Units</p>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 ${activeCard === 'all'
                        ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/20'
                        : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('all')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-[10px] sm:text-sm font-medium text-amber-200/70 uppercase tracking-wider">
                            Total Items
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg ${activeCard === 'all' ? 'bg-blue-500/30' : 'bg-blue-500/20'
                            }`}>
                            <Package className="size-4 sm:size-5 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                            {stats.totalCount}
                        </div>
                        <p className="text-[10px] text-amber-200/50 mt-1 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            In catalog
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 ${activeCard === 'low-stock'
                        ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/40 shadow-lg shadow-amber-500/20'
                        : 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('low-stock')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-[10px] sm:text-sm font-medium text-amber-200/70 uppercase tracking-wider">
                            Low Stock
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg ${activeCard === 'low-stock' ? 'bg-amber-500/30' : 'bg-amber-500/20'
                            }`}>
                            <AlertTriangle className="size-4 sm:size-5 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                            {stats.lowStockCount}
                        </div>
                        <p className="text-[10px] text-amber-200/50 mt-1 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            ≤ 5 units
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all duration-200 ${activeCard === 'out-of-stock'
                        ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/40 shadow-lg shadow-red-500/20'
                        : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/30'
                        } backdrop-blur-sm`}
                    onClick={() => setActiveCard('out-of-stock')}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                        <CardTitle className="text-[10px] sm:text-sm font-medium text-amber-200/70 uppercase tracking-wider">
                            Out of Stock
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg ${activeCard === 'out-of-stock' ? 'bg-red-500/30' : 'bg-red-500/20'
                            }`}>
                            <TrendingDown className="size-4 sm:size-5 text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent">
                            {stats.outOfStockCount}
                        </div>
                        <p className="text-[10px] text-amber-200/50 mt-1 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            Empty
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <Select value={tempCategoryFilter} onValueChange={setTempCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[280px] bg-slate-900/50 border-amber-500/20 text-amber-50 h-10 sm:h-11 text-sm sm:text-base">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-amber-500/20 text-amber-50">
                            <SelectItem value="all">All Categories</SelectItem>
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
                            placeholder="Select materials"
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-4">
                        <Button
                            onClick={applyFilters}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold h-10 sm:h-11 px-5 text-sm sm:text-base"
                        >
                            <Filter className="size-4 mr-2" />
                            Apply
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="flex-1 sm:flex-none border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-10 sm:h-11 px-5 text-sm sm:text-base"
                        >
                            <X className="size-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                <CardHeader>
                    <CardTitle className="text-amber-50 flex items-center gap-2">
                        <Package className="size-5 text-amber-400" />
                        Item Inventory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border border-amber-500/10 rounded-xl bg-slate-900/20">
                                    <Skeleton className="size-12 rounded-lg bg-amber-500/5" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4 bg-amber-500/5" />
                                        <Skeleton className="h-3 w-1/2 bg-amber-500/5" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full bg-amber-500/5" />
                                    <Skeleton className="h-6 w-24 bg-amber-500/5" />
                                    <Skeleton className="h-8 w-20 bg-amber-500/5" />
                                </div>
                            ))}
                        </div>
                    ) : dbItems.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="size-16 text-amber-400/20 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-amber-50 mb-3">No items found</h3>
                            <p className="text-amber-200/60">Add items to start managing inventory</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-xl overflow-hidden border border-amber-500/20">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-900/50 border-amber-500/20 hover:bg-slate-900/50">
                                            <TableHead className="text-amber-200/70">Item</TableHead>
                                            <TableHead className="text-amber-200/70">Category</TableHead>
                                            <TableHead className="text-amber-200/70">Material</TableHead>
                                            <TableHead className="text-amber-200/70">Stock</TableHead>
                                            <TableHead className="text-right text-amber-200/70">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dbItems.map((item) => (
                                            <TableRow key={item.id} className="border-amber-500/10 hover:bg-slate-900/20">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-12 rounded-lg overflow-hidden bg-slate-900/50 flex-shrink-0 relative">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-amber-50">{item.name}</div>
                                                            <div className="text-sm text-amber-200/50 line-clamp-1">{item.description}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                        {item.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-amber-100 text-sm">{item.material}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={item.stock === 0 ? 'destructive' : item.stock <= 5 ? 'default' : 'default'}
                                                        className={`w-12 justify-center ${item.stock === 0
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                            : item.stock <= 5
                                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
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
                                                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                                        >
                                                            <Edit className="size-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setItemToDelete(item)}
                                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="size-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {dbItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-slate-900/40 rounded-2xl border border-amber-500/10 overflow-hidden backdrop-blur-sm"
                                    >
                                        <div className="p-4 flex gap-4">
                                            <div className="size-20 rounded-xl overflow-hidden bg-slate-800/50 flex-shrink-0 relative border border-amber-500/10">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="font-bold text-amber-50 text-base mb-1 line-clamp-1">{item.name}</div>
                                                <div className="text-[10px] text-amber-200/40 line-clamp-1 uppercase tracking-wider mb-2 font-medium">
                                                    {item.category} • {item.material}
                                                </div>
                                                <Badge
                                                    className={`w-fit py-0.5 text-[10px] uppercase tracking-wider font-bold ${item.stock === 0
                                                        ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                                        : item.stock <= 5
                                                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                                                            : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                                        }`}
                                                >
                                                    {item.stock === 0 ? 'Out of Stock' : `${item.stock} Units`}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="px-4 pb-4 flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(item)}
                                                variant="outline"
                                                className="flex-1 bg-amber-500/5 border-amber-500/20 text-amber-200 hover:bg-amber-500/10 h-10 text-xs font-semibold"
                                            >
                                                <Edit className="size-3.5 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => setItemToDelete(item)}
                                                variant="outline"
                                                className="flex-1 bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10 h-10 text-xs font-semibold"
                                            >
                                                <Trash2 className="size-3.5 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-amber-500/10">
                                <div className="text-sm text-amber-200/40">
                                    Showing <span className="text-amber-50 font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1} – {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)}</span> of <span className="text-amber-50 font-medium">{pagination.total}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage === 1 || isLoading}
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        className="border-amber-500/20 text-amber-200 hover:bg-amber-500/10"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(pagination.totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Simple logic to show only few pages if there are many
                                            if (
                                                pagination.totalPages <= 7 ||
                                                pageNum === 1 ||
                                                pageNum === pagination.totalPages ||
                                                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                                            ) {
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        size="sm"
                                                        variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                                                        className={pagination.currentPage === pageNum
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 border-none'
                                                            : 'border-amber-500/20 text-amber-200 hover:bg-amber-500/10'
                                                        }
                                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            } else if (
                                                pageNum === pagination.currentPage - 2 ||
                                                pageNum === pagination.currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-amber-200/30 px-1">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage === pagination.totalPages || isLoading}
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        className="border-amber-500/20 text-amber-200 hover:bg-amber-500/10"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="bg-slate-900 border-amber-500/20 text-amber-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="size-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-amber-200/60">
                            Are you sure you want to delete <span className="text-amber-100 font-semibold">{itemToDelete?.name}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="bg-slate-800 border-amber-500/20 text-amber-200 hover:bg-slate-700 hover:text-amber-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20"
                        >
                            {isDeleting ? "Deleting..." : "Delete Item"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
