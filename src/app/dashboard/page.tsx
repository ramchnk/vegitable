
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RecentSalesChart } from '@/components/dashboard/recent-sales-chart';
import {
  Package,
  ShoppingCart,
  Users,
  Languages,
  Download,
  CreditCard,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { downloadCsv, formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/context/transaction-provider';
import { useLanguage } from '@/context/language-context';
import { Language } from '@/lib/translations';
import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, subWeeks, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';


export default function DashboardPage() {
  const { transactions, customers, products, customerPayments } = useTransactions();
  const { language, setLanguage, t } = useLanguage();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  const totalOutstanding = useMemo(() =>
    customerPayments.reduce((acc: number, curr: any) => acc + curr.dueAmount, 0),
    [customerPayments]
  );

  const setPreset = (preset: string) => {
    const today = new Date();
    let range: DateRange | undefined;

    switch (preset) {
      case 'today':
        range = { from: today, to: today };
        break;
      case 'this-week':
        range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
        break;
      case 'last-week':
        const lastWeek = subWeeks(today, 1);
        range = { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
        break;
      case 'this-month':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case 'this-year':
        range = { from: startOfYear(today), to: endOfYear(today) };
        break;
      case 'last-year':
        const lastYear = subYears(today, 1);
        range = { from: startOfYear(lastYear), to: endOfYear(lastYear) };
        break;
      default:
        range = undefined;
    }
    setDate(range);
  };

  const filteredTransactions = useMemo(() => {
    if (!date?.from) return transactions;

    return transactions.filter((t: any) => {
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
  }, [transactions, date]);

  const recentTransactions = useMemo(() => {
    return filteredTransactions.slice(-5).reverse().map((t: any) => ({
      id: t.id,
      customer: t.party,
      amount: t.amount,
      status: t.payment === 'Credit' ? 'Credit' : 'Paid'
    }));
  }, [filteredTransactions]);

  const totalRevenue = useMemo(() => filteredTransactions.filter((t: any) => t.type === 'Sale').reduce((acc: number, curr: any) => acc + curr.amount, 0), [filteredTransactions]);
  const totalCashRevenue = useMemo(() => filteredTransactions.filter((t: any) => t.type === 'Sale' && t.payment === 'Cash').reduce((acc: number, curr: any) => acc + curr.amount, 0), [filteredTransactions]);
  const totalCreditRevenue = useMemo(() => filteredTransactions.filter((t: any) => t.type === 'Sale' && t.payment === 'Credit').reduce((acc: number, curr: any) => acc + curr.amount, 0), [filteredTransactions]);
  const salesCount = useMemo(() => filteredTransactions.filter((t: any) => t.type === 'Sale').length, [filteredTransactions]);

  const handleExport = () => {
    const dataToExport = filteredTransactions.map((t: any) => ({
      Date: t.date,
      Party: t.party,
      Type: t.type,
      Item: t.item,
      Amount: t.amount,
      Payment: t.payment,
    }));
    if (dataToExport.length > 0) {
      const totalAmount = dataToExport.reduce((acc, curr) => acc + curr.Amount, 0);
      const totalRow = {
        Date: 'TOTAL',
        Party: 'Total',
        Type: '',
        Item: '',
        Amount: totalAmount,
        Payment: '',
      };
      downloadCsv([...dataToExport, totalRow as any], 'transactions.csv');
    } else {
      downloadCsv([], 'transactions.csv');
    }
  }

  return (
    <>
      <Header title="Dashboard">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                size="sm"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
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
            <PopoverContent className="w-auto p-0 flex flex-row" align="end">
              <div className="flex flex-col border-r p-2 bg-muted/20 gap-1 w-32 no-print">
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('today')}>{t('date.today')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('this-week')}>{t('date.this_week')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('last-week')}>{t('date.last_week')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('this-month')}>{t('date.this_month')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('last-month')}>{t('date.last_month')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('this-year')}>{t('date.this_year')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8" onClick={() => setPreset('last-year')}>{t('date.last_year')}</Button>
                <Button variant="ghost" size="sm" className="justify-start font-normal text-xs h-8 text-destructive hover:text-destructive" onClick={() => setDate(undefined)}>{t('date.clear')}</Button>
              </div>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Languages className="h-4 w-4" />
                {language === 'en' ? 'English' : 'தமிழ்'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1" align="end">
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full justify-start font-normal", language === 'en' && "bg-muted")}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full justify-start font-normal", language === 'ta' && "bg-muted")}
                onClick={() => setLanguage('ta')}
              >
                தமிழ்
              </Button>
            </PopoverContent>
          </Popover>

          <Button size="sm" className="gap-1 bg-[#FBCFE8] hover:bg-[#F9A8D4] text-[#831843] border-none shadow-sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('actions.export_csv')}
          </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue - Carrot Theme */}
          <Card className="relative overflow-hidden bg-[#FFE5D3] border-none shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-8 -top-8 text-[9rem] opacity-20 select-none pointer-events-none rotate-12 mix-blend-multiply">🥕</div>
            <div className="absolute right-4 bottom-2 text-6xl opacity-20 select-none pointer-events-none -rotate-12 mix-blend-multiply">🥕</div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-[#2E5E3A]">{t('dashboard.total_revenue')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-[#2E5E3A]" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-[#1A4D2E]">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs font-medium text-[#4A7A58] mt-1">
                {t('dashboard.from_all_sales')}
              </p>
            </CardContent>
          </Card>

          {/* Sales - Leaf Theme */}
          <Card className="relative overflow-hidden bg-[#E1F0DA] border-none shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 text-[9rem] opacity-20 select-none pointer-events-none rotate-45 text-[#4CAF50] mix-blend-multiply">🍃</div>
            <div className="absolute -left-4 bottom-[-10px] text-6xl opacity-20 select-none pointer-events-none -rotate-45 text-[#4CAF50] mix-blend-multiply">🌿</div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-[#2E5E3A]">{t('dashboard.sales')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-[#2E5E3A]" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-[#1A4D2E]">+{salesCount}</div>
              <p className="text-xs font-medium text-[#4A7A58] mt-1">
                {t('dashboard.total_sales_transactions')}
              </p>
            </CardContent>
          </Card>

          {/* Customers - Potato Theme (Beige) */}
          <Card className="relative overflow-hidden bg-[#F5E6D3] border-none shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 text-[8rem] opacity-20 select-none pointer-events-none rotate-12 mix-blend-multiply text-[#8D6E63]">🥔</div>
            <div className="absolute right-10 bottom-[-10px] text-6xl opacity-20 select-none pointer-events-none -rotate-12 mix-blend-multiply text-[#8D6E63]">🥔</div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-[#2E5E3A]">{t('dashboard.customers')}</CardTitle>
              <Users className="h-4 w-4 text-[#2E5E3A]" />
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              <div className="flex flex-col">
                <div className="text-3xl font-extrabold text-[#1A4D2E]">+{customers.length}</div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-[#2E5E3A] mb-1">
                    {t('dashboard.outstanding_balance')}
                  </p>
                  <div className="text-3xl font-extrabold text-[#1A4D2E] leading-none">
                    {formatCurrency(totalOutstanding)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary - Eggplant Theme (Purple) */}
          <Card className="relative overflow-hidden bg-[#E9D5FF] border-none shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 text-[8rem] opacity-20 select-none pointer-events-none rotate-12 mix-blend-multiply text-[#7E22CE]">🍆</div>
            <div className="absolute left-[-20px] bottom-[-10px] text-6xl opacity-20 select-none pointer-events-none rotate-45 mix-blend-multiply text-[#7E22CE]">🍇</div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-[#2E5E3A]">Payment Summary</CardTitle>
              <CreditCard className="h-4 w-4 text-[#2E5E3A]" />
            </CardHeader>
            <CardContent className="relative z-10 pt-2 space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#4A7A58] uppercase">{t('forms.cash_bill')}</span>
                <span className="text-2xl font-extrabold text-[#1A4D2E]">{formatCurrency(totalCashRevenue)}</span>
              </div>
              <div className="flex flex-col border-t border-[#D8B4FE] pt-2">
                <span className="text-[10px] font-bold text-[#4A7A58] uppercase">{t('forms.credit_bill')}</span>
                <span className="text-2xl font-extrabold text-[#1A4D2E]">{formatCurrency(totalCreditRevenue)}</span>
              </div>
            </CardContent>
          </Card>

        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentSalesChart />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                You have {transactions.length} transactions in total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.customer_name')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.amount')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.customer}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            transaction.status === 'Paid'
                              ? 'default'
                              : 'secondary'
                          }
                          className={transaction.status === 'Paid' ? 'bg-primary/80' : ''}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
