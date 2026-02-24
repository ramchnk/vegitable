
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTransactions } from '@/context/transaction-provider';
import { formatCurrency, cn, downloadCsv } from '@/lib/utils';
import { ArrowLeft, Calendar as CalendarIcon, Download, Printer, MessageCircle, ShoppingCart, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

export default function SupplierLedgerPage() {
    const params = useParams();
    const supplierId = params.id as string;

    const { suppliers, transactions, supplierPayments } = useTransactions();
    const { toast } = useToast();

    const [date, setDate] = useState<DateRange | undefined>();
    const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [suppliers, supplierId]);

    const supplierPaymentDetail = useMemo(() => supplierPayments.find(p => p.partyId === supplierId), [supplierPayments, supplierId]);

    const { periodTransactions, openingBalance, totalPurchases, totalCredit, closingBalance } = useMemo(() => {
        if (!supplier || !supplierPaymentDetail) {
            return { periodTransactions: [], openingBalance: 0, totalPurchases: 0, totalCredit: 0, closingBalance: 0 };
        }

        const normalizedName = supplier.name.toLowerCase().trim();
        const allSupplierTransactions = transactions.filter(t =>
            t.party.toLowerCase().trim() === normalizedName &&
            (t.type === 'Purchase' || t.type === 'Payment')
        );

        // Formula: Initial Adjustment = Current Outstanding - Total Purchases Ever + Total Payments Ever
        const totalPurchasesEver = allSupplierTransactions.reduce((acc, t) => acc + (t.type === 'Purchase' ? t.amount : 0), 0);
        const totalPaymentsEver = allSupplierTransactions.reduce((acc, t) => acc + (t.type === 'Payment' ? t.amount : 0), 0);
        const ghostBalance = (supplierPaymentDetail.dueAmount) - (totalPurchasesEver - totalPaymentsEver);

        const initialOpeningBalance = ghostBalance;

        const transactionsBeforePeriod = date?.from
            ? allSupplierTransactions.filter(t => new Date(t.date) < new Date(date.from!))
            : [];

        const openingBalanceForPeriod = transactionsBeforePeriod.reduce((acc, t) => {
            if (t.type === 'Purchase') return acc + t.amount;
            if (t.type === 'Payment') return acc - t.amount;
            return acc;
        }, initialOpeningBalance);

        let filteredTransactions = allSupplierTransactions;
        if (date?.from) {
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                transactionDate.setHours(0, 0, 0, 0);
                const fromDate = new Date(date.from!);
                fromDate.setHours(0, 0, 0, 0);

                if (date.to) {
                    const toDate = new Date(date.to);
                    toDate.setHours(0, 0, 0, 0);
                    return transactionDate >= fromDate && transactionDate <= toDate;
                }
                return transactionDate.getTime() === fromDate.getTime();
            });
        }

        const periodPurchases = filteredTransactions.reduce((acc, t) => acc + (t.type === 'Purchase' ? t.amount : 0), 0);
        const periodCredit = filteredTransactions.reduce((acc, t) => acc + (t.type === 'Payment' ? t.amount : 0), 0);

        // Group by day for ledger view
        const dailyGroups: Record<string, { date: string; purchases: number; credit: number; payments: string[]; txList: any[] }> = {};

        filteredTransactions.forEach(t => {
            const dateStr = format(new Date(t.date), "yyyy-MM-dd");
            if (!dailyGroups[dateStr]) {
                dailyGroups[dateStr] = {
                    date: t.date,
                    purchases: 0,
                    credit: 0,
                    payments: [],
                    txList: []
                };
            }
            dailyGroups[dateStr].txList.push(t);
            if (t.type === 'Purchase') {
                dailyGroups[dateStr].purchases += t.amount;
            } else if (t.type === 'Payment') {
                dailyGroups[dateStr].credit += t.amount;
                if (t.payment && !dailyGroups[dateStr].payments.includes(t.payment)) {
                    dailyGroups[dateStr].payments.push(t.payment);
                }
            }
        });

        const sortedDates = Object.keys(dailyGroups).sort();
        let currentBalance = openingBalanceForPeriod;

        const ledgerEntries = sortedDates.map(dateKey => {
            const group = dailyGroups[dateKey];
            const entry = {
                id: dateKey,
                date: group.date,
                opening: currentBalance,
                amount: group.purchases,
                credit: group.credit,
                paymentMethods: group.payments.join(", "),
                closing: currentBalance + group.purchases - group.credit,
                transactions: group.txList,
            };
            currentBalance = entry.closing;
            return entry;
        });

        return {
            periodTransactions: ledgerEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            openingBalance: openingBalanceForPeriod,
            totalPurchases: periodPurchases,
            totalCredit: periodCredit,
            closingBalance: currentBalance
        };

    }, [supplier, transactions, date, supplierPaymentDetail]);


    if (!supplier) {
        return (
            <>
                <Header title="Supplier Not Found" />
                <main className="flex flex-1 flex-col items-center justify-center p-4">
                    <p>The requested supplier could not be found.</p>
                    <Link href="/purchase/suppliers">
                        <Button variant="outline" className="mt-4">Back to Suppliers</Button>
                    </Link>
                </main>
            </>
        )
    }

    const handleExport = () => {
        const dataToExport = periodTransactions.map(t => ({
            Date: format(new Date(t.date), "dd/MM/yyyy"),
            'Opening Balance': formatCurrency(t.opening),
            'Purchases': formatCurrency(t.amount),
            'Credit Amount': `${formatCurrency(t.credit)}${t.paymentMethods ? ` (${t.paymentMethods})` : ''}`,
            'Closing Balance': formatCurrency(t.closing),
        }));

        const summary = {
            Date: 'Summary',
            'Opening Balance': formatCurrency(openingBalance),
            'Purchases': formatCurrency(totalPurchases),
            'Credit Amount': formatCurrency(totalCredit),
            'Closing Balance': formatCurrency(closingBalance)
        }

        downloadCsv([...dataToExport, {} as any, summary], `${supplier.name}_ledger.csv`);
    }

    const handleWhatsApp = () => {
        if (!supplier?.contact) {
            toast({
                variant: "destructive",
                title: "No Contact Info",
                description: "This supplier does not have a contact number.",
            });
            return;
        }

        const fromDate = date?.from ? format(date.from, "dd/MM/yyyy") : 'the beginning';
        const toDate = date?.to ? format(date.to, "dd/MM/yyyy") : 'today';

        let message = `Hello ${supplier.name},\n\nHere is your account statement from ${fromDate} to ${toDate}:\n\n`;
        message += `Opening Balance: ${formatCurrency(openingBalance)}\n`;
        message += `Total Purchases during period: ${formatCurrency(totalPurchases)}\n`;
        message += `*Closing Balance: ${formatCurrency(closingBalance)}*\n\n`;

        message += `Thank you,\nOM Saravana Vegetables`;

        const phoneNumber = supplier.contact.replace(/[^0-9]/g, '');
        const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    }

    const handlePrint = () => {
        window.print();
    }

    return (
        <>
            <Header title="Payment Dues" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-primary">{supplier.name}</CardTitle>
                            <Link href="/purchase/suppliers">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Supplier
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full md:w-[300px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "dd-MM-yyyy")} -{" "}
                                                    {format(date.to, "dd-MM-yyyy")}
                                                </>
                                            ) : (
                                                format(date.from, "dd-MM-yyyy")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Filter</Button>
                        </div>

                        <Card className="relative overflow-hidden border-none shadow-xl bg-white/20 backdrop-blur-md">
                            {/* Fluid Art Background Decoration */}
                            <div className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 33%, #fb7185 66%, #fb923c 100%)',
                                    filter: 'blur(50px) saturate(2)',
                                    transform: 'scale(1.1)'
                                }}
                            />

                            <CardHeader className="py-4 relative z-10">
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#0f172a]">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Account Insight
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6 relative z-10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                                    <div className="bg-white/40 rounded-xl p-3 shadow-sm border border-white/40">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Opening Balance</p>
                                        <p className="text-2xl font-black text-[#0f172a]">{formatCurrency(openingBalance)}</p>
                                    </div>
                                    <div className="bg-white/40 rounded-xl p-3 shadow-sm border border-white/40">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Purchases</p>
                                        <p className="text-2xl font-black text-[#1e40af]">{formatCurrency(totalPurchases)}</p>
                                    </div>
                                    <div className="bg-white/40 rounded-xl p-3 shadow-sm border border-white/40">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Paid</p>
                                        <p className="text-2xl font-black text-[#9d174d]">{formatCurrency(totalCredit)}</p>
                                    </div>
                                    <div className="bg-[#0f172a] rounded-xl p-3 shadow-md border border-white/10">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Closing Balance</p>
                                        <p className="text-2xl font-black text-white">{formatCurrency(closingBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={handlePrint}><Printer /></Button>
                                <Button variant="outline" size="icon" onClick={handleWhatsApp}><MessageCircle /></Button>
                                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Download</Button>
                            </div>
                        </div>


                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Opening Balance</TableHead>
                                        <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><ShoppingCart className="h-4 w-4 text-sky-600" /> Purchases</div></TableHead>
                                        <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><TrendingDown className="h-4 w-4 text-green-600" /> Credit Amount</div></TableHead>
                                        <TableHead className="text-right">Closing Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periodTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">No transactions for this period.</TableCell>
                                        </TableRow>
                                    ) : (
                                        periodTransactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-right font-medium text-muted-foreground">{formatCurrency(t.opening)}</TableCell>
                                                <TableCell className="text-right text-sky-600 font-bold">{formatCurrency(t.amount)}</TableCell>
                                                <TableCell className="text-right text-green-600 font-bold whitespace-nowrap">
                                                    {t.credit > 0 ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span>{formatCurrency(t.credit)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    onClick={() => {
                                                                        setSelectedTransactions(t.transactions);
                                                                        setIsHistoryDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground font-medium italic">({t.paymentMethods || 'Cash'})</span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">{formatCurrency(t.closing)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card >
            </main >

            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-green-600" />
                            Transaction History
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Item / Note</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(tx.date), "dd/MM/yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                tx.type === 'Purchase' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                            )}>
                                                {tx.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[150px] truncate">
                                            {tx.item || '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {tx.payment || 'Cash'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
