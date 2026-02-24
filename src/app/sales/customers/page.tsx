
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
import { useLanguage } from "@/context/language-context";

export default function SalesCustomersPage() {
  const { customerPayments, updateCustomer, updateCustomerPayment, customers } = useTransactions();
  const { t } = useLanguage();
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

  return (
    <>
      <Header title={t('nav.customers')} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-white/40 backdrop-blur-md group hover:shadow-xl transition-all duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' }} />
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-400/20 blur-2xl z-0" />

            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-blue-900/60 uppercase tracking-wider">{t('dashboard.customers')} Count</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-3xl font-black text-blue-950">{customers.length}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-white/40 backdrop-blur-md group hover:shadow-xl transition-all duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' }} />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-sky-400/20 blur-2xl z-0" />

            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-sky-900/60 uppercase tracking-wider">{t('dashboard.total_outstanding_balance')}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-3xl font-black text-sky-950">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-primary">{t('nav.customers')} List</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('actions.search')}
                  className="w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AddCustomerDialog>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('actions.new')}
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
                        <Users className="h-4 w-4" /> {t('products.item_code')}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        {t('forms.customer')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Wallet className="h-4 w-4" /> {t('forms.outstanding')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Folder className="h-4 w-4" /> {t('nav.accounts')}
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
                              {t('actions.view')}
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
        />
      </main>
    </>
  );
}
