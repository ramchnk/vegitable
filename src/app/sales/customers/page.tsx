
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Plus, User, Wallet, Folder, Pencil, Users } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency } from "@/lib/utils";
import type { PaymentDetail, Customer } from "@/lib/types";
import { AddCustomerDialog } from "@/components/sales/add-customer-dialog";
import { EditCustomerDialog } from "@/components/sales/edit-customer-dialog";

export default function SalesCustomersPage() {
  const { customerPayments, updateCustomer, updateCustomerPayment, customers, deleteCustomer } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<PaymentDetail | null>(null);

  const filteredCustomers = customerPayments.filter((customer) =>
    customer.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse();

  const totalOutstanding = useMemo(() =>
    filteredCustomers.reduce((acc, curr) => acc + curr.dueAmount, 0),
    [filteredCustomers]
  );

  const handleSave = (customer: Customer, payment: PaymentDetail) => {
    updateCustomer(customer);
    updateCustomerPayment(payment);
    setEditingCustomer(null);
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  return (
    <>
      <Header title="Customer" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Total Customers Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-primary">Customer List</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search"
                  className="w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AddCustomerDialog>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </AddCustomerDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Code
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Customer
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Wallet className="h-4 w-4" /> Outstanding Amount
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Folder className="h-4 w-4" /> Ledger
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customerPayment: PaymentDetail) => {
                    const customer = customers.find(c => c.id === customerPayment.partyId);
                    return (
                      <TableRow key={customerPayment.id}>
                        <TableCell>
                          <span className="font-mono">{customer?.code || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{customerPayment.partyName}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-transparent" onClick={() => setEditingCustomer(customerPayment)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(customerPayment.dueAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/sales/customers/${customerPayment.partyId}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EditCustomerDialog
          payment={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </main>
    </>
  );
}
