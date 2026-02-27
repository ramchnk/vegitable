
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
import type { PaymentDetail, Customer } from "@/lib/types";
import { useEffect } from "react";
import { useTransactions } from "@/context/transaction-provider";
import { Trash, User, Hash, MapPin, Phone, Wallet } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

const customerFormSchema = z.object({
  code: z.string().min(1, "Customer Code Required"),
  name: z.string().min(1, "Customer name is required"),
  amount: z.coerce.number(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface EditCustomerDialogProps {
  payment: PaymentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer, payment: PaymentDetail) => void;
  onDelete: (customerId: string) => void;
}

export function EditCustomerDialog({
  payment,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EditCustomerDialogProps) {
  const { customers } = useTransactions();
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      code: "",
      name: "",
      amount: 0,
      contact: "",
      address: "",
    },
  });

  useEffect(() => {
    if (payment) {
      const customer = customers.find(c => c.id === payment.partyId);
      form.reset({
        code: customer?.code || "",
        name: payment.partyName,
        amount: payment.dueAmount,
        contact: customer?.contact || "",
        address: customer?.address || "",
      });
    }
  }, [payment, form, customers]);

  function onSubmit(data: CustomerFormValues) {
    if (payment) {
      const customer = customers.find(c => c.id === payment.partyId);
      if (!customer) return;

      const duplicateCodeCustomer = customers.find(c => c.code === data.code && c.id !== customer.id);
      if (duplicateCodeCustomer) {
        toast({
          title: "Duplicate Customer Code",
          description: `Customer code '${data.code}' is already assigned to ${duplicateCodeCustomer.name}.`,
          variant: "destructive"
        });
        return;
      }

      const updatedCustomer: Customer = {
        ...customer,
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

      onSave(updatedCustomer, updatedPayment);
    }
    onOpenChange(false);
  }

  const isWalkIn = payment ? customers.find(c => c.id === payment.partyId)?.code === "000" : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('customers.edit_customer_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-bold">
                    <Hash className="h-4 w-4" />
                    {t('customers.code_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('customers.code_label')} {...field} disabled={isWalkIn} />
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
                  <FormLabel className="flex items-center gap-2 font-bold">
                    <User className="h-4 w-4" />
                    {t('customers.name_label')}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isWalkIn} />
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
                  <FormLabel className="flex items-center gap-2 font-bold">
                    <Wallet className="h-4 w-4" />
                    {t('forms.amount')}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} disabled={isWalkIn} />
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
                  <FormLabel className="flex items-center gap-2 font-bold">
                    <MapPin className="h-4 w-4" />
                    {t('customers.address_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('customers.address_label')} {...field} disabled={isWalkIn} />
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
                  <FormLabel className="flex items-center gap-2 font-bold">
                    <Phone className="h-4 w-4" />
                    {t('customers.phone_label')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('customers.phone_label')} {...field} disabled={isWalkIn} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-between pt-4">
              {!isWalkIn && (
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
