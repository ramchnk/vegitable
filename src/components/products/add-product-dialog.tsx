
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Package, Hash } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { useLanguage } from "@/context/language-context";

const productFormSchema = z.object({
  itemCode: z.string().min(1, "Item code is required"),
  name: z.string().min(1, "Item name is required"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function AddProductDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addProduct } = useTransactions();
  const { t } = useLanguage();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      itemCode: "",
      name: "",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    try {
      await addProduct(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add product", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('products.add_product_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      {t('products.item_code')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. VEG006" {...field} />
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
                      <Package className="h-4 w-4 text-primary" />
                      {t('products.item_name')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bell Pepper" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">{t('products.save_product')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
