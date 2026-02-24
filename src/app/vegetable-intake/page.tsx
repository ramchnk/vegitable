
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash } from "lucide-react";

import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { useTransactions } from "@/context/transaction-provider";

import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

const intakeItemSchema = z.object({
  itemId: z.string().min(1, "Item is required."),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

const intakeFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  collectionDate: z.date(),
  items: z.array(intakeItemSchema).min(1, "At least one item is required."),
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative."),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

export default function VegetableIntakePage() {
  const { suppliers, supplierPayments, addTransaction, products } = useTransactions();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [outstanding, setOutstanding] = useState(0);

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      supplierId: "",
      collectionDate: new Date(),
      items: [],
      amountPaid: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedSupplierId = form.watch("supplierId");
  const watchedItems = form.watch("items");
  const watchedAmountPaid = form.watch("amountPaid");

  useEffect(() => {
    if (watchedSupplierId) {
      const payment = supplierPayments.find(p => p.partyId === watchedSupplierId);
      setOutstanding(payment?.dueAmount || 0);
    } else {
      setOutstanding(0);
    }
  }, [watchedSupplierId, supplierPayments]);

  const totalCost = useMemo(() =>
    watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0),
    [watchedItems]
  );

  const total = outstanding + totalCost;
  const balanceAmount = total - (watchedAmountPaid || 0);

  function onSubmit(data: IntakeFormValues) {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected supplier not found.' });
      return;
    }

    const paymentMethod = data.amountPaid < totalCost ? 'Credit' : 'Cash';

    const newTransactions = data.items.map(item => {
      const product = products.find(p => p.id === item.itemId);
      return {
        date: format(data.collectionDate, 'yyyy-MM-dd'),
        party: supplier.name,
        type: 'Purchase' as const,
        item: product?.name || 'Unknown Item',
        amount: item.price * item.quantity,
        payment: paymentMethod,
      };
    });

    addTransaction(
      newTransactions,
      { name: supplier.name, contact: supplier.contact, address: supplier.address },
      data.amountPaid
    );

    toast({ title: 'Success', description: 'Intake submitted successfully.' });
    form.reset({
      supplierId: data.supplierId, // Keep supplier selected
      collectionDate: new Date(),
      items: [],
      amountPaid: undefined,
    });
  }

  // Local state for the item being added
  const [newItemId, setNewItemId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const handleAddItem = () => {
    const product = products.find(p => p.id === newItemId);
    if (!product || !newItemQuantity || !newItemPrice) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all item fields.' });
      return;
    }
    const quantity = parseFloat(newItemQuantity);
    const price = parseFloat(newItemPrice);

    if (quantity > 0 && price >= 0) {
      append({ itemId: newItemId, quantity, price });
      setNewItemId("");
      setNewItemQuantity("");
      setNewItemPrice("");
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter valid quantity and price.' });
    }
  };

  const handleItemSelect = (itemId: string) => {
    setNewItemId(itemId);
    if (product) {
      setNewItemPrice("");
    }
  }

  return (
    <>
      <Header title={t('nav.purchase')} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{t('forms.log_intake_title')}</CardTitle>
                <CardDescription>{t('forms.log_intake_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.supplier')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('forms.select_supplier')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collectionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('forms.collection_date')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>{t('date.pick_date')}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Add Item Form */}
                <div className="space-y-2 rounded-lg border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
                    <div className="md:col-span-3">
                      <Label>{t('forms.item')}</Label>
                      <Select onValueChange={handleItemSelect} value={newItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('forms.select_item')} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.itemCode} - {p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('forms.weight_kg')}</Label>
                      <Input placeholder="e.g. 120" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} type="number" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('forms.price_kg')}</Label>
                      <Input placeholder="e.g. 50" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} type="number" />
                    </div>
                    <div className="md:col-span-1">
                      <Button type="button" size="icon" onClick={handleAddItem} className="w-full">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">{t('forms.add_item')}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <FormLabel>{t('forms.items')}</FormLabel>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('forms.item')}</TableHead>
                          <TableHead className="text-right">{t('forms.quantity')} (Kg)</TableHead>
                          <TableHead className="text-right">{t('forms.price')}</TableHead>
                          <TableHead className="text-right">{t('forms.total')}</TableHead>
                          <TableHead><span className="sr-only">{t('forms.actions')}</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">{t('forms.no_items')}</TableCell>
                          </TableRow>
                        )}
                        {fields.map((field, index) => {
                          const product = products.find(p => p.id === field.itemId);
                          return (
                            <TableRow key={field.id}>
                              <TableCell>{product?.name}</TableCell>
                              <TableCell className="text-right">{field.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(field.price)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(field.quantity * field.price)}</TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                </div>

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-muted-foreground">{t('forms.outstanding')}</span>
                      <span className="text-right font-medium">{formatCurrency(outstanding)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-muted-foreground">{t('forms.total_cost')}</span>
                      <span className="text-right font-medium">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center font-bold text-lg">
                      <span>{t('forms.total')}</span>
                      <span className="text-right">{formatCurrency(total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <FormLabel htmlFor="amountPaid">{t('forms.amount_paid')}</FormLabel>
                      <FormField
                        control={form.control}
                        name="amountPaid"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input id="amountPaid" type="number" className="text-right" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-muted-foreground">{t('forms.balance_amount')}</span>
                      <span className="text-right font-medium">{formatCurrency(balanceAmount)}</span>
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg">{t('forms.submit_intake')}</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main>
    </>
  );
}

