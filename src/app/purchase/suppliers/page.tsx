
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
import { Input } from "@/components/ui/input";
import { Plus, User, Wallet, BookOpen, Pencil } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { formatCurrency } from "@/lib/utils";
import type { PaymentDetail, Supplier } from "@/lib/types";
import { AddSupplierDialog } from "@/components/purchase/add-supplier-dialog";
import { EditSupplierDialog } from "@/components/purchase/edit-supplier-dialog";
import { useLanguage } from "@/context/language-context";

export default function PurchaseSuppliersPage() {
  const { supplierPayments, updateSupplier, updateSupplierPayment, suppliers } = useTransactions();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<PaymentDetail | null>(null);

  const filteredSuppliers = supplierPayments.filter((supplier) =>
    supplier.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (supplier: Supplier, payment: PaymentDetail) => {
    updateSupplier(supplier);
    updateSupplierPayment(payment);
    setEditingSupplier(null);
  };

  return (
    <>
      <Header title={t('nav.purchase')}>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('forms.supplier')}
            className="w-48"
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
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('nav.payments')} {t('forms.balance')}</CardTitle>
            <CardDescription>
              {t('forms.log_intake_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('products.item_code')}</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" /> {t('forms.supplier')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Wallet className="h-4 w-4" /> {t('forms.outstanding')}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <BookOpen className="h-4 w-4" /> {t('nav.accounts')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: PaymentDetail) => (
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
                      <Link href={`/purchase/suppliers/${supplier.partyId}`}>
                        <Button variant="outline" size="sm">
                          {t('actions.view')}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <EditSupplierDialog
          payment={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
          onSave={handleSave}
        />
      </main>
    </>
  );
}
