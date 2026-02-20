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
import { Package, ArrowLeft, Sparkles, Image as ImageIcon, Boxes, Award, Upload, X, Loader2, Camera } from 'lucide-react';
import { CameraModal } from '@/components/inventory/CameraModal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { updateItemAction, getItemByIdAction } from '@/app/actions/itemActions';
import { useSettings } from '@/context/SettingsContext';

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
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
        stock: number | string;
        image: string;
    }

    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        category: 'rings',
        description: '',
        material: '',
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
                toast.error(itemRes.error || 'Item not found');
                router.push('/inventory');
            }
            setIsLoading(false);
        };

        fetchItem();
    }, [id, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
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



        if (!formData.name || !formData.category || selectedMaterials.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        const stockValue = formData.stock === '' ? 0 : parseInt(formData.stock.toString());
        if (stockValue < 0) {
            toast.error('Stock cannot be negative');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Saving changes...');

        try {
            const submitFormData = new FormData();
            submitFormData.append('name', formData.name!);
            submitFormData.append('category', formData.category!);
            submitFormData.append('description', formData.description || '');
            submitFormData.append('material', selectedMaterials.join(', '));
            const stockValue = formData.stock === '' ? 0 : parseInt(formData.stock.toString());
            submitFormData.append('stock', stockValue.toString());

            if (selectedFile) {
                submitFormData.append('image', selectedFile);
            } else if (formData.image) {
                // If no new file is selected, but there's an existing image URL, send it
                submitFormData.append('image', formData.image);
            } else {
                // If no image at all, send a default placeholder
                submitFormData.append('image', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop');
            }

            const dbResult = await updateItemAction(id, submitFormData);

            if (!dbResult.success) {
                throw new Error(dbResult.error || 'Failed to update item in database');
            }

            toast.success('Item updated successfully!', { id: loadingToast });
            router.push('/inventory');
        } catch (error) {
            console.error('Error updating item:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
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
                    <Skeleton className="h-4 w-32 bg-amber-500/5 mb-4" />
                    <Skeleton className="h-10 w-48 bg-amber-500/5 mb-3" />
                    <Skeleton className="h-6 w-72 bg-amber-500/5" />
                </div>

                <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                    <CardHeader>
                        <Skeleton className="h-6 w-40 bg-amber-500/5" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-24 bg-amber-500/5" />
                                <Skeleton className="h-11 w-full bg-amber-500/5" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-24 bg-amber-500/5" />
                                <Skeleton className="h-11 w-full bg-amber-500/5" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-32 bg-amber-500/5" />
                                <Skeleton className="h-11 w-full bg-amber-500/5" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-64 bg-amber-500/5" />
                                <Skeleton className="h-32 w-full bg-amber-500/5" />
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
                    className="text-amber-200/70 hover:text-amber-50 hover:bg-slate-800/50 mb-4 px-2"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Back
                </Button>
                <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                    <Package className="size-6 sm:size-8 text-amber-400" />
                    Edit Item
                </h2>
                <p className="text-amber-200/60 text-xs sm:text-lg">Update item details for your collection</p>
            </div>

            {/* Form Card */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl text-amber-50 flex items-center gap-2">
                        <Sparkles className="size-4 sm:size-5 text-amber-400" />
                        Item Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Item Name */}
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    Item Name <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Diamond Solitaire Ring"
                                    className="bg-slate-900/50 border-amber-500/30 text-amber-50 placeholder:text-amber-200/30 h-11"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="md:col-span-2">
                                <Label htmlFor="category" className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    Category <span className="text-red-400">*</span>
                                </Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    disabled={isOptionsLoading}
                                >
                                    <SelectTrigger className="bg-slate-900 border-amber-500/20 text-amber-50 h-11">
                                        <SelectValue placeholder={isOptionsLoading ? "Loading..." : "Select category"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-amber-500/20 text-amber-50">
                                        {dbCategories.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Stock */}
                            <div className="md:col-span-2">
                                <Label htmlFor="stock" className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    <Boxes className="size-4" />
                                    Stock Quantity <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    placeholder="10"
                                    className="bg-slate-900/50 border-amber-500/30 text-amber-50 placeholder:text-amber-200/30 h-11"
                                    required
                                />
                            </div>


                            {/* Materials */}
                            <div className="md:col-span-2">
                                <Label className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    <Award className="size-4" />
                                    Materials <span className="text-red-400">*</span>
                                </Label>
                                <MultiSelect
                                    options={dbMaterials.map(m => ({ label: m.name, value: m.id }))}
                                    selected={selectedMaterials}
                                    onChange={setSelectedMaterials}
                                    placeholder={isOptionsLoading ? "Loading materials..." : "Select materials"}
                                />                       </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <Label htmlFor="description" className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the item in detail, including craftsmanship, features, and unique qualities..."
                                    className="bg-slate-900/50 border-amber-500/30 text-amber-50 placeholder:text-amber-200/30 min-h-[120px] resize-none"
                                />
                            </div>

                            {/* Item Image */}
                            <div className="md:col-span-2">
                                <Label className="text-amber-200/70 flex items-center gap-2 mb-2">
                                    <ImageIcon className="size-4" />
                                    Item Image
                                </Label>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-amber-500/20 rounded-xl p-4 sm:p-8 bg-slate-900/30 hover:bg-slate-900/50 transition-colors cursor-pointer relative"
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
                                                <Skeleton className="size-12 sm:size-16 rounded-full bg-amber-500/10 mx-auto" />
                                                <Loader2 className="size-6 sm:size-8 text-amber-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            </div>
                                            <p className="text-amber-200/60 text-xs sm:text-sm font-medium animate-pulse">Processing metadata...</p>
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
                                                <p className="text-white text-xs sm:text-sm font-medium">Click to change image</p>
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
                                                    className="w-full sm:w-auto bg-amber-500/10 p-4 sm:p-6 rounded-2xl hover:bg-amber-500/20 transition-all border border-amber-500/10 hover:border-amber-500/30 group"
                                                >
                                                    <Upload className="size-6 sm:size-8 text-amber-400 group-hover:scale-110 transition-transform mb-1 sm:mb-2 mx-auto" />
                                                    <p className="text-amber-50 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Upload File</p>
                                                </div>

                                                <div className="text-amber-200/20 font-bold hidden sm:block">OR</div>

                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsCameraModalOpen(true);
                                                    }}
                                                    className="w-full sm:w-auto bg-purple-500/10 p-4 sm:p-6 rounded-2xl hover:bg-purple-500/20 transition-all border border-purple-500/10 hover:border-purple-500/30 group"
                                                >
                                                    <Camera className="size-6 sm:size-8 text-purple-400 group-hover:scale-110 transition-transform mb-1 sm:mb-2 mx-auto" />
                                                    <p className="text-amber-50 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Direct Camera</p>
                                                </div>
                                            </div>
                                            <p className="text-amber-200/40 text-[10px] sm:text-sm">PNG, JPG or WebP (max. 5MB)</p>
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
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-amber-500/20">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 bg-slate-900/50 border-amber-500/50 text-amber-50 hover:bg-amber-500/10 hover:border-amber-500/70 hover:text-amber-50 h-10 sm:h-12 text-sm sm:text-base order-2 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold shadow-lg shadow-amber-500/30 h-10 sm:h-12 text-sm sm:text-base order-1 sm:order-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Package className="size-4 sm:size-5 mr-2" />
                                        Update Item
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
