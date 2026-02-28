"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-foreground hover:bg-primary/10 hover:text-primary transition-all">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground shadow-2xl rounded-xl p-1">
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer font-bold text-xs rounded-lg px-3 py-2 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-all">
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer font-bold text-xs rounded-lg px-3 py-2 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-all">
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer font-bold text-xs rounded-lg px-3 py-2 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-all">
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
