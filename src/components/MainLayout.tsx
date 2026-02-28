"use client";

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Receipt, TrendingUp, Diamond, Warehouse, Newspaper, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PriceCalculator } from './PriceCalculator';
import { ThemeToggle } from './ThemeToggle';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations('common');
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/news', label: t('news'), icon: Newspaper },
        { path: '/inventory', label: t('inventory'), icon: Warehouse },
        { path: '/invoice', label: t('invoice'), icon: Receipt },
        { path: '/analytics', label: t('analytics'), icon: TrendingUp },
        { path: '/settings', label: t('settings'), icon: Settings },
    ];

    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Header */}
            <header className="bg-card/50 backdrop-blur-xl border-b border-border sticky top-0 z-50">
                <div className="px-4 sm:px-8 py-5">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 sm:p-3 rounded-xl shadow-lg shadow-amber-500/20">
                                    <Diamond className="size-6 sm:size-7 text-slate-950" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 dark:from-amber-200 dark:to-amber-400 bg-clip-text text-transparent">
                                    {t('title')}
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                    {t('tagline')}
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4">
                            <nav className="flex gap-1.5">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.path || (pathname === '/' && item.path === '/news');

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group
                        ${isActive
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                }
                      `}
                                        >
                                            <Icon className="size-4.5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="ml-4 pl-4 border-l border-border flex items-center gap-2">
                                <PriceCalculator />
                                <LanguageSwitcher />
                                <ThemeToggle />
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <PriceCalculator />
                            <LanguageSwitcher />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors border border-border"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="size-6" />
                                ) : (
                                    <Menu className="size-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMobileMenuOpen && (
                        <nav className="md:hidden mt-4 pt-4 border-t border-border animate-in slide-in-from-top-4 duration-200">
                            <div className="flex flex-col gap-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.path || (pathname === '/' && item.path === '/news');

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={handleNavClick}
                                            className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                }
                      `}
                                        >
                                            <Icon className="size-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
