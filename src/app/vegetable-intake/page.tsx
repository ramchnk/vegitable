
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash, Check, ChevronsUpDown, Printer, MessageCircle, Trash2, CreditCard } from "lucide-react";

import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { DatePickerCustom } from "@/components/ui/custom-date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [openSupplierCombobox, setOpenSupplierCombobox] = useState(false);
  const [openItemCombobox, setOpenItemCombobox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierTriggerRef = useRef<HTMLButtonElement>(null);
  const itemTriggerRef = useRef<HTMLButtonElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

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

  // Navigation Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (watchedItems.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [watchedItems.length]);

  const totalCost = useMemo(() =>
    watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0),
    [watchedItems]
  );

  const total = outstanding + totalCost;
  const balanceAmount = total - (watchedAmountPaid || 0);

  const onSubmit = async (data: IntakeFormValues, printType?: 'thermal' | 'a5') => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected supplier not found.' });
      setIsSubmitting(false);
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
        quantity: item.quantity,
        price: item.price,
      };
    });

    try {
      await addTransaction(
        newTransactions,
        { name: supplier.name, contact: supplier.contact, address: supplier.address },
        data.amountPaid
      );

      toast({ title: 'Success', description: 'Intake submitted successfully.' });

      // Auto-clear bill after success
      clearBill(false);
    } catch (error) {
      console.error("Failed to save purchase:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save purchase entry.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Shortcut Keys handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F4 for save bill
      if (e.key === "F4") {
        e.preventDefault();
        if (!isSubmitting && watchedItems.length > 0) {
          form.handleSubmit((data) => onSubmit(data))();
        }
      }
      // F5 for Save & thermal print
      if (e.key === "F5") {
        e.preventDefault();
        if (!isSubmitting && watchedItems.length > 0) {
          form.handleSubmit((data) => onSubmit(data, 'thermal'))();
        }
      }
      // F6 for Save & A5 print
      if (e.key === "F6") {
        e.preventDefault();
        if (!isSubmitting && watchedItems.length > 0) {
          form.handleSubmit((data) => onSubmit(data, 'a5'))();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isSubmitting, watchedItems.length, form, onSubmit]);

  const clearBill = (showToast = true) => {
    form.reset({
      supplierId: "",
      collectionDate: new Date(),
      items: [],
      amountPaid: undefined,
    });
    setNewItemId("");
    setNewItemQuantity("");
    setNewItemPrice("");
    if (showToast) {
      toast({ title: t('actions.clear_bill'), description: "All fields have been reset." });
    }
    // Focus back to supplier select
    setTimeout(() => supplierTriggerRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById(nextFieldId)?.focus();
      if (nextFieldId === "item-select") {
        setOpenItemCombobox(true);
        setTimeout(() => document.getElementById("item-search-input")?.focus(), 100);
      }
    }
  };

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
      // Refocus item select and open dropdown after adding
      setOpenItemCombobox(true);
      setTimeout(() => {
        document.getElementById("item-search-input")?.focus();
      }, 100);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter valid quantity and price.' });
    }
  };

  const handleItemSelect = (itemId: string) => {
    setNewItemId(itemId);
    const product = products.find(p => p.id === itemId);
    if (product) {
      setNewItemPrice("");
    }
  }

  return (
    <>
      <Header title={t('forms.log_intake_title')} />
      <main className="flex h-[calc(100vh-64px)] flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="flex-1 flex flex-col min-h-0 h-full">
            <Card className="flex-1 flex flex-col min-h-0 h-full border-none shadow-none md:border md:shadow-sm">
              <CardContent className="flex-1 p-6 min-h-0 overflow-hidden flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                  {/* Left Column: Entry Panels - Scrollable if needed */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="supplierId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="font-bold">{t('forms.supplier')}</FormLabel>
                              <Popover open={openSupplierCombobox} onOpenChange={setOpenSupplierCombobox}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      ref={supplierTriggerRef}
                                      id="supplier-select"
                                      variant="outline"
                                      role="combobox"
                                      disabled={isSubmitting}
                                      className={cn(
                                        "w-full justify-between h-10 !text-[#064e3b] !font-bold",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      onKeyDown={(e) => handleKeyDown(e, "item-select")}
                                    >
                                      {field.value
                                        ? suppliers.find((s) => s.id === field.value)?.name
                                          ? `${suppliers.find((s) => s.id === field.value)?.code || ''} - ${suppliers.find((s) => s.id === field.value)?.name}`
                                          : t('forms.select_supplier')
                                        : t('forms.select_supplier')}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder={t('forms.search_customer') || "Search supplier..."} />
                                    <CommandList>
                                      <CommandEmpty>{t('forms.no_customer_found')}</CommandEmpty>
                                      <CommandGroup>
                                        {suppliers.map((s) => (
                                          <CommandItem
                                            key={s.id}
                                            value={`${s.code || ''} ${s.name}`.toLowerCase()}
                                            onSelect={() => {
                                              form.setValue("supplierId", s.id);
                                              setOpenSupplierCombobox(false);
                                              setOpenItemCombobox(true);
                                              setTimeout(() => {
                                                document.getElementById("item-search-input")?.focus();
                                              }, 100);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                s.id === field.value ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <span className="flex items-center gap-2 text-base py-1 !text-[#064e3b] !font-bold">
                                              {s.code && (
                                                <span className="px-1.5 py-0.5 rounded bg-green-100 font-mono text-xs font-bold !text-[#064e3b]">
                                                  {s.code}
                                                </span>
                                              )}
                                              <span className="!font-bold !text-[#064e3b]">{s.name}</span>
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="collectionDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="font-bold">{t('forms.collection_date')}</FormLabel>
                              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      disabled={isSubmitting}
                                      className={cn(
                                        "pl-3 text-left font-normal h-10 w-full",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>{t('date.pick_date')}</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                                  <DatePickerCustom
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    onClose={() => setIsCalendarOpen(false)}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="font-bold">{t('forms.item')}</Label>
                          <Popover open={openItemCombobox} onOpenChange={setOpenItemCombobox}>
                            <PopoverTrigger asChild>
                              <Button
                                id="item-select"
                                ref={itemTriggerRef}
                                variant="outline"
                                role="combobox"
                                disabled={isSubmitting}
                                className={cn(
                                  "w-full justify-between h-10 !text-[#064e3b] !font-bold",
                                  !newItemId && "text-muted-foreground"
                                )}
                                onKeyDown={(e) => handleKeyDown(e, "quantity-input")}
                              >
                                {newItemId
                                  ? products.find((p) => p.id === newItemId)?.name
                                    ? `${products.find((p) => p.id === newItemId)?.itemCode} - ${products.find((p) => p.id === newItemId)?.name}`
                                    : t('forms.select_item')
                                  : t('forms.select_item')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <CommandInput id="item-search-input" placeholder={t('forms.search_item') || "Search item..."} />
                                <CommandList>
                                  <CommandEmpty>{t('forms.no_item_found')}</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((p) => (
                                      <CommandItem
                                        key={p.id}
                                        value={`${p.itemCode} - ${p.name}`.toLowerCase()}
                                        onSelect={() => {
                                          handleItemSelect(p.id);
                                          setOpenItemCombobox(false);
                                          setTimeout(() => document.getElementById("quantity-input")?.focus(), 0);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            newItemId === p.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="flex items-center gap-2 text-base py-1 !text-[#064e3b] !font-bold">
                                          {p.itemCode && (
                                            <span className="px-1.5 py-0.5 rounded bg-green-100 font-mono text-xs font-bold !text-[#064e3b]">
                                              {p.itemCode}
                                            </span>
                                          )}
                                          <span className="!font-bold !text-[#064e3b]">{p.name}</span>
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-bold">Qty</Label>
                            <Input
                              id="quantity-input"
                              ref={qtyRef}
                              placeholder="e.g. 120"
                              value={newItemQuantity}
                              onChange={e => setNewItemQuantity(e.target.value)}
                              type="number"
                              className="h-10"
                              disabled={isSubmitting}
                              onKeyDown={(e) => handleKeyDown(e, "price-input")}
                            />
                          </div>
                          <div>
                            <Label className="font-bold">Price (per Kg)</Label>
                            <Input
                              id="price-input"
                              ref={priceRef}
                              placeholder="e.g. 50"
                              value={newItemPrice}
                              onChange={e => setNewItemPrice(e.target.value)}
                              type="number"
                              className="h-10"
                              disabled={isSubmitting}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddItem();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <Button type="button" onClick={handleAddItem} disabled={isSubmitting} className="w-full h-11 bg-green-700 hover:bg-green-800 text-white font-bold">
                          <Plus className="mr-2 h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col min-h-0 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xl text-[#064e3b]">
                        {t('forms.items_list')}
                      </h3>
                      <span className="text-sm font-semibold text-[#064e3b] bg-green-100 px-3 py-1 rounded-full">
                        {fields.length} Items
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col rounded-lg border p-4 min-h-0 overflow-hidden bg-white">
                      {/* Table Area (Scrollable) */}
                      <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="font-bold text-[#064e3b] text-base">Item</TableHead>
                              <TableHead className="text-right font-bold text-[#064e3b] text-base">Qty</TableHead>
                              <TableHead className="text-right font-bold text-[#064e3b] text-base">Price</TableHead>
                              <TableHead className="text-right font-bold text-[#064e3b] text-base">Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground/60 italic text-base">No items added.</TableCell>
                              </TableRow>
                            )}
                            {fields.map((field, index) => {
                              const product = products.find(p => p.id === field.itemId);
                              return (
                                <TableRow key={field.id}>
                                  <TableCell className="font-medium">{product?.name}</TableCell>
                                  <TableCell className="text-right">{field.quantity}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(field.price)}</TableCell>
                                  <TableCell className="text-right font-bold">{formatCurrency(field.quantity * field.price)}</TableCell>
                                  <TableCell>
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

                      {/* Summary Section (Pinned to Bottom) */}
                      <div className="mt-auto pt-6 border-t bg-white">
                        <div className="flex justify-between items-start gap-8">
                          {/* Left: Summary Labels */}
                          <div className="flex-1 space-y-3 max-w-[300px]">
                            <div className="grid grid-cols-2 gap-x-4 items-center">
                              <span className="text-green-800 font-bold text-base">{t('forms.outstanding')}:</span>
                              <span className="text-right font-bold text-base text-red-500">{formatCurrency(outstanding)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 items-center">
                              <span className="text-green-800 font-bold text-base">{t('forms.total_bill')}:</span>
                              <span className="text-right font-bold text-base text-slate-700">{formatCurrency(totalCost)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 items-center">
                              <span className="text-green-800 font-bold text-base">{t('forms.paid_amount')}:</span>
                              <span className="text-right font-bold text-base text-green-600">{formatCurrency(watchedAmountPaid || 0)}</span>
                            </div>

                            <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-100 flex justify-between items-center">
                              <span className="text-[#064e3b] font-bold text-xl">{t('forms.grand_total')}:</span>
                              <span className="text-[#064e3b] font-bold text-2xl">{formatCurrency(balanceAmount)}</span>
                            </div>
                          </div>

                          {/* Right: Paid Amount Input */}
                          <div className="w-[280px] space-y-2">
                            <Label htmlFor="amount-paid-input" className="text-[#064e3b] font-bold block text-base">{t('forms.amount_paid')}</Label>
                            <FormField
                              control={form.control}
                              name="amountPaid"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                      <Input
                                        id="amount-paid-input"
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-11 text-right h-12 font-bold bg-slate-50/50 border-slate-200 focus:bg-white focus:border-green-500 transition-colors text-lg"
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={isSubmitting}
                                        onKeyDown={(e) => handleKeyDown(e, "submit-button")}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-between items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => clearBill()}
                  disabled={isSubmitting}
                  className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('actions.clear_bill')}
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.handleSubmit((data) => onSubmit(data, 'a5'))()}
                    disabled={isSubmitting || watchedItems.length === 0}
                    className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    {t('actions.a5_print_out')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.handleSubmit((data) => onSubmit(data, 'thermal'))()}
                    disabled={isSubmitting || watchedItems.length === 0}
                    className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    {t('actions.thermal_receipt')}
                  </Button>
                  <Button
                    id="submit-button"
                    type="submit"
                    disabled={isSubmitting || watchedItems.length === 0}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold h-11 px-8 shadow-md hover:shadow-lg transition-all min-w-[120px]"
                  >
                    {isSubmitting ? t('actions.loading') : t('actions.save_bill')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isSubmitting || watchedItems.length === 0}
                    className="h-11 w-11 rounded-full border-slate-200 text-slate-400 hover:text-green-600"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main >
    </>
  );
}

