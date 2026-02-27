
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { PaymentDetail, Supplier } from "@/lib/types";
import { useEffect } from "react";
import { useTransactions } from "@/context/transaction-provider";
import { Trash, User, Hash, Phone, MapPin, Wallet } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

const supplierFormSchema = z.object({
  code: z.string().min(1, "Supplier Code Required"),
  name: z.string().min(1, "Supplier name is required"),
  amount: z.coerce.number(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface EditSupplierDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (supplier: Supplier, payment: PaymentDetail) => void;
  onDelete?: (supplierId: string) => void;
}

export function EditSupplierDialog({
  payment,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EditSupplierDialogProps) {
  const { suppliers } = useTransactions();
  const { t } = useLanguage();
  const { toast } = useToast();
  const currentSupplier = payment ? suppliers.find(s => s.id === payment.partyId) : null;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      code: "",
      contact: "",
      address: "",
      amount: 0,
    },
  });

  useEffect(() => {
    if (payment) {
      const supplier = suppliers.find(s => s.id === payment.partyId);
      form.reset({
        name: payment.partyName,
        code: supplier?.code || "",
        contact: supplier?.contact || "",
        address: supplier?.address || "",
        amount: payment.dueAmount,
      });
    }
  }, [payment, form, suppliers]);

  function onSubmit(data: SupplierFormValues) {
    if (payment) {
      const supplier = suppliers.find(s => s.id === payment.partyId);
      if (!supplier) return;

      const duplicateCodeSupplier = suppliers.find(s => s.code === data.code && s.id !== supplier.id);
      if (duplicateCodeSupplier) {
        toast({
          title: "Duplicate Supplier Code",
          description: `Supplier code '${data.code}' is already assigned to ${duplicateCodeSupplier.name}.`,
          variant: "destructive"
        });
        return;
      }

      const updatedSupplier: Supplier = {
        ...supplier,
        name: data.name,
        code: data.code || "",
        contact: data.contact || "",
        address: data.address || ""
      };

      const dueAmountChange = payment.dueAmount - data.amount;
      const newPaidAmount = payment.paidAmount + dueAmountChange;

      const updatedPayment: PaymentDetail = {
        ...payment,
        partyName: data.name,
        paidAmount: newPaidAmount,
        dueAmount: payment.totalAmount - newPaidAmount,
      };

      onSave(updatedSupplier, updatedPayment);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers.edit_supplier_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t('suppliers.code_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('suppliers.code_label')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('suppliers.name_label')}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('suppliers.phone_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('suppliers.phone_label')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('suppliers.address_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('suppliers.address_label')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {t('forms.amount')}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-between pt-4">
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (payment && window.confirm(`Are you sure you want to delete ${payment.partyName}?`)) {
                      onDelete(payment.partyId);
                      onOpenChange(false);
                    }
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Button>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
