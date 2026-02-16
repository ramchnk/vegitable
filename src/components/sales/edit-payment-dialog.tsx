
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { PaymentDetail } from "@/lib/types";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

const paymentFormSchema = z.object({
  additionalPayment: z.coerce.number().min(0, "Payment must be non-negative"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface EditPaymentDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentDetail) => void;
}

export function EditPaymentDialog({ payment, open, onOpenChange, onSave }: EditPaymentDialogProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      additionalPayment: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ additionalPayment: 0 });
    }
  }, [open, form]);

  function onSubmit(data: PaymentFormValues) {
    if (payment) {
      const newPaidAmount = payment.paidAmount + data.additionalPayment;
      const newDueAmount = payment.totalAmount - newPaidAmount;
      const updatedPayment = {
        ...payment,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
      };
      onSave(updatedPayment);
    }
    onOpenChange(false);
  }

  const watchedAdditionalPayment = form.watch("additionalPayment");
  const newDueAmount =
    payment && typeof watchedAdditionalPayment === "number"
      ? payment.dueAmount - watchedAdditionalPayment
      : payment?.dueAmount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a new payment for {payment?.partyName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p><strong>Total Amount:</strong> {formatCurrency(payment?.totalAmount || 0)}</p>
            <p><strong>Currently Paid:</strong> {formatCurrency(payment?.paidAmount || 0)}</p>
            <p><strong>Amount Due:</strong> {formatCurrency(payment?.dueAmount || 0)}</p>
            <FormField
              control={form.control}
              name="additionalPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Payment Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount being paid" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p><strong>Remaining Due:</strong> {formatCurrency(newDueAmount)}</p>
            <DialogFooter>
              <Button type="submit">Save Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
