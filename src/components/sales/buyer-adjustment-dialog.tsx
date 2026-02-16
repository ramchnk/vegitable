
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { PaymentDetail } from "@/lib/types";
import { useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Label } from "../ui/label";

const adjustmentFormSchema = z.object({
  givenAmount: z.coerce.number().min(0, "Amount must be non-negative"),
  discount: z.coerce.number().min(0, "Discount must be non-negative"),
  isGpay: z.boolean().default(false),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface BuyerAdjustmentDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentDetail) => void;
}

export function BuyerAdjustmentDialog({ payment, open, onOpenChange, onSave }: BuyerAdjustmentDialogProps) {
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      givenAmount: 0,
      discount: 0,
      isGpay: false
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ givenAmount: 0, discount: 0, isGpay: false });
    }
  }, [open, form]);

  function onSubmit(data: AdjustmentFormValues) {
    if (payment) {
      const newPaidAmount = payment.paidAmount + data.givenAmount + data.discount;
      const newDueAmount = payment.totalAmount - newPaidAmount;
      const updatedPayment = {
        ...payment,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentMethod: data.isGpay ? 'GPay' : (payment.paymentMethod || 'Cash'),
      };
      onSave(updatedPayment);
    }
    onOpenChange(false);
  }

  const { givenAmount, discount } = form.watch();
  
  const closingBalance = useMemo(() => {
      if (!payment) return 0;
      return payment.dueAmount - (givenAmount || 0) - (discount || 0);
  }, [payment, givenAmount, discount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg">
          <DialogTitle>Buyer Outstanding Adjustment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
            <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="customer" className="text-right">Customer</Label>
                <Input id="customer" value={payment?.partyName || ''} disabled className="col-span-2"/>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Opening Balance / Debit</Label>
                <span className="col-span-2 font-medium">{formatCurrency(payment?.dueAmount || 0)}</span>
            </div>
            
            <FormField
              control={form.control}
              name="givenAmount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-3 items-center gap-4">
                  <FormLabel className="text-right">Given Amount</FormLabel>
                  <div className="col-span-2 flex items-center gap-2">
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormField
                        control={form.control}
                        name="isGpay"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">GPay</FormLabel>
                            </FormItem>
                        )}
                    />
                  </div>
                  <FormMessage className="col-start-2 col-span-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-3 items-center gap-4">
                  <FormLabel className="text-right">Discount</FormLabel>
                  <FormControl className="col-span-2">
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage className="col-start-2 col-span-2" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Closing Balance</Label>
                <span className="col-span-2 font-medium">{formatCurrency(closingBalance)}</span>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" size="icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
