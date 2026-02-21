"use client";

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Receipt, TrendingUp, Diamond, Warehouse, Newspaper, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations('common');
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/news', label: t('news'), icon: Newspaper },
        { path: '/inventory', label: t('inventory'), icon: Warehouse },
        { path: '/invoice', label: t('invoice'), icon: Receipt },
        { path: '/sales', label: t('sales'), icon: TrendingUp },
        { path: '/settings', label: t('settings'), icon: Settings },
    ];

    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="bg-slate-950/50 backdrop-blur-xl border-b border-amber-500/20 sticky top-0 z-50">
                <div className="px-4 sm:px-8 py-5">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <Link href="/" className="flex items-center gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl blur-sm opacity-75"></div>
                                <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 sm:p-3 rounded-xl">
                                    <Diamond className="size-6 sm:size-7 text-slate-900" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                                    {t('title')}
                                </h1>
                                <p className="text-xs sm:text-sm text-amber-200/60 flex items-center gap-1">
                                    {t('tagline')}
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4">
                            <nav className="flex gap-3">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.path || (pathname === '/' && item.path === '/news');

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all relative group
                        ${isActive
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30'
                                                    : 'text-amber-100/80 hover:text-amber-100 hover:bg-slate-800/50'
                                                }
                      `}
                                        >
                                            <Icon className="size-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="ml-4 pl-4 border-l border-amber-500/20">
                                <LanguageSwitcher />
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-2 md:hidden">
                            <LanguageSwitcher />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg text-amber-100 hover:bg-slate-800/50 transition-colors"
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
                        <nav className="md:hidden mt-4 pt-4 border-t border-amber-500/20">
                            <div className="flex flex-col gap-2">
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
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30'
                                                    : 'text-amber-100/80 hover:text-amber-100 hover:bg-slate-800/50'
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
            <main className="p-4 sm:p-8">
                {children}
            </main>
        </div>
    );
}
