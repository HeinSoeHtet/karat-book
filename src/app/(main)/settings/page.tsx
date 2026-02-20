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

export default function SettingsPage() {
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
            toast.success('Category added');
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
            toast.success('Category updated');
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
            toast.success('Category deleted');
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
            toast.success('Material added');
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
            toast.success('Material updated');
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
            toast.success('Material deleted');
            setItemToDelete(null);
            refreshSettings();
        } else {
            toast.error(res.error || 'Failed to delete material');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-amber-50 mb-2 flex items-center gap-3">
                    <Settings className="size-8 text-amber-400" />
                    System Settings
                </h2>
                <p className="text-amber-200/60">Manage your product categories and materials</p>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="bg-slate-900/50 border border-amber-500/20 p-1 mb-8">
                    <TabsTrigger value="categories" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 px-8 py-2.5">
                        <Tag className="size-4 mr-2" />
                        Categories
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 px-8 py-2.5">
                        <Diamond className="size-4 mr-2" />
                        Materials
                    </TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories">
                    <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-amber-50 flex items-center gap-2">
                                <Plus className="size-5 text-amber-400" />
                                Add New Category
                            </CardTitle>
                            <CardDescription className="text-amber-200/40">Enter a name for the new product category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 mb-8">
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="e.g. Brooches, Pendants..."
                                    className="bg-slate-900/50 border-amber-500/20 text-amber-50 focus:ring-amber-500/30"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <Button
                                    onClick={handleAddCategory}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                                >
                                    Add Category
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-amber-200/50 uppercase tracking-wider mb-4">Existing Categories</h3>
                                {isLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                    </div>
                                ) : categories.length === 0 ? (
                                    <p className="text-center py-8 text-amber-200/20 italic">No categories found</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {categories.map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-amber-500/10 hover:border-amber-500/30 transition-colors group">
                                                {editingItem?.id === cat.id && editingItem.type === 'category' ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                                        <Input
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="h-8 bg-slate-800 border-amber-500/40 text-amber-50 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:bg-emerald-400/10" onClick={handleUpdateCategory}>
                                                            <Save className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-400/10" onClick={() => setEditingItem(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-amber-50 font-medium">{cat.name}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-amber-400 hover:bg-amber-400/10"
                                                                onClick={() => setEditingItem({ id: cat.id, name: cat.name, type: 'category' })}
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-400 hover:bg-red-400/10"
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
                    <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-amber-50 flex items-center gap-2">
                                <Plus className="size-5 text-amber-400" />
                                Add New Material
                            </CardTitle>
                            <CardDescription className="text-amber-200/40">Enter a name for the new material option</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 mb-8">
                                <Input
                                    value={newMaterial}
                                    onChange={(e) => setNewMaterial(e.target.value)}
                                    placeholder="e.g. 10K Gold, Titanium..."
                                    className="bg-slate-900/50 border-amber-500/20 text-amber-50 focus:ring-amber-500/30"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                                />
                                <Button
                                    onClick={handleAddMaterial}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                                >
                                    Add Material
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-amber-200/50 uppercase tracking-wider mb-4">Existing Materials</h3>
                                {isLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                    </div>
                                ) : materials.length === 0 ? (
                                    <p className="text-center py-8 text-amber-200/20 italic">No materials found</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {materials.map((mat) => (
                                            <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-amber-500/10 hover:border-amber-500/30 transition-colors group">
                                                {editingItem?.id === mat.id && editingItem.type === 'material' ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                                        <Input
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="h-8 bg-slate-800 border-amber-500/40 text-amber-50 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateMaterial()}
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:bg-emerald-400/10" onClick={handleUpdateMaterial}>
                                                            <Save className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-400/10" onClick={() => setEditingItem(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-amber-50 font-medium">{mat.name}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-amber-400 hover:bg-amber-400/10"
                                                                onClick={() => setEditingItem({ id: mat.id, name: mat.name, type: 'material' })}
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-400 hover:bg-red-400/10"
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
                <AlertDialogContent className="bg-slate-900 border-amber-500/20 text-amber-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="size-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-amber-200/60">
                            Are you sure you want to delete <span className="text-amber-100 font-semibold">{itemToDelete?.name}</span>?
                            This might affect items currently assigned to this {itemToDelete?.type}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="bg-slate-800 border-amber-500/20 text-amber-200 hover:bg-slate-700 hover:text-amber-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={itemToDelete?.type === 'category' ? handleDeleteCategory : handleDeleteMaterial}
                            className="bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
