
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Leaf,
  LineChart,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  MoreHorizontal,
  Users,
} from "lucide-react";


const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LineChart },
    { href: '/vegetable-intake', label: 'Vegetable Intake', icon: Leaf },
    { href: '/sales', label: 'Sales', icon: ShoppingCart },
    { href: '/purchase', label: 'Purchase', icon: Truck },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/reports', label: 'Transaction Report', icon: LineChart },
    { href: '/credits', label: 'Credits', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
    const pathname = usePathname();

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
                                isActive={pathname.startsWith(item.href)}
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
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src="https://picsum.photos/seed/1/100/100" alt="@owner" data-ai-hint="man portrait" />
                              <AvatarFallback>SO</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">Shop Owner</span>
                              <span className="text-xs text-muted-foreground">owner@email.com</span>
                          </div>
                          <MoreHorizontal className="ml-auto h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Link href="/settings" className="flex items-center w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </>
    )
}
