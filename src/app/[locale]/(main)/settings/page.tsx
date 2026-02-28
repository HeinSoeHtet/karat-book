"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit2, Trash2, Tag, Diamond, Save, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/context/SettingsContext';
import {
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    createMaterialAction,
    updateMaterialAction,
    deleteMaterialAction
} from '@/app/actions/settingsActions';
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

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');
    const { categories, materials, isLoading, refreshSettings } = useSettings();

    // Form States
    const [newCategory, setNewCategory] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    const [editingItem, setEditingItem] = useState<{ id: string, name: string, type: 'category' | 'material' } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'category' | 'material' } | null>(null);

    // --- Category Handlers ---
    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        const res = await createCategoryAction(newCategory.trim());
        if (res.success) {
            toast.success(t('categoryAdded'));
            setNewCategory('');
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to add category');
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingItem || !editingItem.name.trim()) return;
        const res = await updateCategoryAction(editingItem.id, editingItem.name.trim());
        if (res.success) {
            toast.success(t('categoryUpdated'));
            setEditingItem(null);
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to update category');
        }
    };

    const handleDeleteCategory = async () => {
        if (!itemToDelete) return;
        const res = await deleteCategoryAction(itemToDelete.id);
        if (res.success) {
            toast.success(t('categoryDeleted'));
            setItemToDelete(null);
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to delete category');
        }
    };

    // --- Material Handlers ---
    const handleAddMaterial = async () => {
        if (!newMaterial.trim()) return;
        const res = await createMaterialAction(newMaterial.trim());
        if (res.success) {
            toast.success(t('materialAdded'));
            setNewMaterial('');
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to add material');
        }
    };

    const handleUpdateMaterial = async () => {
        if (!editingItem || !editingItem.name.trim()) return;
        const res = await updateMaterialAction(editingItem.id, editingItem.name.trim());
        if (res.success) {
            toast.success(t('materialUpdated'));
            setEditingItem(null);
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to update material');
        }
    };

    const handleDeleteMaterial = async () => {
        if (!itemToDelete) return;
        const res = await deleteMaterialAction(itemToDelete.id);
        if (res.success) {
            toast.success(t('materialDeleted'));
            setItemToDelete(null);
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to delete material');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <Settings className="size-6 sm:size-8 text-primary" />
                    {t('title')}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-lg">{t('subtitle')}</p>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="bg-muted/50 border border-border p-1 mb-6 sm:mb-8 flex rounded-xl">
                    <TabsTrigger value="categories" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-primary/5 dark:hover:bg-primary/10 px-4 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all">
                        <Tag className="size-3.5 sm:size-4 mr-2" />
                        {t('categories')}
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-primary/5 dark:hover:bg-primary/10 px-4 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all">
                        <Diamond className="size-3.5 sm:size-4 mr-2" />
                        {t('materials')}
                    </TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories">
                    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2 font-bold text-lg sm:text-xl">
                                <Plus className="size-5 text-primary" />
                                {t('addNewCategory')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-xs sm:text-sm font-medium">{t('enterCategoryName')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder={t('categoryPlaceholder')}
                                    className="bg-muted/50 border-border text-foreground placeholder:text-foreground/40 focus:ring-primary/30 h-11 rounded-xl font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <Button
                                    onClick={handleAddCategory}
                                    className="bg-primary hover:brightness-95 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground font-bold h-11 px-8 flex-shrink-0 shadow-lg shadow-primary/20 rounded-xl transition-all duration-200"
                                >
                                    {t('addCategory')}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                    <Tag className="size-3" />
                                    {t('existingCategories')}
                                </h3>
                                {isLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : categories.length === 0 ? (
                                    <p className="text-center py-8 text-foreground/20 font-medium">{t('noCategoriesFound')}</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {categories.map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
                                                {editingItem?.id === cat.id && editingItem.type === 'category' ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                                        <Input
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="h-10 bg-muted border-primary/40 text-foreground text-sm rounded-lg font-bold"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-400 hover:bg-emerald-400/10 flex-shrink-0" onClick={handleUpdateCategory}>
                                                            <Save className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:bg-red-400/10 flex-shrink-0" onClick={() => setEditingItem(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-foreground font-bold text-sm sm:text-base uppercase tracking-tight"> {cat.name}</span>
                                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 sm:h-9 sm:w-9 text-amber-400 hover:bg-amber-400/10"
                                                                onClick={() => setEditingItem({ id: cat.id, name: cat.name, type: 'category' })}
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 sm:h-9 sm:w-9 text-red-400 hover:bg-red-400/10"
                                                                onClick={() => setItemToDelete({ id: cat.id, name: cat.name, type: 'category' })}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials">
                    <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2 font-bold text-lg sm:text-xl">
                                <Plus className="size-5 text-primary" />
                                {t('addNewMaterial')}
                            </CardTitle>
                            <CardDescription className="text-foreground/40 font-medium ">{t('enterMaterialName')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
                                <Input
                                    value={newMaterial}
                                    onChange={(e) => setNewMaterial(e.target.value)}
                                    placeholder={t('materialPlaceholder')}
                                    className="bg-muted/50 border-border text-foreground placeholder:text-foreground/40 focus:ring-primary/30 h-11 rounded-xl font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                                />
                                <Button
                                    onClick={handleAddMaterial}
                                    className="bg-primary hover:brightness-95 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground font-bold h-11 px-8 flex-shrink-0 shadow-lg shadow-primary/20 rounded-xl transition-all duration-200"
                                >
                                    {t('addMaterial')}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                    <Diamond className="size-3" />
                                    {t('existingMaterials')}
                                </h3>
                                {isLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : materials.length === 0 ? (
                                    <p className="text-center py-8 text-foreground/20  font-medium">{t('noMaterialsFound')}</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {materials.map((mat) => (
                                            <div key={mat.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
                                                {editingItem?.id === mat.id && editingItem.type === 'material' ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                                        <Input
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="h-10 bg-muted border-primary/40 text-foreground text-sm rounded-lg font-bold"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateMaterial()}
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-400 hover:bg-emerald-400/10 flex-shrink-0" onClick={handleUpdateMaterial}>
                                                            <Save className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:bg-red-400/10 flex-shrink-0" onClick={() => setEditingItem(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-foreground font-bold text-sm sm:text-base uppercase tracking-tight">{mat.name}</span>
                                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 sm:h-9 sm:w-9 text-amber-400 hover:bg-amber-400/10"
                                                                onClick={() => setEditingItem({ id: mat.id, name: mat.name, type: 'material' })}
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 sm:h-9 sm:w-9 text-red-400 hover:bg-red-400/10"
                                                                onClick={() => setItemToDelete({ id: mat.id, name: mat.name, type: 'material' })}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="bg-card border-border text-foreground rounded-2xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-foreground font-bold">
                            <AlertTriangle className="size-6 text-rose-500" />
                            {t('confirmDeletion')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground/60 font-medium  py-2">
                            {t('deleteDescription', { name: itemToDelete?.name || '', type: itemToDelete ? t(itemToDelete.type) : '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex gap-3">
                        <AlertDialogCancel className="bg-muted border-border text-foreground/70 hover:bg-muted/80 rounded-xl transition-all font-bold uppercase tracking-widest text-xs h-12 flex-1">
                            {tCommon('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={itemToDelete?.type === 'category' ? handleDeleteCategory : handleDeleteMaterial}
                            className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-lg shadow-rose-500/20 rounded-xl transition-all font-bold uppercase tracking-widest text-xs h-12 flex-1"
                        >
                            {tCommon('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
