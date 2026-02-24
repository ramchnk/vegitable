
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
  Banknote,
  Download,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { cn, downloadCsv, formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/context/transaction-provider';
import { useMemo } from 'react';
import { products } from '@/lib/data';
import { useLanguage } from '@/context/language-context';

export default function DashboardPage() {
  const { transactions, customers, customerPayments } = useTransactions();
  const { t, language } = useLanguage();

  const recentTransactions = useMemo(() => {
    return transactions.slice(-10).reverse().map(t => ({
      id: t.id,
      customer: t.party,
      amount: t.amount,
      status: t.payment === 'Credit' ? 'Credit' : 'Paid'
    }));
  }, [transactions]);

  const totalRevenue = useMemo(() => transactions.filter(t => t.type === 'Sale').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const salesCount = useMemo(() => transactions.filter(t => t.type === 'Sale').length, [transactions]);
  const outstandingTotal = useMemo(() => customerPayments.reduce((acc, curr) => acc + curr.dueAmount, 0), [customerPayments]);

  const handleExport = () => {
    const dataToExport = transactions.map(t => ({
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
      <Header title={t('nav.dashboard')}>
        <Button size="sm" variant="outline" className="gap-1 bg-pink-500 hover:bg-pink-600 text-white border-none shadow-md" onClick={handleExport}>
          <Download className="h-4 w-4" />
          {t('actions.export_csv')}
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">{t('dashboard.total_revenue')}</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-900">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-emerald-700/70 font-medium">
                {t('dashboard.from_all_sales')}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-amber-800 uppercase tracking-wider">{t('dashboard.sales')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-900">+{salesCount}</div>
              <p className="text-xs text-amber-700/70 font-medium">
                {t('dashboard.total_sales_transactions')}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky-50 to-blue-200 dark:from-sky-900/20 dark:to-blue-900/30 border-sky-200 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="h-24 w-24 text-sky-900" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-black text-sky-900 uppercase tracking-widest">{t('dashboard.customers')}</CardTitle>
              <Users className="h-5 w-5 text-sky-700 animate-pulse" />
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sky-700/80 mb-1">{t('dashboard.outstanding_balance')}</span>
                <div className="text-3xl font-black text-green-600 drop-shadow-sm tracking-tight">
                  {formatCurrency(outstandingTotal)}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-sky-200/50 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-tighter opacity-70">{t('dashboard.total_users')}</span>
                  <span className="text-lg font-black text-sky-900 leading-tight">{customers.length}</span>
                </div>
                <Badge className="bg-sky-600 text-white border-none shadow-sm">
                  {language === 'en' ? 'Live' : 'நேரடி'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-pink-200 shadow-sm relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-rose-800 uppercase tracking-wider">{t('nav.products')}</CardTitle>
              <Package className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-900">{products.length}</div>
              <p className="text-xs text-rose-700/70 font-medium">
                {t('dashboard.items_in_stock')}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4 border-none shadow-xl bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black text-emerald-900 flex items-center gap-2">
                <div className="h-2 w-8 bg-emerald-500 rounded-full" />
                {t('dashboard.recent_sales')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentSalesChart />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3 border-none shadow-xl bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-800">{t('dashboard.recent_transactions')}</CardTitle>
              <CardDescription className="font-medium text-emerald-700/80">
                {t('dashboard.items_total_prefix')} {transactions.length} {t('dashboard.transactions_in_total')}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-bold text-slate-900">{t('dashboard.customer_name')}</TableHead>
                    <TableHead className="text-right font-bold text-slate-900">{t('dashboard.amount')}</TableHead>
                    <TableHead className="text-right font-bold text-slate-900">{t('dashboard.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700">{transaction.customer}</TableCell>
                      <TableCell className="text-right font-black text-slate-900">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            transaction.status === 'Paid'
                              ? 'default'
                              : 'secondary'
                          }
                          className={cn(
                            "font-bold uppercase text-[10px] tracking-widest px-3 py-1 border-none shadow-sm",
                            transaction.status === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                          )}
                        >
                          {transaction.status === 'Paid' ? t('dashboard.paid') : t('dashboard.credit')}
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
