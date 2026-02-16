
"use client";

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
import { formatCurrency } from "@/lib/utils";

interface SupplierLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  dailyPurchases: { supplier: string; amount: number }[];
  totalPurchases: number;
}

export function SupplierLedgerDialog({ open, onOpenChange, date, dailyPurchases, totalPurchases }: SupplierLedgerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg">
          <DialogTitle>Supplier Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date: {date ? format(date, 'dd/MM/yyyy') : 'N/A'}</span>
            </div>
            <Table>
                <TableHeader className="bg-accent">
                    <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dailyPurchases.length > 0 ? (
                        dailyPurchases.map((purchase) => (
                            <TableRow key={purchase.supplier}>
                                <TableCell>{purchase.supplier}</TableCell>
                                <TableCell className="text-right">{formatCurrency(purchase.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No farmer transactions found for today.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className="font-bold text-right">Total:</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(totalPurchases)}</TableCell>
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
