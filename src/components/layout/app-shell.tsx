'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { AddCustomerDialog } from '@/components/sales/add-customer-dialog';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                setIsTransactionDialogOpen(true);
            }
            if (e.key === 'F2') {
                e.preventDefault();
                router.push('/products?edit=true');
            }
            if (e.key === 'F7') {
                e.preventDefault();
                setIsAddCustomerDialogOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [router]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <SidebarInset>
                {children}
                <TransactionDialog
                    open={isTransactionDialogOpen}
                    onOpenChange={setIsTransactionDialogOpen}
                    type="Customer"
                />
                <AddCustomerDialog
                    open={isAddCustomerDialogOpen}
                    onOpenChange={setIsAddCustomerDialogOpen}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}
