
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Leaf,
    LineChart,
    LogOut,
    ShoppingCart,
    ShoppingBasket,
    CreditCard,
    Users,
    User,
    Package,
} from "lucide-react";


import { useLanguage } from "@/context/language-context";

const menuItems = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LineChart, key: 'dashboard' },
    { href: '/vegetable-intake', labelKey: 'nav.purchase', icon: ShoppingBasket, key: 'vegetable-intake' },
    { href: '/sales', labelKey: 'nav.sales', icon: ShoppingCart, key: 'sales' },
    { href: '/credits', labelKey: 'nav.payments', icon: CreditCard, key: 'credits' },
    { href: '/products', labelKey: 'nav.products', icon: Package, key: 'products' },
    { href: '/purchase/suppliers', labelKey: 'nav.suppliers', icon: Users, key: 'suppliers' },
    { href: '/sales/customers', labelKey: 'nav.customers', icon: User, key: 'customers' },
    { href: '/login', labelKey: 'nav.logout', icon: LogOut, key: 'logout' },
]

export function SidebarNav() {
    const pathname = usePathname();
    const { t, language } = useLanguage();

    const getIsActive = (href: string, currentPathname: string) => {
        if (href === '/dashboard') {
            return currentPathname === '/dashboard' || currentPathname === '/';
        }
        if (href === '#' || href === '/login') {
            return false;
        }
        if (href === '/sales' && (currentPathname.startsWith('/sales/customers') || currentPathname.startsWith('/sales/payments'))) {
            return false;
        }
        if (href === '/credits' && (currentPathname.startsWith('/credits') || currentPathname.startsWith('/sales/payments') || currentPathname.startsWith('/purchase/payments'))) {
            return true;
        }
        return currentPathname.startsWith(href);
    }

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-primary">
                        <Leaf className="h-6 w-6" />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-base font-semibold">OM SARAVANA</h2>
                        <p className="text-xs text-muted-foreground">VEGETABLES</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.key}>
                            <SidebarMenuButton
                                asChild
                                isActive={getIsActive(item.href, pathname)}
                                className="w-full justify-start"
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {t(item.labelKey)}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2 border-t">
                <div className="hidden">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/seed/1/100/100" alt="@owner" data-ai-hint="man portrait" />
                        <AvatarFallback>SO</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Shop Owner</span>
                        <span className="text-xs text-muted-foreground">owner@email.com</span>
                    </div>
                </div>
            </SidebarFooter>
        </>
    )
}
