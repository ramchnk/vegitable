
'use client';

import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/context/transaction-provider';
import { BuyersLedgerDialog } from '@/components/settings/buyers-ledger-dialog';
import { SupplierLedgerDialog } from '@/components/settings/supplier-ledger-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import type { DailyAccountSummary } from '@/lib/types';


const SummaryCard = ({ title, titleClassName, titleTextClassName, children }: { title: string, titleClassName?: string, titleTextClassName?: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader className={cn("p-3 rounded-t-lg", titleClassName)}>
            <CardTitle className={cn("text-sm font-medium", titleTextClassName)}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-card">
            {children}
        </CardContent>
    </Card>
);

const DefaultSummaryCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader className="p-3 rounded-t-lg border-b bg-card">
            <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-card">
            {children}
        </CardContent>
    </Card>
)


export default function AccountsPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [activeDate, setActiveDate] = useState<Date | undefined>(new Date());
    const [isBuyerLedgerOpen, setIsBuyerLedgerOpen] = useState(false);
    const [isSupplierLedgerOpen, setIsSupplierLedgerOpen] = useState(false);
    const { transactions, dailySummaries, saveDailySummary } = useTransactions();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [openingBalance, setOpeningBalance] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [finalNote, setFinalNote] = useState('');

    useEffect(() => {
        if (activeDate) {
            const summaryForDate = dailySummaries.find(s => s.date === format(activeDate, 'yyyy-MM-dd'));
            if (summaryForDate) {
                setOpeningBalance(summaryForDate.openingBalance);
                setTotalExpenses(summaryForDate.totalExpenses);
                setFinalNote(summaryForDate.finalNote);
            } else {
                setOpeningBalance(0);
                setTotalExpenses(0);
                setFinalNote('');
            }
        }
    }, [activeDate, dailySummaries]);

    const { dailySales, totalSales } = useMemo(() => {
        if (!activeDate) return { dailySales: [], totalSales: 0 };

        const salesForDate = transactions.filter(t =>
            t.type === 'Sale' &&
            format(new Date(t.date), 'yyyy-MM-dd') === format(activeDate, 'yyyy-MM-dd')
        );

        const salesByCustomer = salesForDate.reduce((acc, curr) => {
            if (!acc[curr.party]) {
                acc[curr.party] = 0;
            }
            acc[curr.party] += curr.amount;
            return acc;
        }, {} as Record<string, number>);

        const dailySalesData = Object.entries(salesByCustomer).map(([customer, amount]) => ({ customer, amount }));
        const total = dailySalesData.reduce((sum, sale) => sum + sale.amount, 0);

        return { dailySales: dailySalesData, totalSales: total };
    }, [activeDate, transactions]);

    const { dailyPurchases, totalPurchases } = useMemo(() => {
        if (!activeDate) return { dailyPurchases: [], totalPurchases: 0 };

        const purchasesForDate = transactions.filter(t =>
            t.type === 'Purchase' &&
            format(new Date(t.date), 'yyyy-MM-dd') === format(activeDate, 'yyyy-MM-dd')
        );

        const purchasesBySupplier = purchasesForDate.reduce((acc, curr) => {
            if (!acc[curr.party]) {
                acc[curr.party] = 0;
            }
            acc[curr.party] += curr.amount;
            return acc;
        }, {} as Record<string, number>);

        const dailyPurchasesData = Object.entries(purchasesBySupplier).map(([supplier, amount]) => ({ supplier, amount }));
        const total = dailyPurchasesData.reduce((sum, purchase) => sum + purchase.amount, 0);

        return { dailyPurchases: dailyPurchasesData, totalPurchases: total };
    }, [activeDate, transactions]);

    const handleLoad = () => {
        setActiveDate(selectedDate);
    }

    const closingBalance = useMemo(() => {
        return openingBalance + totalSales - totalPurchases - totalExpenses;
    }, [openingBalance, totalSales, totalPurchases, totalExpenses]);

    const handleSave = () => {
        if (!activeDate) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a date first.",
            });
            return;
        }

        const summary: DailyAccountSummary = {
            date: format(activeDate, 'yyyy-MM-dd'),
            openingBalance,
            totalExpenses,
            finalNote,
        };
        saveDailySummary(summary);
        toast({
            title: "Success",
            description: "Account summary has been saved.",
        });
    };


    return (
        <>
            <Header title={t('accounts.title')}>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "dd-MM-yyyy") : <span>{t('forms.pick_date')}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleLoad}>{t('accounts.load')}</Button>
                </div>
            </Header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-background">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <DefaultSummaryCard title={t('accounts.opening_balance')}>
                        <Input
                            type="number"
                            placeholder="0"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                        />
                    </DefaultSummaryCard>
                    <DefaultSummaryCard title={t('accounts.total_expenses')}>
                        <Input
                            type="number"
                            placeholder="0"
                            value={totalExpenses}
                            onChange={(e) => setTotalExpenses(parseFloat(e.target.value) || 0)}
                        />
                    </DefaultSummaryCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SummaryCard title={t('accounts.money_out')} titleClassName="bg-destructive" titleTextClassName="text-destructive-foreground">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('forms.supplier')}</TableHead>
                                    <TableHead className="text-right">{t('forms.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyPurchases.length > 0 ? (
                                    dailyPurchases.map(purchase => (
                                        <TableRow key={purchase.supplier}>
                                            <TableCell>{purchase.supplier}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center">No purchases for this date.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-bold">Total</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(totalPurchases)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </SummaryCard>
                    <SummaryCard title={t('accounts.money_in')} titleClassName="bg-secondary" titleTextClassName="text-secondary-foreground">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('forms.customer')}</TableHead>
                                    <TableHead className="text-right">{t('forms.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailySales.length > 0 ? (
                                    dailySales.map(sale => (
                                        <TableRow key={sale.customer}>
                                            <TableCell>{sale.customer}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center">No receipts for this date.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-bold">Total</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(totalSales)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </SummaryCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <SummaryCard title={t('accounts.final_summary')} titleClassName="bg-primary" titleTextClassName="text-primary-foreground">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>{t('payments.opening_balance_debit')}</span><span>{formatCurrency(openingBalance)}</span></div>
                            <p className="font-semibold text-primary">{t('forms.credit')}</p>
                            <div className="flex justify-between pl-4"><span>{t('accounts.ready_cash')}</span><span>0</span></div>
                            <div className="flex justify-between pl-4"><span>{t('accounts.money_in')}</span><span>{formatCurrency(totalSales)}</span></div>
                            <p className="font-semibold text-destructive">{t('forms.debit')}</p>
                            <div className="flex justify-between pl-4"><span>{t('accounts.money_out')}</span><span>{formatCurrency(totalPurchases)}</span></div>
                            <div className="flex justify-between pl-4"><span>{t('accounts.total_expenses')}</span><span>{formatCurrency(totalExpenses)}</span></div>
                            <hr className="my-2" />
                            <div className="flex justify-between font-bold"><span>{t('payments.closing_balance')}</span><span>{formatCurrency(closingBalance)}</span></div>
                        </div>
                    </SummaryCard>

                    <SummaryCard title={t('accounts.sales_summary')} titleClassName="bg-accent" titleTextClassName="text-accent-foreground">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>{t('accounts.ready_cash')}</span><span>0</span></div>
                            <div className="flex justify-between"><span>{t('forms.gpay')}</span><span>0</span></div>
                            <div className="flex justify-between"><span>{t('forms.credit')}</span><span>2000</span></div>
                            <hr className="my-2 border-accent-foreground/20" />
                            <div className="flex justify-between font-bold"><span>{t('dashboard.sales')}</span><span>0</span></div>
                            <div className="flex justify-between text-destructive"><span>{t('forms.discount')}</span><span>0</span></div>
                        </div>
                    </SummaryCard>

                    <SummaryCard title="Salesman Based Sales" titleClassName="bg-accent" titleTextClassName="text-accent-foreground">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between border-b pb-1 border-accent-foreground/20"><span>1. Salesman 1</span><span>0.00</span></div>
                            <div className="flex justify-between border-b pb-1 border-accent-foreground/20"><span>2. Salesman 2</span><span>0.00</span></div>
                            <div className="flex justify-between border-b pb-1 border-accent-foreground/20"><span>3. Salesman 3</span><span>0.00</span></div>
                            <div className="flex justify-between border-b pb-1 border-accent-foreground/20"><span>4. Salesman 4</span><span>0.00</span></div>
                        </div>
                    </SummaryCard>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('accounts.final_note')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            id="final-note"
                            placeholder={t('accounts.final_note')}
                            value={finalNote}
                            onChange={(e) => setFinalNote(e.target.value)}
                        />
                    </CardContent>
                </Card>


                <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                    <Button onClick={handleSave}>{t('actions.save')}</Button>
                    <Button variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full md:w-auto" onClick={() => setIsSupplierLedgerOpen(true)}>{t('accounts.supplier_ledger')}</Button>
                    <Button variant="default" className="w-full md:w-auto" onClick={() => setIsBuyerLedgerOpen(true)}>{t('accounts.buyer_ledger')}</Button>
                </div>
            </main>
            <BuyersLedgerDialog
                open={isBuyerLedgerOpen}
                onOpenChange={setIsBuyerLedgerOpen}
                date={activeDate}
            />
            <SupplierLedgerDialog
                open={isSupplierLedgerOpen}
                onOpenChange={setIsSupplierLedgerOpen}
                date={activeDate}
                dailyPurchases={dailyPurchases}
                totalPurchases={totalPurchases}
            />
        </>
    );
}
