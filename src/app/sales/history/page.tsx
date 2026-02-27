"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Search,
    Calendar as CalendarIcon,
    FilterX,
    Eye,
    Printer
} from "lucide-react";
import { createRoot } from 'react-dom/client';

import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerCustom } from "@/components/ui/custom-date-picker";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { ThermalPrint } from "@/components/sales/thermal-print";
import { A5Print } from "@/components/sales/a5-print";

interface GroupedSale {
    id: string;
    billNumber: number;
    date: string;
    party: string;
    payment: string;
    totalAmount: number;
    items: {
        name: string;
        quantity: number;
        price: number;
        total: number;
    }[];
}

export default function SalesHistoryPage() {
    const { transactions, loading } = useTransactions();
    const [searchTerm, setSearchTerm] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [paymentFilter, setPaymentFilter] = useState<string>("All");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [selectedSale, setSelectedSale] = useState<GroupedSale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const groupedSales = useMemo(() => {
        const groups: { [key: string]: GroupedSale } = {};

        transactions
            .filter((t) => t.type === "Sale" || t.type === "Payment")
            .forEach((t) => {
                const billNo = t.billNumber || 0;
                const dateStr = t.date; // already YYYY-MM-DD

                // For payments, we use a unique key per transaction since they don't have bill numbers
                const groupKey = t.type === "Payment" ? `payment_${t.id}` : `${dateStr}_${billNo}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        id: groupKey,
                        billNumber: billNo,
                        date: t.date,
                        party: t.party,
                        payment: t.payment,
                        totalAmount: 0,
                        items: []
                    };
                }

                if (t.type === "Sale") {
                    groups[groupKey].totalAmount += t.amount;
                    groups[groupKey].items.push({
                        name: t.item,
                        quantity: t.quantity || 0,
                        price: t.price || 0,
                        total: t.amount
                    });
                } else if (t.type === "Payment") {
                    groups[groupKey].totalAmount = t.amount;
                    groups[groupKey].items.push({
                        name: t.item || "Payment Received/Given",
                        quantity: 0,
                        price: t.amount,
                        total: t.amount
                    });
                    // For payments, we want the type to be clear in the list
                    groups[groupKey].payment = `Payment (${t.payment})`;
                }
            });

        return Object.values(groups)
            .filter((sale) => {
                const matchesSearch =
                    sale.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sale.billNumber.toString().includes(searchTerm);

                const matchesPayment = paymentFilter === "All" || sale.payment === paymentFilter;

                if (!date) return matchesSearch && matchesPayment;

                const filterDateStr = format(date, 'yyyy-MM-dd');
                const matchesDate = sale.date === filterDateStr;

                return matchesSearch && matchesPayment && matchesDate;
            })
            .sort((a, b) => {
                // Sort by date descending, then bill number descending
                if (a.date !== b.date) {
                    return b.date.localeCompare(a.date);
                }
                return b.billNumber - a.billNumber;
            });
    }, [transactions, searchTerm, date, paymentFilter]);

    const resetFilters = () => {
        setSearchTerm("");
        setDate(undefined);
        setPaymentFilter("All");
    };

    const getOldBalance = (customerName: string, targetDate: string, billNumber: number) => {
        return transactions
            .filter(t => t.party.toLowerCase() === customerName.toLowerCase())
            .filter(t => {
                if (t.date < targetDate) return true;
                if (t.date === targetDate && (t.billNumber || 0) < billNumber && t.billNumber !== 0) return true;
                // Payments on the same day with billNumber 0 are considered after or concurrent, 
                // but for simple history, we order by billNumber.
                return false;
            })
            .reduce((acc, t) => {
                if (t.type === 'Sale') return acc + t.amount;
                if (t.type === 'Payment') return acc - (t.debit || t.amount);
                return acc;
            }, 0);
    };

    const handleViewDetails = (sale: GroupedSale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handlePrintThermal = () => {
        if (!selectedSale) return;

        const oldBalance = getOldBalance(selectedSale.party, selectedSale.date, selectedSale.billNumber);
        const amountPaid = selectedSale.payment.includes('Cash') ? selectedSale.totalAmount : 0; // Simplified for history view
        const currentBalance = oldBalance + selectedSale.totalAmount - amountPaid;

        const totalQty = selectedSale.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalItems = selectedSale.items.length;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(node => node.cloneNode(true));
            styles.forEach(style => printWindow.document.head.appendChild(style));

            const container = printWindow.document.createElement('div');
            printWindow.document.body.appendChild(container);

            const root = createRoot(container);
            root.render(
                <ThermalPrint
                    billNo={selectedSale.billNumber}
                    date={new Date(selectedSale.date)}
                    customerName={selectedSale.party}
                    paymentType={selectedSale.payment as "Cash" | "Credit"}
                    items={selectedSale.items}
                    totalAmount={selectedSale.totalAmount}
                    oldBalance={oldBalance}
                    currentBalance={currentBalance}
                    totalItems={totalItems}
                    totalQty={totalQty}
                />
            );

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 1000);
        }
    };

    const handlePrintA5 = () => {
        if (!selectedSale) return;

        const oldBalance = getOldBalance(selectedSale.party, selectedSale.date, selectedSale.billNumber);
        // For history, we might not have the exact paid amount if it was partial, 
        // but we can estimate or use the total if it was Cash.
        const isCash = selectedSale.payment.includes('Cash');
        const amountPaid = isCash ? selectedSale.totalAmount : 0;
        const currentBalance = oldBalance + selectedSale.totalAmount - amountPaid;

        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (printWindow) {
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(node => node.cloneNode(true));
            styles.forEach(style => printWindow.document.head.appendChild(style));

            const container = printWindow.document.createElement('div');
            printWindow.document.body.appendChild(container);

            const root = createRoot(container);
            root.render(
                <A5Print
                    billNo={selectedSale.billNumber}
                    date={new Date(selectedSale.date)}
                    customerName={selectedSale.party}
                    paymentType={selectedSale.payment as "Cash" | "Credit"}
                    items={selectedSale.items}
                    totalAmount={selectedSale.totalAmount}
                    oldBalance={oldBalance}
                    paidAmount={amountPaid}
                    currentBalance={currentBalance}
                />
            );

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 1000);
        }
    };

    return (
        <>
            <Header title="Sales History" backHref="/sales" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label htmlFor="search" className="text-sm font-medium">Search</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                type="search"
                                placeholder="Customer or Bill No..."
                                className="pl-8 w-full md:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label className="text-sm font-medium">Filter by Date</label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full md:w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                                <DatePickerCustom
                                    selected={date}
                                    onSelect={setDate}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label className="text-sm font-medium">Payment Type</label>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="All Payments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Payments</SelectItem>
                                <SelectItem value="Cash">Cash Bill</SelectItem>
                                <SelectItem value="Credit">Credit Bill</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(searchTerm || date || paymentFilter !== "All") && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 h-10">
                            <FilterX className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Sales</CardTitle>
                            <CardDescription>
                                A list of your recent sales transactions.
                            </CardDescription>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Total: {groupedSales.length} Bills
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[65vh] overflow-y-auto relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-secondary z-10">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Bill No</TableHead>
                                        <TableHead className="w-[180px]">Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Payment Type</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Loading transactions...
                                            </TableCell>
                                        </TableRow>
                                    ) : groupedSales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedSales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-mono font-bold">{sale.billNumber === 0 ? '-' : sale.billNumber}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {format(new Date(sale.date), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="font-medium uppercase">{sale.party}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                                                        sale.billNumber === 0 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                            sale.payment === "Cash" ? "bg-green-100 text-green-700" :
                                                                sale.payment === "Credit" ? "bg-red-100 text-red-700" :
                                                                    "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {sale.billNumber === 0 ? "Payment Recorded" : (sale.payment === "Cash" ? "Cash Bill" : sale.payment === "Credit" ? "Credit Bill" : sale.payment)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {formatCurrency(sale.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Bill Details - #{selectedSale?.billNumber}</DialogTitle>
                            <DialogDescription>
                                {selectedSale && format(new Date(selectedSale.date), "PPP")} | {selectedSale?.party}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto py-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedSale?.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="uppercase">{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity.toFixed(3)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end border-t pt-4">
                            <div className="text-right">
                                <span className="text-sm text-muted-foreground uppercase font-bold">Total Bill Amount</span>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedSale?.totalAmount || 0)}</p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 mt-4">
                            <Button
                                variant="outline"
                                className="gap-2 border-primary/20 hover:bg-primary/5"
                                onClick={() => setTimeout(handlePrintThermal, 100)}
                            >
                                <Printer className="h-4 w-4" />
                                Thermal Print
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 border-primary/20 hover:bg-primary/5"
                                onClick={() => setTimeout(handlePrintA5, 100)}
                            >
                                <Printer className="h-4 w-4" />
                                A5 Print
                            </Button>
                            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}
