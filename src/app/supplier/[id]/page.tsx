
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
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
import { Calendar as CalendarIcon, Download, Printer, MessageCircle, ShoppingCart, TrendingUp, TrendingDown, Eye, User, MapPin, Wallet } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function SupplierLedgerPage() {
    const params = useParams();
    const supplierId = params.id as string;

    const { suppliers, transactions, supplierPayments } = useTransactions();
    const { toast } = useToast();
    const { t } = useLanguage();

    const [date, setDate] = useState<DateRange | undefined>();
    const [tempDate, setTempDate] = useState<DateRange | undefined>();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
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
                    <Link href="/supplier">
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
            'Paid Amount': `${formatCurrency(t.credit)}${t.paymentMethods ? ` (${t.paymentMethods})` : ''}`,
            'Closing Balance': formatCurrency(t.closing),
        }));

        const summary = {
            Date: 'Summary',
            'Opening Balance': formatCurrency(openingBalance),
            'Purchases': formatCurrency(totalPurchases),
            'Paid Amount': formatCurrency(totalCredit),
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
            <Header title="Payment Dues" backHref="/supplier" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 print:p-0">
                <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-left">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Purchase Account Statement</h1>
                    <p className="text-sm font-bold text-slate-800">OM Saravana Vegetables</p>
                    {date?.from && (
                        <p className="text-xs mt-1">Period: {format(date.from, "dd/MM/yyyy")} to {date.to ? format(date.to, "dd/MM/yyyy") : 'Today'}</p>
                    )}
                </div>
                <Card className="print:border-none print:shadow-none">
                    <CardHeader className="pb-4 border-b bg-slate-50/50 print:bg-white print:pb-6">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 print:items-start print:justify-start">
                            <div className="flex flex-col gap-3 print:gap-1">
                                <div className="flex items-center gap-3 print:gap-0">
                                    <div className="p-2 bg-primary/10 rounded-lg no-print">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-black print:text-[8px]">Supplier Name</span>
                                        <h2 className="text-xl font-black text-[#064e3b] print:text-black print:text-2xl">{supplier.name}</h2>
                                    </div>
                                </div>
                                {supplier.address && (
                                    <div className="flex items-center gap-3 ml-1 print:ml-0 print:gap-0">
                                        <div className="p-2 bg-indigo-50 rounded-lg no-print">
                                            <MapPin className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-black print:text-[8px]">Address</span>
                                            <p className="text-sm font-semibold text-slate-700 print:text-black">{supplier.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-end mb-1 no-print">
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full md:w-[300px] justify-start text-left font-normal bg-white",
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
                                    <PopoverContent className="w-auto p-0 flex" align="end">
                                        <div className="flex flex-col border-r bg-muted/10 min-w-[140px] p-2 gap-1 no-print">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-2">Presets</span>
                                            {[
                                                { label: 'Today', getValue: () => ({ from: startOfToday(), to: endOfToday() }) },
                                                { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
                                                { label: 'Last Week', getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
                                                { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
                                                { label: 'Last Month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
                                                { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
                                                { label: 'Last Year', getValue: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
                                            ].map((preset) => (
                                                <Button
                                                    key={preset.label}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="justify-start font-bold text-[#064e3b] hover:bg-primary/10 h-8"
                                                    onClick={() => {
                                                        const range = preset.getValue();
                                                        setTempDate(range);
                                                    }}
                                                >
                                                    {preset.label}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                                                <span className="text-sm font-medium">Select Date Range</span>
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    disabled={!tempDate?.from || !tempDate?.to}
                                                    onClick={() => {
                                                        setDate(tempDate);
                                                        setIsPopoverOpen(false);
                                                    }}
                                                >
                                                    Apply
                                                </Button>
                                            </div>
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={tempDate}
                                                onSelect={setTempDate}
                                                numberOfMonths={2}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">Filter</Button>
                                <Link href={`/purchase/payments?supplierId=${supplierId}`}>
                                    <Button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-md font-bold border-none">
                                        <Wallet className="h-4 w-4 mr-2" />
                                        {t('payments.supplier_payment')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 print:pt-4">


                        <Card className="relative overflow-hidden border-none shadow-xl bg-white/20 backdrop-blur-md print:bg-white print:border print:border-black print:shadow-none print:backdrop-blur-none">
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
                                    <TableRow className="bg-emerald-50/50">
                                        <TableHead className="print:text-center">Date</TableHead>
                                        <TableHead className="text-right print:text-center">Opening Balance</TableHead>
                                        <TableHead className="text-right print:text-center">
                                            <div className="flex items-center justify-end gap-1 print:justify-center">
                                                <ShoppingCart className="h-4 w-4 text-sky-600" /> Purchases
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right print:text-center">
                                            <div className="flex items-center justify-end gap-1 print:justify-center">
                                                <TrendingDown className="h-4 w-4 text-green-600" /> Paid Amount
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right print:text-center">Closing Balance</TableHead>
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
                                                <TableCell className="print:text-center">{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-right font-medium text-muted-foreground print:text-center">{formatCurrency(t.opening)}</TableCell>
                                                <TableCell className="text-right text-sky-600 font-bold print:text-center">{formatCurrency(t.amount)}</TableCell>
                                                <TableCell className="text-right text-green-600 font-bold whitespace-nowrap print:text-center">
                                                    {t.credit > 0 ? (
                                                        <div className="flex flex-col items-end gap-1 print:items-center">
                                                            <div className="flex items-center gap-2 print:justify-center">
                                                                <span>{formatCurrency(t.credit)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 no-print"
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
                                                <TableCell className="text-right font-bold text-slate-900 print:text-center">{formatCurrency(t.closing)}</TableCell>
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
                                {selectedTransactions.sort((a, b) => {
                                    const timeA = new Date(a.createdAt || a.date).getTime();
                                    const timeB = new Date(b.createdAt || b.date).getTime();
                                    return timeB - timeA;
                                }).map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(tx.createdAt || tx.date), "dd/MM/yyyy HH:mm")}
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
