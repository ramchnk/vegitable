
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
import { User, Hash, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

const supplierFormSchema = z.object({
  code: z.string().min(1, "Supplier Code Required"),
  name: z.string().min(1, "Supplier Name Required"),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function AddSupplierDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addSupplier, suppliers } = useTransactions();
  const { t } = useLanguage();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      code: "",
      contact: "",
      address: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  async function onSubmit(data: SupplierFormValues) {
    const existingSupplier = suppliers.find(s => s.code === (data.code || ""));
    if (existingSupplier) {
      toast({
        title: "Duplicate Supplier Code",
        description: `Supplier code '${data.code}' is already assigned to ${existingSupplier.name}.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addSupplier({
        code: data.code || "",
        name: data.name,
        contact: data.contact || "",
        address: data.address || ""
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to add supplier", error);
      toast({
        title: "Error adding supplier",
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
          <DialogTitle>{t('suppliers.new_supplier_title')}</DialogTitle>
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
                    <Input placeholder={t('suppliers.name_label')} {...field} />
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('actions.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('suppliers.saving') : t('suppliers.save_changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
