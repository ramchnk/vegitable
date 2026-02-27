
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useTransactions } from "@/context/transaction-provider";
import { User, Hash, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

const customerFormSchema = z.object({
  code: z.string().min(1, "Customer Code Required"),
  name: z.string().min(1, "Customer Name Required"),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function AddCustomerDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addCustomer, customers } = useTransactions();
  const { t } = useLanguage();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      code: "",
      name: "",
      contact: "",
      address: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  async function onSubmit(data: CustomerFormValues) {
    const existingCustomer = customers.find(c => c.code === (data.code || ""));
    if (existingCustomer) {
      toast({
        title: "Duplicate Customer Code",
        description: `Customer code '${data.code}' is already assigned to ${existingCustomer.name}.`,
        variant: "destructive"
      });
      return;
    }

    if (data.code === "000") {
      toast({
        title: "Reserved Code",
        description: "Customer code '000' is reserved for Walk-in Customer.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addCustomer({
        code: data.code || "",
        name: data.name,
        contact: data.contact || "",
        address: data.address || ""
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to add customer", error);
      toast({
        title: "Error adding customer",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('customers.new_customer_title')}</DialogTitle>
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
                    <Input placeholder={t('customers.code_label')} {...field} />
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
                    <Input placeholder={t('customers.name_label')} {...field} />
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
                    <Input placeholder={t('customers.address_label')} {...field} />
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
                    <Input placeholder={t('customers.phone_label')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('actions.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('customers.saving') : t('customers.save_changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
