
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

const paymentFormSchema = z.object({
  dueAmount: z.coerce.number().min(0, "Due amount must be non-negative"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface EditPaymentDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentFormValues) => void;
}

export function EditPaymentDialog({ payment, open, onOpenChange, onSave }: EditPaymentDialogProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
        dueAmount: 0,
    }
  });

  useEffect(() => {
    if (payment) {
        form.reset({ dueAmount: payment.dueAmount });
    }
  }, [payment, form]);

  function onSubmit(data: PaymentFormValues) {
    onSave(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update the due amount for {payment?.partyName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dueAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
