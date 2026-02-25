"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const GRAMS_PER_TICKAL = 16.6;

export function PriceCalculator() {
    const t = useTranslations("price_calculator");
    const [weight, setWeight] = useState<string>("");
    const [goldPrice, setGoldPrice] = useState<string>("");
    const [quality, setQuality] = useState<string>("p15");
    const [type, setType] = useState<string>("sell");
    const [yway, setYway] = useState<string>("");
    const [pe, setPe] = useState<string>("");
    const [results, setResults] = useState<{
        goldPrice: number,
        finalPrice: number,
        totalWeightValue?: number,
        deductionValue?: number
    } | null>(null);

    const formatWithCommas = (value: string) => {
        const cleanValue = value.replace(/,/g, '');
        if (cleanValue === '') return '';
        if (isNaN(Number(cleanValue))) return value;
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleGoldPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/,/g, '');
        // Allow numeric values, decimals, and empty strings
        if (cleanValue === '' || !isNaN(Number(cleanValue)) || cleanValue === '.') {
            setGoldPrice(cleanValue);
            setResults(null); // Reset results when price changes
        }
    };

    const handleFieldChange = (setter: (v: string) => void, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Strip dots and decimals

        if (value === "") {
            setter("");
            setResults(null);
            return;
        }

        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            if (num > max) setter(max.toString());
            else if (num < 0) setter("0");
            else setter(num.toString());
        }
        setResults(null);
    };

    const handleCalculate = () => {
        const w = parseFloat(weight);
        const p = parseFloat(goldPrice);

        if (isNaN(w) || isNaN(p)) return;

        const weightInTickal = w / GRAMS_PER_TICKAL;
        let peValue = 0;

        switch (quality) {
            case "p15": peValue = 15; break;
            case "p14_2": peValue = 14.5; break;
            case "p13": peValue = 13; break;
            case "p12": peValue = 12; break;
            case "p11": peValue = 11; break;
            case "p10": peValue = 10; break;
            case "p9": peValue = 9; break;
            case "p8": peValue = 8; break;
            default: peValue = 15;
        }

        let calculatedGoldPrice = 0;
        if (type === "sell") {
            const divisor = 16 + (16 - peValue);
            calculatedGoldPrice = (16 / divisor) * p;
        } else {
            let peFactor = peValue;
            if (quality === "p14_2") {
                peFactor = 14;
            }
            calculatedGoldPrice = (peFactor / 16) * p;
        }

        let totalWeightValue = weightInTickal * calculatedGoldPrice;
        let finalPrice = totalWeightValue;
        let deductionValue = 0;

        if (type === "buy") {
            const ywayVal = Math.abs(parseFloat(yway) || 0);
            const peVal = Math.abs(parseFloat(pe) || 0);
            // Formula: ((Yway / 8 + Pe) / 16) * GoldPrice
            deductionValue = ((ywayVal / 8 + peVal) / 16) * calculatedGoldPrice;
            finalPrice = totalWeightValue - deductionValue;
        }

        setResults({
            goldPrice: calculatedGoldPrice,
            totalWeightValue: totalWeightValue,
            deductionValue: deductionValue,
            finalPrice: finalPrice
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-amber-100/80 hover:text-amber-100 hover:bg-slate-800/50 rounded-xl size-10 flex items-center justify-center transition-colors"
                    title={t("title")}
                >
                    <Calculator className="size-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[92vh] flex flex-col p-0 bg-slate-900/95 backdrop-blur-xl border-amber-500/20 text-slate-100 shadow-2xl shadow-amber-500/5 overflow-hidden">
                <DialogHeader className="p-6 pb-2 relative shrink-0">
                    <div className="mx-auto bg-amber-500/10 p-2.5 rounded-2xl w-fit mb-2 border border-amber-500/20">
                        <Calculator className="size-5 text-amber-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent text-center">
                        {t("title")}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-center text-xs">
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2.5">
                            <Label htmlFor="weight" className="text-sm font-medium text-amber-100/70 ml-1">
                                {t("weight")}
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="weight"
                                    type="number"
                                    placeholder="0.00"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="bg-slate-950/40 border-amber-500/10 focus:border-amber-500/40 focus:ring-amber-500/20 h-12 rounded-xl transition-all pl-4 text-slate-100"
                                />
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="goldPrice" className="text-sm font-medium text-amber-100/70 ml-1">
                                {t("goldPrice")}
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="goldPrice"
                                    type="text"
                                    placeholder="0.00"
                                    value={formatWithCommas(goldPrice)}
                                    onChange={handleGoldPriceChange}
                                    className="bg-slate-950/40 border-amber-500/10 focus:border-amber-500/40 focus:ring-amber-500/20 h-12 rounded-xl transition-all pl-4 text-slate-100"
                                />
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2.5">
                                <Label htmlFor="quality" className="text-sm font-medium text-amber-100/70 ml-1">
                                    {t("materialQuality")}
                                </Label>
                                <Select value={quality} onValueChange={setQuality}>
                                    <SelectTrigger className="bg-slate-950/40 border-amber-500/10 focus:ring-amber-500/20 h-12 rounded-xl transition-all text-slate-300">
                                        <SelectValue placeholder={t("materialQuality")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-amber-500/20 text-slate-100 rounded-xl max-h-[250px]">
                                        <SelectItem value="p15" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p15")}</SelectItem>
                                        <SelectItem value="p14_2" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p14_2")}</SelectItem>
                                        <SelectItem value="p13" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p13")}</SelectItem>
                                        <SelectItem value="p12" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p12")}</SelectItem>
                                        <SelectItem value="p11" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p11")}</SelectItem>
                                        <SelectItem value="p10" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p10")}</SelectItem>
                                        <SelectItem value="p9" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p9")}</SelectItem>
                                        <SelectItem value="p8" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">{t("qualityOptions.p8")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2.5">
                                <Label htmlFor="type" className="text-sm font-medium text-amber-100/70 ml-1">
                                    {t("type")}
                                </Label>
                                <Select value={type} onValueChange={(val) => { setType(val); setResults(null); }}>
                                    <SelectTrigger className="bg-slate-950/40 border-amber-500/10 focus:ring-amber-500/20 h-12 rounded-xl transition-all text-slate-300">
                                        <SelectValue placeholder={t("type")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-amber-500/20 text-slate-100 rounded-xl">
                                        <SelectItem value="buy" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">
                                            {t("buy")}
                                        </SelectItem>
                                        <SelectItem value="sell" className="focus:bg-amber-500 focus:text-slate-900 cursor-pointer rounded-lg m-1">
                                            {t("sell")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {type === "buy" && (
                            <div className="grid gap-3 p-4 bg-slate-950/20 rounded-2xl border border-amber-500/5 transition-all animate-in slide-in-from-top-1 duration-200">
                                <Label className="text-sm font-medium text-amber-100/70 ml-1">
                                    {t("makingCharges")}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 relative group/yway">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={yway}
                                            min={0}
                                            max={7}
                                            step="1"
                                            onChange={handleFieldChange(setYway, 7)}
                                            className="bg-slate-950/40 border-amber-500/10 focus:border-amber-500/40 focus:ring-amber-500/20 h-11 rounded-xl transition-all pr-12"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-amber-200/40 pointer-events-none group-focus-within/yway:text-amber-500/60 transition-colors">
                                            {t("yway")}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative group/pe">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={pe}
                                            min={0}
                                            max={15}
                                            step="1"
                                            onChange={handleFieldChange(setPe, 15)}
                                            className="bg-slate-950/40 border-amber-500/10 focus:border-amber-500/40 focus:ring-amber-500/20 h-11 rounded-xl transition-all pr-12"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-amber-200/40 pointer-events-none group-focus-within/pe:text-amber-500/60 transition-colors">
                                            {t("pe")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {results && (
                            <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-amber-500/10 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-amber-100/60 text-xs font-medium flex items-center gap-1.5 uppercase tracking-wider">
                                            <Info className="size-3" />
                                            {t("goldPricePerQuality")}
                                        </span>
                                    </div>
                                    <div className="text-amber-200/90 font-semibold text-base">
                                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.goldPrice)} MMK
                                    </div>
                                </div>

                                {type === "buy" && results.totalWeightValue !== undefined && results.deductionValue !== undefined && (
                                    <>
                                        <div className="p-4 bg-slate-950/40 rounded-2xl border border-amber-500/10 backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-amber-100/60 text-xs font-medium flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Info className="size-3" />
                                                    {t("totalWeightValue")}
                                                </span>
                                            </div>
                                            <div className="text-amber-200/90 font-semibold text-base">
                                                {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.totalWeightValue)} MMK
                                            </div>
                                        </div>

                                        <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 backdrop-blur-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-red-200/60 text-xs font-medium flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Info className="size-3" />
                                                    {t("deductionPrice")}
                                                </span>
                                            </div>
                                            <div className="text-red-300/90 font-semibold text-base">
                                                - {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.deductionValue)} MMK
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-amber-100/70 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                            <Calculator className="size-3" />
                                            {t("finalPrice")}
                                        </span>
                                    </div>
                                    <div className="text-amber-400 font-bold text-xl">
                                        {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.finalPrice)} MMK
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 shrink-0 border-t border-amber-500/10 bg-slate-900/50 backdrop-blur-md">
                    <Button
                        onClick={handleCalculate}
                        disabled={!weight || !goldPrice}
                        className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold h-12 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t("calculate")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
