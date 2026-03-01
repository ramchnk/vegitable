
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  const { customerPayments, updateCustomer, updateCustomerPayment, customers, deleteCustomer } = useTransactions();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<PaymentDetail | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: "code" | "name" | "dueAmount";
    direction: "asc" | "desc";
  } | null>(null);

  const sortedCustomers = useMemo(() => {
    let items = customerPayments.filter((customer) =>
      customer.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "code") {
          const aCustomer = customers.find(c => c.id === a.partyId);
          const bCustomer = customers.find(c => c.id === b.partyId);
          aValue = aCustomer?.code || "";
          bValue = bCustomer?.code || "";
        } else if (sortConfig.key === "name") {
          aValue = a.partyName;
          bValue = b.partyName;
        } else if (sortConfig.key === "dueAmount") {
          aValue = a.dueAmount;
          bValue = b.dueAmount;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    } else {
      items.reverse();
    }
    return items;
  }, [customerPayments, searchTerm, sortConfig, customers]);

  const totalOutstanding = useMemo(() =>
    sortedCustomers.reduce((acc, curr) => acc + curr.dueAmount, 0),
    [sortedCustomers]
  );

  const requestSort = (key: "code" | "name" | "dueAmount") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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
    <div className="flex flex-col h-[calc(100vh-1rem)] md:h-[calc(100vh-1rem)] overflow-hidden">
      <main className="flex flex-1 flex-col gap-2 p-3 md:p-4 pt-2 md:pt-2 min-h-0">
        <div className="md:hidden pb-1 flex-shrink-0">
          <SidebarTrigger />
        </div>
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <Card className="relative overflow-hidden border-none shadow-lg bg-white/40 backdrop-blur-md group hover:shadow-xl transition-all duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' }} />
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-400/20 blur-2xl z-0" />

            <CardHeader className="pb-1 pt-3 relative z-10 px-4">
              <CardTitle className="text-xs font-bold text-blue-900/60 uppercase tracking-wider">{t('dashboard.customers')} Count</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 px-4 pb-3">
              <p className="text-2xl font-black text-blue-950">{customers.length}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-white/40 backdrop-blur-md group hover:shadow-xl transition-all duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' }} />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-sky-400/20 blur-2xl z-0" />

            <CardHeader className="pb-1 pt-3 relative z-10 px-4">
              <CardTitle className="text-xs font-bold text-sky-900/60 uppercase tracking-wider">{t('dashboard.total_outstanding_balance')}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 px-4 pb-3">
              <p className="text-2xl font-black text-sky-950">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-primary">{t('nav.customers')} List</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('actions.search')}
                  className="w-48 h-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AddCustomerDialog>
                  <Button size="sm" className="h-8 shadow-sm font-bold">
                    <Plus className="h-3 w-3 mr-2" />
                    {t('actions.new')}
                  </Button>
                </AddCustomerDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden px-4">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50">
                    <TableHead
                      className="font-bold text-primary cursor-pointer group hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("code")}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('customers.code_label')}
                        <span className="ml-1">
                          {sortConfig?.key === "code" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold text-primary cursor-pointer group hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        {t('customers.name_label')}
                        <span className="ml-1">
                          {sortConfig?.key === "name" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right font-bold text-primary cursor-pointer group hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("dueAmount")}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        <Wallet className="h-4 w-4" />
                        {t('forms.outstanding')}
                        <span className="ml-1">
                          {sortConfig?.key === "dueAmount" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-primary">
                      <div className="flex items-center gap-2 justify-center">
                        <Folder className="h-4 w-4" /> {t('nav.accounts')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customerPayment: PaymentDetail) => {
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
                            {customer?.code !== "000" && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-transparent" onClick={() => setEditingCustomer(customerPayment)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
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
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
