
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
import { Trash } from "lucide-react";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  amount: z.coerce.number(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface EditSupplierDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (supplier: Supplier, payment: PaymentDetail) => void;
}

export function EditSupplierDialog({
  payment,
  open,
  onOpenChange,
  onSave,
}: EditSupplierDialogProps) {
  const { suppliers } = useTransactions();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        name: payment.partyName,
        amount: payment.dueAmount,
      });
    }
  }, [payment, form]);

  function onSubmit(data: SupplierFormValues) {
    if (payment) {
        const supplier = suppliers.find(s => s.id === payment.partyId);
        if (!supplier) return;

        const updatedSupplier: Supplier = { ...supplier, name: data.name };
        
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
          <DialogTitle>Edit Supplier Name</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-between pt-4">
                <Button type="button" variant="destructive" size="icon">
                    <Trash className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                    <Button type="submit" size="icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
