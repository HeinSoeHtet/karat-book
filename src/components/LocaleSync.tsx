"use client";

import { useEffect } from 'react';

export function LocaleSync({ locale }: { locale: string }) {
    useEffect(() => {
        // Store in local storage as requested
        localStorage.setItem('NEXT_LOCALE', locale);
        // Also set cookie so the server-side proxy/middleware can pick it up
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    }, [locale]);

    return null;
}
