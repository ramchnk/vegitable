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
  CreditCard,
  Users,
  BookUser,
} from "lucide-react";


const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LineChart },
    { href: '/vegetable-intake', label: 'Vegetable Intake', icon: Leaf },
    { href: '/sales', label: 'Sales', icon: ShoppingCart },
    { href: '/credits', label: 'Payments', icon: CreditCard },
    { href: '/purchase/suppliers', label: 'Supplier', icon: Users },
    { href: '/sales/customers', label: 'Buyer', icon: Users },
    { href: '/settings', label: 'Accounts', icon: BookUser },
    { href: '#', label: 'Log out', icon: LogOut },
]

export function SidebarNav() {
    const pathname = usePathname();

    const getIsActive = (href: string, currentPathname: string) => {
        if (href === '/dashboard') {
            return currentPathname === '/dashboard' || currentPathname === '/';
        }
        if (href === '#') {
            return false;
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
                         <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={getIsActive(item.href, pathname)}
                                className="w-full justify-start"
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
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
