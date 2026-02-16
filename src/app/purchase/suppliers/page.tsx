
"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input";
import { Plus, User, Wallet, BookOpen, Pencil } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency } from "@/lib/utils";
import type { PaymentDetail } from "@/lib/types";

export default function PurchaseSuppliersPage() {
  const { supplierPayments } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = supplierPayments.filter((supplier) =>
    supplier.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header title="Payment Dues">
        <div className="flex items-center gap-2">
            <Input 
                placeholder="Supplier Name"
                className="w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New
            </Button>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Dues</CardTitle>
            <CardDescription>
              View and settle monthly payments for farmers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Supplier
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Wallet className="h-4 w-4" /> Outstanding Payment
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                        <BookOpen className="h-4 w-4" /> Ledger
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: PaymentDetail) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <span>{supplier.partyName}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-transparent">
                                <Pencil className="h-3 w-3"/>
                            </Button>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(supplier.dueAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
