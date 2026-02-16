
"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit, MoreHorizontal, ArrowLeft } from "lucide-react";
import { downloadCsv, formatCurrency } from "@/lib/utils";
import type { PaymentDetail } from "@/lib/types";
import { BuyerAdjustmentDialog } from "@/components/sales/buyer-adjustment-dialog";
import { useTransactions } from "@/context/transaction-provider";


export default function CustomerPaymentsPage() {
    const { customerPayments, updateCustomerPayment } = useTransactions();
    const [editPayment, setEditPayment] = useState<PaymentDetail | null>(null);

    const handleExport = () => {
        const dataToExport = [...customerPayments];
        const totalRow = dataToExport.reduce((acc, curr) => {
            acc.totalAmount += curr.totalAmount;
            acc.paidAmount += curr.paidAmount;
            acc.dueAmount += curr.dueAmount;
            return acc;
        }, {
            id: 'TOTAL',
            partyId: '',
            partyName: 'Total',
            totalAmount: 0,
            paidAmount: 0,
            dueAmount: 0,
            paymentMethod: ''
        });
        downloadCsv([...dataToExport, totalRow], "customer_payments.csv");
    }

    const handleSave = (updatedPayment: PaymentDetail) => {
        updateCustomerPayment(updatedPayment);
        setEditPayment(null);
    }

  return (
    <>
      <Header title="Customer Payment Details">
        <div className="flex items-center gap-2">
            <Link href="/credits">
                <Button size="sm" variant="outline" className="gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export CSV
            </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
            <CardHeader>
              <CardTitle>Customer Payment Details</CardTitle>
              <CardDescription>
                Overview of payments received from customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.partyId}
                      </TableCell>
                      <TableCell>{payment.partyName}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.paidAmount)}
                      </TableCell>
                       <TableCell className="text-right">
                        <Badge variant={payment.dueAmount > 0 ? 'destructive' : 'default'} className={payment.dueAmount > 0 ? '' : 'bg-primary/80'}>
                          {formatCurrency(payment.dueAmount)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditPayment(payment)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        <BuyerAdjustmentDialog 
            payment={editPayment}
            open={!!editPayment}
            onOpenChange={(open) => !open && setEditPayment(null)}
            onSave={handleSave}
        />
      </main>
    </>
  );
}
