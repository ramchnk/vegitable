"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
    Calendar as CalendarIcon,
    Download,
    Check,
    ChevronsUpDown,
    Search,
    MapPin,
    Phone
} from "lucide-react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerCustom } from "@/components/ui/custom-date-picker";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency, cn, downloadCsv } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export default function SalesTransactionReportPage() {
    const { transactions, customers, loading } = useTransactions();
    const { t } = useLanguage();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

    const reportData = useMemo(() => {
        if (loading) return [];

        // 1. Group sales by bill number and date
        const salesGroups: { [key: string]: any } = {};

        transactions
            .filter(t => t.type === 'Sale')
            .forEach(trans => {
                const groupKey = `${trans.date}_${trans.billNumber || 'no_bill'}`;
                if (!salesGroups[groupKey]) {
                    salesGroups[groupKey] = {
                        date: trans.date,
                        billNumber: trans.billNumber,
                        party: trans.party,
                        amount: 0,
                        paid: 0,
                    };
                }
                salesGroups[groupKey].amount += trans.amount;
            });

        // 2. Add payments linked to these bills
        transactions
            .filter(t => t.type === 'Payment' && t.billNumber)
            .forEach(trans => {
                const groupKey = `${trans.date}_${trans.billNumber}`;
                if (salesGroups[groupKey]) {
                    salesGroups[groupKey].paid += (trans.debit || trans.amount);
                }
            });

        // 3. Filter by date and customer
        return Object.values(salesGroups)
            .filter(group => {
                const groupDate = new Date(group.date);
                groupDate.setHours(0, 0, 0, 0);

                const isWithinDate = (!dateRange?.from || groupDate >= dateRange.from) && (!dateRange?.to || groupDate <= dateRange.to);

                const customer = customers.find(c => c.id === selectedCustomerId);
                // Handle both permanent customers and custom walk-in names
                const isMatchingCustomer = selectedCustomerId === 'all' || group.party === customer?.name;

                return isWithinDate && isMatchingCustomer;
            })
            .sort((a, b) => b.date.localeCompare(a.date) || (b.billNumber || 0) - (a.billNumber || 0));

    }, [transactions, customers, dateRange, selectedCustomerId, loading]);

    const totals = useMemo(() => {
        return reportData.reduce((acc, curr) => {
            acc.sales += curr.amount;
            acc.paid += curr.paid;
            acc.balance += (curr.amount - curr.paid);
            return acc;
        }, { sales: 0, paid: 0, balance: 0 });
    }, [reportData]);

    const handleExport = () => {
        const dataToExport = reportData.map((row, index) => ({
            "S. No": index + 1,
            "Sale Date": format(new Date(row.date), "dd/MM/yyyy"),
            "Bill Number": row.billNumber || "-",
            "Customer": row.party,
            "Sales Amount": row.amount,
            "Paid Amount": row.paid,
            "Balance Amount": row.amount - row.paid,
        }));

        const summaryRows = [
            {},
            { "Customer": "TOTAL", "Sales Amount": totals.sales, "Paid Amount": totals.paid, "Balance Amount": totals.balance }
        ];

        downloadCsv([...dataToExport, ...summaryRows as any], "sales_transaction_report.csv");
    };

    return (
        <>
            <Header title={t('reports.sales_transaction_report')} />
            <main className="flex flex-col h-[calc(100vh-64px)] bg-muted/20 overflow-hidden">
                <Card className="flex-1 flex flex-col border-none shadow-sm m-4 md:m-6 overflow-hidden">
                    <CardContent className="flex-1 flex flex-col pt-6 overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6 pt-2">
                            {/* Date Filter */}
                            <div className="space-y-1.5 w-full md:w-[280px]">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('forms.date')}</label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full justify-start text-left font-normal h-9 bg-white border-muted-foreground/20 hover:border-[#166534]/50 transition-colors", !dateRange && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#166534]" />
                                            <span className="text-sm">
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                                            {format(dateRange.to, "dd/MM/yyyy")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "dd/MM/yyyy")
                                                    )
                                                ) : (
                                                    <span>{t('date.pick_date_range')}</span>
                                                )}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="start">
                                        <DateRangePicker
                                            value={dateRange}
                                            onChange={setDateRange}
                                            onApply={() => setIsCalendarOpen(false)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Customer Filter */}
                            <div className="space-y-1.5 w-full md:w-[320px]">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('forms.customer')}</label>
                                <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isCustomerPopoverOpen}
                                            className="w-full justify-between h-9 bg-white border-muted-foreground/20 hover:border-[#166534]/50 transition-colors font-medium"
                                        >
                                            <span className="truncate text-sm">
                                                {selectedCustomerId === "all"
                                                    ? t('reports.all_parties')
                                                    : (() => {
                                                        const customer = customers.find((c) => c.id === selectedCustomerId);
                                                        return customer ? `${customer.name} ${customer.code ? `(${customer.code})` : ''}` : t('forms.select_customer');
                                                    })()}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder={t('forms.search_customer')} className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>{t('forms.no_customer_found')}</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setSelectedCustomerId("all");
                                                            setIsCustomerPopoverOpen(false);
                                                        }}
                                                        className="font-bold text-primary"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCustomerId === "all" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {t('reports.all_parties')}
                                                    </CommandItem>
                                                    {customers.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={`${c.name} ${c.code || ''}`}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(c.id);
                                                                setIsCustomerPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4 text-primary",
                                                                    selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <span className="flex-1">
                                                                {c.name}
                                                                {c.code && <span className="ml-2 text-xs text-muted-foreground font-normal">({c.code})</span>}
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary font-bold hover:bg-primary/5 h-9 px-3 shrink-0"
                                onClick={() => {
                                    setDateRange({
                                        from: startOfMonth(new Date()),
                                        to: endOfMonth(new Date())
                                    });
                                    setSelectedCustomerId("all");
                                }}
                            >
                                {t('date.clear')}
                            </Button>

                            {/* Action Buttons */}
                            <div className="flex items-end gap-2 ml-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold h-9 px-4"
                                    onClick={handleExport}
                                    disabled={reportData.length === 0}
                                >
                                    <Download className="h-4 w-4" />
                                    {t('actions.export_csv')}
                                </Button>
                            </div>
                        </div>

                        {/* Customer Info Bar */}
                        {selectedCustomerId !== "all" && (() => {
                            const customer = customers.find(c => c.id === selectedCustomerId);
                            if (!customer || (!customer.address && !customer.contact)) return null;

                            return (
                                <div className="flex flex-wrap gap-6 mb-6 p-4 bg-white rounded-xl border border-muted/30 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                    {customer.contact && (
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#166534]/10 p-2 rounded-lg">
                                                <Phone className="h-4 w-4 text-[#166534]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">{t('forms.contact')}</span>
                                                <span className="text-sm font-semibold text-foreground tracking-tight">{customer.contact}</span>
                                            </div>
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-center gap-3 border-l pl-6 border-muted/50">
                                            <div className="bg-primary/5 p-2 rounded-lg">
                                                <MapPin className="h-4 w-4 text-primary/70" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">{t('forms.address')}</span>
                                                <span className="text-sm font-medium text-foreground/80 tracking-tight">{customer.address}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-blue-50 border-blue-100 shadow-none">
                                <CardHeader className="py-3 px-4">
                                    <CardDescription className="text-blue-600 font-bold uppercase text-[10px]">{t('reports.total_sales_amount')}</CardDescription>
                                    <CardTitle className="text-xl font-bold text-blue-700">{formatCurrency(totals.sales)}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="bg-green-50 border-green-100 shadow-none">
                                <CardHeader className="py-3 px-4">
                                    <CardDescription className="text-green-600 font-bold uppercase text-[10px]">{t('reports.total_paid_amount')}</CardDescription>
                                    <CardTitle className="text-xl font-bold text-green-700">{formatCurrency(totals.paid)}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="bg-orange-50 border-orange-100 shadow-none">
                                <CardHeader className="py-3 px-4">
                                    <CardDescription className="text-orange-600 font-bold uppercase text-[10px]">{t('reports.total_balance_amount')}</CardDescription>
                                    <CardTitle className="text-xl font-bold text-orange-700">{formatCurrency(totals.balance)}</CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        <div className="flex-1 rounded-md border overflow-hidden relative">
                            <div className="absolute inset-0 overflow-auto">
                                <Table>
                                    <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[60px] font-bold">S.No</TableHead>
                                            <TableHead className="font-bold">{t('forms.date')}</TableHead>
                                            <TableHead className="font-bold">{t('forms.bill_number')}</TableHead>
                                            <TableHead className="font-bold">{t('forms.customer')}</TableHead>
                                            <TableHead className="text-right font-bold">{t('forms.amount')}</TableHead>
                                            <TableHead className="text-right font-bold">{t('reports.total_paid_amount')}</TableHead>
                                            <TableHead className="text-right font-bold">{t('forms.balance_amount')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">{t('actions.loading')}</TableCell>
                                            </TableRow>
                                        ) : reportData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">No transactions found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            reportData.map((row, index) => (
                                                <TableRow key={`${row.date}_${row.billNumber}`}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell>{format(new Date(row.date), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell className="font-mono font-bold text-primary">#{row.billNumber || '-'}</TableCell>
                                                    <TableCell className="uppercase font-medium text-slate-700">
                                                        {row.party}
                                                        {customers.find(c => c.name === row.party)?.code && (
                                                            <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                                                                ({customers.find(c => c.name === row.party)?.code})
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-blue-600">{formatCurrency(row.amount)}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(row.paid)}</TableCell>
                                                    <TableCell className="text-right font-bold text-orange-600">{formatCurrency(row.amount - row.paid)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
