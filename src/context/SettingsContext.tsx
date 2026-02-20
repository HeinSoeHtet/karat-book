"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCategoriesAction, getMaterialsAction } from '@/app/actions/settingsActions';
import { toast } from 'sonner';

interface Option {
    id: string;
    name: string;
}

interface SettingsContextType {
    categories: Option[];
    materials: Option[];
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [categories, setCategories] = useState<Option[]>([]);
    const [materials, setMaterials] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const [catRes, matRes] = await Promise.all([
                getCategoriesAction(),
                getMaterialsAction()
            ]);

            if (catRes.success) setCategories(catRes.data || []);
            if (matRes.success) setMaterials(matRes.data || []);
        } catch (error) {
            console.error('Error refreshing settings:', error);
            toast.error('Failed to load system settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <SettingsContext.Provider value={{ categories, materials, isLoading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
