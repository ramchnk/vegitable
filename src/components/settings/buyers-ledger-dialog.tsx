
"use client";

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency } from "@/lib/utils";

interface BuyersLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
}

export function BuyersLedgerDialog({ open, onOpenChange, date }: BuyersLedgerDialogProps) {
  const { transactions } = useTransactions();

  const dailySales = useMemo(() => {
    if (!date) return [];
    
    const salesForDate = transactions.filter(t => 
        t.type === 'Sale' && 
        format(new Date(t.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    const salesByCustomer = salesForDate.reduce((acc, curr) => {
        if (!acc[curr.party]) {
            acc[curr.party] = 0;
        }
        acc[curr.party] += curr.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByCustomer).map(([customer, amount]) => ({ customer, amount }));

  }, [date, transactions]);

  const totalSales = useMemo(() => {
      return dailySales.reduce((sum, sale) => sum + sale.amount, 0);
  }, [dailySales]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg">
          <DialogTitle>Buyers Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date: {date ? format(date, 'dd/MM/yyyy') : 'N/A'}</span>
            </div>
            <Table>
                <TableHeader className="bg-accent">
                    <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dailySales.length > 0 ? (
                        dailySales.map((sale) => (
                            <TableRow key={sale.customer}>
                                <TableCell>{sale.customer}</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center">No sales for this date.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className="font-bold text-right">Total:</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(totalSales)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
        <DialogFooter className="p-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
