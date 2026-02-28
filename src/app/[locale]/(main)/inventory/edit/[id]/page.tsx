"use client";

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Package, ArrowLeft, Image as ImageIcon, Boxes, Award, Upload, X, Loader2, Camera, Diamond } from 'lucide-react';
import { CameraModal } from '@/components/inventory/CameraModal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { updateItemAction, getItemByIdAction } from '@/app/actions/itemActions';
import { useSettings } from '@/context/SettingsContext';
import { useTranslations } from 'next-intl';

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const t = useTranslations('inventory_edit');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { categories: dbCategories, materials: dbMaterials, isLoading: isOptionsLoading } = useSettings();

    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    interface ItemFormData {
        name: string;
        category: string;
        description: string;
        material: string;
        weight: number | string;
        stock: number | string;
        image: string;
    }

    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        category: 'rings',
        description: '',
        material: '',
        weight: '',
        stock: 0,
        image: '',
    });
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            setIsLoading(true);
            const itemRes = await getItemByIdAction(id);

            if (itemRes.success && itemRes.data) {
                const item = itemRes.data;
                setFormData(item as unknown as ItemFormData);
                setImagePreview(item.image);
                if (item.material) {
                    const materials = item.material.split(',').map(m => m.trim());
                    setSelectedMaterials(materials);
                }
            } else {
                toast.error(itemRes.error || t('itemNotFound'));
                router.push('/inventory');
            }
            setIsLoading(false);
        };

        fetchItem();
    }, [id, router, t]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('largeImage'));
            return;
        }

        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    const handleCameraCapture = (file: File) => {
        handleFileSelect(file);
    };

    const removeImage = () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setSelectedFile(null);
        setFormData((prev) => ({ ...prev, image: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.category || selectedMaterials.length === 0 || formData.weight === '') {
            toast.error(t('fillRequired'));
            return;
        }

        const stockValue = formData.stock === '' ? 0 : parseInt(formData.stock.toString());
        if (stockValue < 0) {
            toast.error(t('negativeStock'));
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading(t('saving'));

        try {
            const submitFormData = new FormData();
            submitFormData.append('name', formData.name!);
            submitFormData.append('category', formData.category!);
            submitFormData.append('description', formData.description || '');
            submitFormData.append('material', selectedMaterials.join(', '));
            const finalStockValue = formData.stock === '' ? 0 : parseInt(formData.stock.toString());
            submitFormData.append('stock', finalStockValue.toString());
            submitFormData.append('weight', formData.weight.toString());

            if (selectedFile) {
                submitFormData.append('image', selectedFile);
            } else if (formData.image) {
                submitFormData.append('image', formData.image);
            } else {
                submitFormData.append('image', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop');
            }

            const dbResult = await updateItemAction(id, submitFormData);

            if (!dbResult.success) {
                throw new Error(dbResult.error || t('failUpdate'));
            }

            toast.success(t('updatedSuccess'), { id: loadingToast });
            router.push('/inventory');
        } catch (error) {
            console.error('Error updating item:', error);
            const errorMessage = error instanceof Error ? error.message : t('failUpdate');
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/inventory');
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <Skeleton className="h-4 w-32 bg-muted mb-4" />
                    <Skeleton className="h-10 w-48 bg-muted mb-3" />
                    <Skeleton className="h-6 w-72 bg-muted" />
                </div>

                <Card className="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader>
                        <Skeleton className="h-6 w-40 bg-muted" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-24 bg-muted" />
                                <Skeleton className="h-11 w-full bg-muted" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-24 bg-muted" />
                                <Skeleton className="h-11 w-full bg-muted" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-32 bg-muted" />
                                <Skeleton className="h-11 w-full bg-muted" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-64 bg-muted" />
                                <Skeleton className="h-32 w-full bg-muted" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-10">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 mb-4 px-2 font-bold"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    {t('previous')}
                </Button>
                <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                    <Package className="size-6 sm:size-8 text-primary" />
                    {t('title')}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-lg font-medium">{t('description')}</p>
            </div>

            {/* Form Card */}
            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader className="p-4 sm:p-6 border-b border-border">
                    <CardTitle className="text-lg sm:text-xl text-foreground flex items-center gap-2 font-bold">
                        {t('itemInformation')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Item Name */}
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    {t('itemName')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('itemNamePlaceholder')}
                                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 h-11 transition-all focus:bg-card"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="md:col-span-2">
                                <Label htmlFor="category" className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    {t('category')} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    disabled={isOptionsLoading}
                                >
                                    <SelectTrigger className="bg-muted/50 border-border text-foreground h-11 transition-all focus:bg-card">
                                        <SelectValue placeholder={isOptionsLoading ? t('loading') : t('selectCategory')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {dbCategories.map((option) => (
                                            <SelectItem key={option.id} value={option.id} className="text-foreground cursor-pointer">
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Weight */}
                            <div className="md:col-span-1">
                                <Label htmlFor="weight" className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    <Diamond className="size-4 text-primary" />
                                    {t('weight')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="2.5"
                                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 h-11 transition-all focus:bg-card"
                                    required
                                />
                            </div>

                            {/* Stock */}
                            <div className="md:col-span-1">
                                <Label htmlFor="stock" className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    <Boxes className="size-4 text-primary" />
                                    {t('stockQuantity')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    placeholder="10"
                                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 h-11 transition-all focus:bg-card"
                                    required
                                />
                            </div>


                            {/* Materials */}
                            <div className="md:col-span-2">
                                <Label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    <Award className="size-4 text-primary" />
                                    {t('materials')} <span className="text-red-500">*</span>
                                </Label>
                                <MultiSelect
                                    options={dbMaterials.map(m => ({ label: m.name, value: m.id }))}
                                    selected={selectedMaterials}
                                    onChange={setSelectedMaterials}
                                    placeholder={isOptionsLoading ? t('loadingMaterials') : t('selectMaterials')}
                                />                       </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <Label htmlFor="description" className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    {t('descriptionLabel')}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t('descriptionPlaceholder')}
                                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 min-h-[120px] resize-none transition-all focus:bg-card"
                                />
                            </div>

                            {/* Item Image */}
                            <div className="md:col-span-2">
                                <Label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-2 mb-2">
                                    <ImageIcon className="size-4 text-primary" />
                                    {t('itemImage')}
                                </Label>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 sm:p-8 bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer relative"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {isSubmitting ? (
                                        <div className="text-center space-y-4">
                                            <div className="relative">
                                                <Skeleton className="size-12 sm:size-16 rounded-full bg-primary/10 mx-auto" />
                                                <Loader2 className="size-6 sm:size-8 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            </div>
                                            <p className="text-muted-foreground text-xs sm:text-sm font-bold animate-pulse">{t('processing')}</p>
                                        </div>
                                    ) : imagePreview ? (
                                        <div className="relative group w-full">
                                            <div className="relative h-[200px] sm:h-[300px] w-full flex items-center justify-center">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="rounded-lg object-contain w-full h-full shadow-2xl transition-transform group-hover:scale-[1.02]"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <p className="text-white text-xs sm:text-sm font-medium">{t('clickToChange')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg z-20"
                                            >
                                                <X className="size-3 sm:size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center w-full">
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center mb-4">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="w-full sm:w-auto bg-primary/5 p-4 sm:p-6 rounded-2xl hover:bg-primary/10 transition-all border border-primary/10 hover:border-primary/30 group shadow-sm hover:shadow-md"
                                                >
                                                    <Upload className="size-6 sm:size-8 text-primary group-hover:scale-110 transition-transform mb-1 sm:mb-2 mx-auto" />
                                                    <p className="text-foreground text-xs font-bold">{t('uploadFile')}</p>
                                                </div>

                                                <div className="text-muted-foreground/20 font-bold hidden sm:block">OR</div>

                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsCameraModalOpen(true);
                                                    }}
                                                    className="w-full sm:w-auto bg-purple-500/5 p-4 sm:p-6 rounded-2xl hover:bg-purple-500/10 transition-all border border-purple-500/10 hover:border-purple-500/30 group shadow-sm hover:shadow-md"
                                                >
                                                    <Camera className="size-6 sm:size-8 text-purple-500/60 group-hover:scale-110 transition-transform mb-1 sm:mb-2 mx-auto" />
                                                    <p className="text-foreground text-xs font-bold">{t('directCamera')}</p>
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground/40 text-[10px] sm:text-sm font-medium">{t('imageHint')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CameraModal
                            isOpen={isCameraModalOpen}
                            onClose={() => setIsCameraModalOpen(false)}
                            onCapture={handleCameraCapture}
                        />

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary h-12 text-sm sm:text-base font-bold transition-all active:scale-[0.98] order-2 sm:order-1"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-primary hover:brightness-95 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] text-primary-foreground font-bold shadow-lg shadow-primary/20 h-10 sm:h-12 text-sm sm:text-base order-1 sm:order-2 transition-all duration-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />
                                        {t('updating')}
                                    </>
                                ) : (
                                    <>
                                        <Package className="size-4 sm:size-5 mr-2" />
                                        {t('save')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
