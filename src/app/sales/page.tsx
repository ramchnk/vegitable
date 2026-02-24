
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash, Printer, MessageCircle, Check, ChevronsUpDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { createRoot } from 'react-dom/client';
import { A5Print } from '@/components/sales/a5-print';
import { ThermalPrint } from '@/components/sales/thermal-print';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Users, CreditCard } from "lucide-react";

const saleItemSchema = z.object({
  itemId: z.string().min(1, "Item is required."),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

const salesFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  salesDate: z.date(),
  items: z.array(saleItemSchema).min(1, "At least one item is required."),
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative."),
  paymentType: z.enum(["Cash", "Credit"], {
    required_error: "You need to select a payment type.",
  }),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export default function SalesPage() {
  const { customers, customerPayments, addTransaction, products, addCustomer, deleteCustomer, loading, transactions } = useTransactions(); // Added transactions and deleteCustomer
  const { toast } = useToast();
  const { t } = useLanguage();
  const [outstanding, setOutstanding] = useState(0);
  const creatingRef = useRef(false);

  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const itemTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      customerId: "",
      salesDate: new Date(),
      items: [],
      amountPaid: undefined,
      paymentType: "Cash",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedCustomerId = form.watch("customerId");
  const watchedItems = form.watch("items");
  const watchedAmountPaid = form.watch("amountPaid");

  useEffect(() => {
    if (loading) return;

    // 1. Cleanup Duplicates
    const walkInCustomers = customers.filter(c => c.name.toLowerCase() === "walk-in customer");
    if (walkInCustomers.length > 1) {
      // Keep the first one (or the one with code '000' if others are different, but they likely all have '000')
      // Let's just keep the first one found and delete the others.
      const [keep, ...duplicates] = walkInCustomers;
      console.log(`Found ${duplicates.length} duplicate Walk-in Customers. Deleting...`);
      duplicates.forEach(dup => {
        deleteCustomer(dup.id).catch(err => console.error(`Failed to delete duplicate customer ${dup.id}:`, err));
      });
    }
  }, [customers, loading]);

  useEffect(() => {
    if (loading) return;

    // Check for "Walk-in Customer"
    const walkInCustomers = customers.filter(c => c.name.toLowerCase() === "walk-in customer");

    if (walkInCustomers.length > 0) {
      // If exists, select the first one if nothing selected
      const walkIn = walkInCustomers[0];
      if (!form.getValues("customerId")) {
        form.setValue("customerId", walkIn.id);
      }
    } else {
      // Create only if absolutely no walk-in customer exists
      if (!creatingRef.current) {
        creatingRef.current = true;
        addCustomer({ name: "Walk-in Customer", contact: "", address: "", code: "000" })
          .then(() => {
            console.log("Created default Walk-in Customer");
          })
          .catch(err => {
            console.error("Failed to create default customer:", err);
            creatingRef.current = false; // Reset on failure so we can try again
          });
        // Note: We don't reset creatingRef to false immediately on success to prevent double-fire in some strict modes
        // But in production it's fine. 
      }
    }
  }, [customers, loading, form, addCustomer]);

  useEffect(() => {
    if (watchedCustomerId) {
      const payment = customerPayments.find(p => p.partyId === watchedCustomerId);
      setOutstanding(payment?.dueAmount || 0);
    } else {
      setOutstanding(0);
    }
  }, [watchedCustomerId, customerPayments]);

  const totalCost = useMemo(() =>
    watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0),
    [watchedItems]
  );

  const netAmount = totalCost;
  const balanceAmount = netAmount - (watchedAmountPaid || 0);

  function onSubmit(data: SalesFormValues) {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected customer not found.' });
      return;
    }

    const paymentMethod = data.paymentType;
    // If Cash bill is selected, amountPaid should be totalCost by default if not entered?
    // Actually, logic below handles amountPaidOverride.
    // If "Cash", we assume full payment unless user typed something else?
    // Let's stick to the requested UI: "Cash Bill" vs "Credit Bill".
    // Usually "Cash Bill" means paid in full immediately.

    // We need to ensure amountPaid matches totalCost if it's a Cash Bill and user didn't enter anything?
    // But the form has an amountPaid field.
    // Let's assume if "Cash Bill" is selected, we treat it as paid.

    // HOWEVER, previous logic: const paymentMethod = data.amountPaid < totalCost ? 'Credit' : 'Cash';
    // Now we rely on the radio button.

    const finalAmountPaid = data.paymentType === 'Cash' ? totalCost : (data.amountPaid || 0);

    const newTransactions = data.items.map(item => {
      const product = products.find(p => p.id === item.itemId);
      return {
        date: format(data.salesDate, 'yyyy-MM-dd'),
        party: customer.name,
        type: 'Sale' as const,
        item: product?.name || 'Unknown Item',
        amount: item.price * item.quantity,
        payment: paymentMethod,
      };
    });

    addTransaction(
      newTransactions,
      { name: customer.name, contact: customer.contact, address: customer.address },
      finalAmountPaid
    );

    toast({ title: 'Success', description: 'Sales entry submitted successfully.' });
    form.reset({
      customerId: data.customerId, // Keep customer selected
      salesDate: new Date(),
      items: [],
      amountPaid: undefined,
      paymentType: "Cash",
    });
  }

  const [newItemId, setNewItemId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

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
    const product = products.find(p => p.id === itemId);
    if (product) {
      setNewItemPrice("");
    }
  }

  const handleWhatsApp = () => {
    const customerId = form.getValues("customerId");
    if (!customerId) {
      toast({
        variant: "destructive",
        title: "No Customer Selected",
        description: "Please select a customer first.",
      });
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer?.contact) {
      toast({
        variant: "destructive",
        title: "No Contact Info",
        description: "This customer does not have a contact number.",
      });
      return;
    }

    const items = form.getValues("items");
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "No Items",
        description: "Please add items to the sale.",
      });
      return;
    }

    const totalCostValue = items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);

    let message = `Hello ${customer.name},\n\nHere is your bill summary:\n\n`;
    items.forEach(item => {
      const product = products.find(p => p.id === item.itemId);
      message += `- ${product?.name || 'Unknown Item'} (${item.quantity} kg) @ ${formatCurrency(item.price)}/kg = ${formatCurrency(item.quantity * item.price)}\n`;
    });
    message += `\n*Total Amount: ${formatCurrency(totalCostValue)}*\n\n`;
    message += `Thank you for your business!`;

    const phoneNumber = customer.contact.replace(/[^0-9]/g, '');
    const whatsappNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  }

  /* Implemented Thermal Print functionality */
  const handlePrintThermal = () => {
    const customerId = form.getValues("customerId");
    if (!customerId) {
      toast({ variant: "destructive", title: "Error", description: "Select a customer to print." });
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const items = form.getValues("items").map(item => {
      const product = products.find(p => p.id === item.itemId);
      return {
        name: product?.name || "Unknown",
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      };
    });

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Add items to print." });
      return;
    }

    const billNo = (transactions.reduce((max, t) => (t.billNumber || 0) > max ? (t.billNumber || 0) : max, 0) + 1);
    const date = form.getValues("salesDate");
    const paymentType = form.getValues("paymentType");
    const manualAmountPaid = form.getValues("amountPaid") || 0;

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const totalItems = items.length;
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate balances
    // Old Balance is the current outstanding from database
    const oldBalance = outstanding;

    // Amount Paid for this calculation
    // If Cash Bill, usually means fully paid? Or just the type is Cash?
    // Based on onSubmit logic: const finalAmountPaid = data.paymentType === 'Cash' ? totalCost : (data.amountPaid || 0);
    const amountPaid = paymentType === 'Cash' ? totalAmount : manualAmountPaid;

    const currentBalance = oldBalance + totalAmount - amountPaid;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {

      // Copy styles
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(node => node.cloneNode(true));

      styles.forEach(style => printWindow.document.head.appendChild(style));

      const container = printWindow.document.createElement('div');
      printWindow.document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        <ThermalPrint
          billNo={billNo}
          date={date}
          customerName={customer.name}
          customerAddress={customer.address}
          customerPhone={customer.contact}
          paymentType={paymentType}
          items={items}
          totalAmount={totalAmount}
          oldBalance={oldBalance}
          currentBalance={currentBalance}
          totalItems={totalItems}
          totalQty={totalQty}
        />
      );

      // Wait for render and styles then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  /* Implemented A5 Print functionality */
  const handlePrintA5 = () => {
    const customerId = form.getValues("customerId");
    if (!customerId) {
      toast({ variant: "destructive", title: "Error", description: "Select a customer to print." });
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const items = form.getValues("items").map(item => {
      const product = products.find(p => p.id === item.itemId);
      return {
        name: product?.name || "Unknown",
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      };
    });

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Add items to print." });
      return;
    }

    const billNo = (transactions.reduce((max, t) => (t.billNumber || 0) > max ? (t.billNumber || 0) : max, 0) + 1);
    const date = form.getValues("salesDate");
    const paymentType = form.getValues("paymentType");
    const manualAmountPaid = form.getValues("amountPaid") || 0;

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const oldBalance = outstanding;
    const amountPaid = paymentType === 'Cash' ? totalAmount : manualAmountPaid;
    const currentBalance = oldBalance + totalAmount - amountPaid;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(node => node.cloneNode(true));

      styles.forEach(style => printWindow.document.head.appendChild(style));

      const container = printWindow.document.createElement('div');
      printWindow.document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        <A5Print
          billNo={billNo}
          date={date}
          customerName={customer.name}
          customerAddress={customer.address}
          customerPhone={customer.contact}
          paymentType={paymentType}
          items={items}
          totalAmount={totalAmount}
          oldBalance={oldBalance}
          currentBalance={currentBalance}
          paidAmount={amountPaid}
        />
      );

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  return (
    <>
      <Header title={t('forms.new_sales_entry')}>
        <div className="flex items-center gap-2">
          <Link href="/sales/customers">
            <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm">
              <Users className="h-4 w-4" />
              {t('nav.customers')}
            </Button>
          </Link>
          <Link href="/sales/payments">
            <Button size="sm" className="gap-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none shadow-sm">
              <CreditCard className="h-4 w-4" />
              {t('nav.payments')}
            </Button>
          </Link>
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>

              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-bold text-primary">{t('forms.customer')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? customers.find((c) => c.id === field.value)?.name
                                    ? `${customers.find((c) => c.id === field.value)?.code ? customers.find((c) => c.id === field.value)?.code + ' - ' : ''}${customers.find((c) => c.id === field.value)?.name}`
                                    : t('forms.select_customer')
                                  : t('forms.select_customer')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder={t('forms.search_customer')} />
                              <CommandList>
                                <CommandEmpty>{t('forms.no_customer_found')}</CommandEmpty>
                                <CommandGroup>
                                  {customers.map((customer) => (
                                    <CommandItem
                                      value={`${customer.code || ''} ${customer.name}`}
                                      key={customer.id}
                                      onSelect={() => {
                                        form.setValue("customerId", customer.id);
                                        itemTypeTriggerRef.current?.focus();
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          customer.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {customer.code && <span className="mr-2 font-mono text-muted-foreground">{customer.code}</span>}
                                      {customer.name}
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
                    name="salesDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-bold text-primary">{t('forms.sales_date')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                ref={dateTriggerRef}
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
                              onSelect={(date) => {
                                field.onChange(date);
                                // Small timeout to ensure the popover closure doesn't steal focus back immediately if that's an issue, 
                                // but usually direct focus works.
                                if (date) setTimeout(() => itemTypeTriggerRef.current?.focus(), 0);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg border p-4 bg-muted/50 col-span-1 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                      <div>
                        <Label className="text-muted-foreground font-bold text-primary">{t('forms.bill_number')}</Label>
                        <div className="text-2xl font-bold">#{
                          (transactions.reduce((max, t) => (t.billNumber || 0) > max ? (t.billNumber || 0) : max, 0) + 1)
                        }</div>
                      </div>
                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem className="space-y-3 flex flex-col items-center md:col-start-2">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Cash" />
                                  </FormControl>
                                  <FormLabel className="font-bold text-primary cursor-pointer">
                                    {t('forms.cash_bill')}
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Credit" />
                                  </FormControl>
                                  <FormLabel className="font-bold text-primary cursor-pointer">
                                    {t('forms.credit_bill')}
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="font-bold text-primary">{t('forms.item_type')}</Label>
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            ref={itemTypeTriggerRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between"
                          >
                            {newItemId
                              ? products.find((p) => p.id === newItemId)?.name
                                ? `${products.find((p) => p.id === newItemId)?.itemCode} - ${products.find((p) => p.id === newItemId)?.name}`
                                : t('forms.select_item')
                              : t('forms.select_item')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder={t('forms.search_item')} />
                            <CommandList>
                              <CommandEmpty>{t('forms.no_item_found')}</CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={`${product.itemCode} - ${product.name}`}
                                    onSelect={() => {
                                      handleItemSelect(product.id)
                                      setOpenCombobox(false)
                                      setTimeout(() => weightRef.current?.focus(), 0);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newItemId === product.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {product.itemCode} - {product.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="col-span-3">
                      <Label className="font-bold text-primary">{t('forms.weight_kg')}</Label>
                      <Input
                        ref={weightRef}
                        placeholder="e.g. 100"
                        value={newItemQuantity}
                        onChange={e => setNewItemQuantity(e.target.value)}
                        type="number"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            priceRef.current?.focus();
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="font-bold text-primary">{t('forms.price')}</Label>
                      <Input
                        ref={priceRef}
                        placeholder="e.g. 80"
                        value={newItemPrice}
                        onChange={e => setNewItemPrice(e.target.value)}
                        type="number"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem();
                            setTimeout(() => itemTypeTriggerRef.current?.focus(), 0);
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button type="button" size="icon" onClick={handleAddItem} className="w-full">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">{t('forms.add_item')}</span>
                      </Button>
                    </div>
                  </div>
                </div>


                <div>
                  <FormLabel className="font-bold text-primary">{t('forms.items')}</FormLabel>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('forms.item')}</TableHead>
                          <TableHead className="text-right">{t('forms.weight_kg')}</TableHead>
                          <TableHead className="text-right">{t('forms.price')}</TableHead>
                          <TableHead className="text-right">{t('forms.total')}</TableHead>
                          <TableHead><span className="sr-only">{t('forms.remove_item')}</span></TableHead>
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

                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-muted-foreground">{t('forms.total')}</span>
                      <span className="text-right font-medium">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-muted-foreground">{t('forms.net_amount')}</span>
                      <span className="text-right font-medium">{formatCurrency(netAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <FormLabel htmlFor="amountPaid" className="font-bold text-primary">{t('forms.debit')}</FormLabel>
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
                    <div className="grid grid-cols-2 gap-4 items-center font-bold">
                      <span>{t('forms.total')}</span>
                      <span className="text-right">{formatCurrency(balanceAmount)}</span>
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="gap-2">
                <Button type="submit" size="lg">{t('forms.submit_sales')}</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrintThermal}>
                      Thermal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintA5}>
                      A5 Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button type="button" variant="outline" size="icon" onClick={handleWhatsApp}><MessageCircle className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main >
    </>
  );
}
