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
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted transition-all">
                    <Languages className="size-5" />
                    <span className="sr-only">{t('language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground shadow-2xl rounded-xl p-1">
                {routing.locales.map((cur) => (
                    <DropdownMenuItem
                        key={cur}
                        onClick={() => onLocaleChange(cur)}
                        className={`flex items-center gap-2 cursor-pointer font-bold text-xs rounded-lg transition-all px-3 py-2 ${locale === cur ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary'}`}
                    >
                        <span>{cur === 'en' ? 'English' : 'မြန်မာ'}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
