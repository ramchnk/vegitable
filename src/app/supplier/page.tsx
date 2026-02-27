
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { Input } from "@/components/ui/input";
import { Plus, User, Wallet, BookOpen, Pencil, Users } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency } from "@/lib/utils";
import type { PaymentDetail, Supplier } from "@/lib/types";
import { AddSupplierDialog } from "@/components/purchase/add-supplier-dialog";
import { EditSupplierDialog } from "@/components/purchase/edit-supplier-dialog";
import { useLanguage } from "@/context/language-context";

export default function PurchaseSuppliersPage() {
  const { supplierPayments, updateSupplier, updateSupplierPayment, suppliers, deleteSupplier } = useTransactions();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<PaymentDetail | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: "code" | "name" | "dueAmount";
    direction: "asc" | "desc";
  } | null>(null);

  const sortedSuppliers = useMemo(() => {
    let items = supplierPayments.filter((supplier) =>
      supplier.partyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "code") {
          const aSupplier = suppliers.find(s => s.id === a.partyId);
          const bSupplier = suppliers.find(s => s.id === b.partyId);
          aValue = aSupplier?.code || "";
          bValue = bSupplier?.code || "";
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
  }, [supplierPayments, searchTerm, sortConfig, suppliers]);

  const requestSort = (key: "code" | "name" | "dueAmount") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalOutstanding = useMemo(() =>
    sortedSuppliers.reduce((acc, curr) => acc + curr.dueAmount, 0),
    [sortedSuppliers]
  );

  const handleSave = (supplier: Supplier, payment: PaymentDetail) => {
    updateSupplier(supplier);
    updateSupplierPayment(payment);
    setEditingSupplier(null);
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
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }} />
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-400/20 blur-2xl z-0" />

            <CardHeader className="pb-1 pt-3 relative z-10 px-4">
              <CardTitle className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">{t('nav.suppliers')} Count</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 px-4 pb-3">
              <p className="text-2xl font-black text-emerald-950">{suppliers.length}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-white/40 backdrop-blur-md group hover:shadow-xl transition-all duration-300">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }} />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-400/20 blur-2xl z-0" />

            <CardHeader className="pb-1 pt-3 relative z-10 px-4">
              <CardTitle className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">{t('dashboard.total_outstanding_balance')}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 px-4 pb-3">
              <p className="text-2xl font-black text-emerald-950">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-bold text-primary">{t('suppliers.list')}</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('forms.supplier')}
                className="w-48 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AddSupplierDialog>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  {t('actions.new')}
                </Button>
              </AddSupplierDialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden px-4">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50">
                    <TableHead
                      className="w-[200px] cursor-pointer group hover:bg-muted/50 transition-colors font-bold text-primary"
                      onClick={() => requestSort("code")}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('suppliers.code_label')}
                        <span className="ml-1">
                          {sortConfig?.key === "code" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer group hover:bg-muted/50 transition-colors font-bold text-primary"
                      onClick={() => requestSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" /> {t('suppliers.name_label')}
                        <span className="ml-1">
                          {sortConfig?.key === "name" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer group hover:bg-muted/50 transition-colors font-bold text-primary"
                      onClick={() => requestSort("dueAmount")}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        <Wallet className="h-4 w-4" /> {t('forms.outstanding')}
                        <span className="ml-1">
                          {sortConfig?.key === "dueAmount" ? (
                            sortConfig.direction === "asc" ? "↑" : "↓"
                          ) : "↕"}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-primary">
                      <div className="flex items-center gap-2 justify-center">
                        <BookOpen className="h-4 w-4" /> {t('nav.accounts')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSuppliers.map((supplier: PaymentDetail) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono">
                        {suppliers.find(s => s.id === supplier.partyId)?.code || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>
                            {supplier.partyName}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-transparent" onClick={() => setEditingSupplier(supplier)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(supplier.dueAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/supplier/${supplier.partyId}`}>
                          <Button variant="outline" size="sm">
                            {t('actions.view')}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <EditSupplierDialog
          payment={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
          onSave={handleSave}
          onDelete={deleteSupplier}
        />
      </main>
    </div>
  );
}
