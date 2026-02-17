
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
import { downloadCsv, formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/context/transaction-provider';
import { useMemo } from 'react';
import { products } from '@/lib/data';

export default function DashboardPage() {
    const { transactions, customers } = useTransactions();

    const recentTransactions = useMemo(() => {
      return transactions.slice(-5).reverse().map(t => ({
        id: t.id,
        customer: t.party,
        amount: t.amount,
        status: t.payment === 'Credit' ? 'Credit' : 'Paid'
      }));
    }, [transactions]);

    const totalRevenue = useMemo(() => transactions.filter(t => t.type === 'Sale').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
    const salesCount = useMemo(() => transactions.filter(t => t.type === 'Sale').length, [transactions]);

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
      <Header title="Dashboard">
        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                from all sales
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{salesCount}</div>
              <p className="text-xs text-muted-foreground">
                total sales transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                total customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                types of items
              </p>
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
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
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
