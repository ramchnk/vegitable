
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
import { ArrowLeft, Calendar as CalendarIcon, Download, Printer, MessageCircle, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerLedgerPage() {
    const params = useParams();
    const customerId = params.id as string;

    const { customers, transactions, customerPayments } = useTransactions();
    const { toast } = useToast();
    
    const [date, setDate] = useState<DateRange | undefined>();
    const [searchTerm, setSearchTerm] = useState('');

    const customer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);
    
    const customerPaymentDetail = useMemo(() => customerPayments.find(p => p.partyId === customerId), [customerPayments, customerId]);

    const { periodTransactions, openingBalance, totalSales, totalCredit, closingBalance } = useMemo(() => {
        if (!customer || !customerPaymentDetail) {
            return { periodTransactions: [], openingBalance: 0, totalSales: 0, totalCredit: 0, closingBalance: 0 };
        }
        
        const allCustomerTransactions = transactions.filter(t => t.party === customer.name && t.type === 'Sale');

        const initialOpeningBalance = customerPaymentDetail.totalAmount - customerPaymentDetail.paidAmount;

        const transactionsBeforePeriod = date?.from 
            ? allCustomerTransactions.filter(t => new Date(t.date) < new Date(date.from!))
            : [];

        const openingBalanceForPeriod = transactionsBeforePeriod.reduce((acc, t) => acc + t.amount, initialOpeningBalance);
        
        let filteredTransactions = allCustomerTransactions;
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
        
        const periodSales = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
        const periodCredit = 0; // Simplified for now

        let currentBalance = openingBalanceForPeriod;
        const ledgerEntries = filteredTransactions.map(t => {
            const entry = {
                ...t,
                opening: currentBalance,
                debit: 0,
                closing: currentBalance + t.amount,
            };
            currentBalance = entry.closing;
            return entry;
        }).filter(entry => 
            entry.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
            formatCurrency(entry.amount).includes(searchTerm)
        );
        
        return {
            periodTransactions: ledgerEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            openingBalance: openingBalanceForPeriod,
            totalSales: periodSales,
            totalCredit: periodCredit,
            closingBalance: currentBalance
        };

    }, [customer, transactions, date, customerPaymentDetail, searchTerm]);
    
    if (!customer) {
        return (
             <>
                <Header title="Customer Not Found" />
                <main className="flex flex-1 flex-col items-center justify-center p-4">
                    <p>The requested customer could not be found.</p>
                     <Link href="/sales/customers">
                        <Button variant="outline" className="mt-4">Back to Customers</Button>
                    </Link>
                </main>
            </>
        )
    }

    const handleExport = () => {
        const dataToExport = periodTransactions.map(t => ({
            Date: format(new Date(t.date), "dd/MM/yyyy"),
            'Opening Balance': formatCurrency(t.opening),
            'Sales': formatCurrency(t.amount),
            'Debit Amount': formatCurrency(t.debit),
            'Closing Balance': formatCurrency(t.closing),
        }));

        const summary = {
            Date: 'Summary',
            'Opening Balance': formatCurrency(openingBalance),
            'Sales': formatCurrency(totalSales),
            'Debit Amount': formatCurrency(totalCredit),
            'Closing Balance': formatCurrency(closingBalance)
        }
        
        downloadCsv([...dataToExport, {} as any, summary], `${customer.name}_ledger.csv`);
    }

    const handleWhatsApp = () => {
        if (!customer?.contact) {
            toast({
                variant: "destructive",
                title: "No Contact Info",
                description: "This customer does not have a contact number.",
            });
            return;
        }
        
        const fromDate = date?.from ? format(date.from, "dd/MM/yyyy") : 'the beginning';
        const toDate = date?.to ? format(date.to, "dd/MM/yyyy") : 'today';
        
        let message = `Hello ${customer.name},\n\nHere is your account statement from ${fromDate} to ${toDate}:\n\n`;
        message += `Opening Balance: ${formatCurrency(openingBalance)}\n`;
        message += `Total Sales during period: ${formatCurrency(totalSales)}\n`;
        message += `*Closing Balance Due: ${formatCurrency(closingBalance)}*\n\n`;
        
        message += `Thank you!\nOM Saravana Vegetables`;

        const phoneNumber = customer.contact.replace(/[^0-9]/g, '');
        const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    }

    return (
        <>
            <Header title="Payment Dues" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-primary">{customer.name}</CardTitle>
                             <Link href="/sales/customers">
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customer
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
                        
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon"><Printer /></Button>
                                <Button variant="outline" size="icon" onClick={handleWhatsApp}><MessageCircle /></Button>
                                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Download</Button>
                            </div>
                            <div className="w-full md:w-auto">
                                <Input 
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-64"
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Opening Balance</TableHead>
                                        <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><ShoppingCart className="h-4 w-4 text-sky-600"/> Sales</div></TableHead>
                                        <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><TrendingUp className="h-4 w-4 text-green-600"/> Debit Amount</div></TableHead>
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
                                               <TableCell className="text-right">{formatCurrency(t.opening)}</TableCell>
                                               <TableCell className="text-right text-sky-600 font-medium">{formatCurrency(t.amount)}</TableCell>
                                               <TableCell className="text-right text-green-600 font-medium">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TableCell>
                                               <TableCell className="text-right">{formatCurrency(t.closing)}</TableCell>
                                           </TableRow>
                                       ))
                                   )}
                                </TableBody>
                            </Table>
                        </div>

                         <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5"/>
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Opening Balance</p>
                                        <p className="text-xl font-bold">{formatCurrency(openingBalance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sales</p>
                                        <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Total Debit</p>
                                        <p className="text-xl font-bold">{formatCurrency(totalCredit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Closing Balance</p>
                                        <p className="text-xl font-bold">{formatCurrency(closingBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                         </Card>

                    </CardContent>
                </Card>
            </main>
        </>
    )
}
