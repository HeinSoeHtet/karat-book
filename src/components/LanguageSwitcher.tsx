"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
    const t = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const onLocaleChange = (newLocale: string) => {
        router.push(pathname, { locale: newLocale });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-amber-100 hover:bg-slate-800/50">
                    <Languages className="size-5" />
                    <span className="sr-only">{t('language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-amber-500/20 text-amber-100">
                {routing.locales.map((cur) => (
                    <DropdownMenuItem
                        key={cur}
                        onClick={() => onLocaleChange(cur)}
                        className={`flex items-center gap-2 cursor-pointer ${locale === cur ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-slate-800'}`}
                    >
                        <span>{cur === 'en' ? 'English' : 'မြန်မာ'}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
