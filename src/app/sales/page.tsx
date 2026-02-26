
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash, Printer, MessageCircle, Check, ChevronsUpDown, History, Users, CreditCard, Folder } from "lucide-react";
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
    const [outstanding, setOutstanding] = useState(0);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const creatingRef = useRef(false);

    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const customerTriggerRef = useRef<HTMLButtonElement>(null);
    const itemTypeTriggerRef = useRef<HTMLButtonElement>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);

    const form = useForm<SalesFormValues>({
        resolver: zodResolver(salesFormSchema),
        defaultValues: {
            customerId: "",
            salesDate: new Date(),
            items: [],
            amountPaid: "" as any,
            paymentType: "Cash",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Navigation Guard
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (fields.length > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [fields.length]);

    const watchedCustomerId = form.watch("customerId");
    const watchedItems = form.watch("items");
    const watchedAmountPaid = form.watch("amountPaid");
    const watchedSalesDate = form.watch("salesDate");

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
                deleteCustomer(dup.id, true).catch(err => console.error(`Failed to delete duplicate customer ${dup.id}:`, err));
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
                addCustomer({ name: "Walk-in Customer", contact: "", address: "", code: "000" }, true)
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
            const customer = customers.find(c => c.id === watchedCustomerId);
            const isWalkIn = customer?.name.toLowerCase() === "walk-in customer";

            if (isWalkIn) {
                setOutstanding(0);
            } else {
                const payment = customerPayments.find(p => p.partyId === watchedCustomerId);
                setOutstanding(payment?.dueAmount || 0);
            }
        } else {
            setOutstanding(0);
        }
    }, [watchedCustomerId, customerPayments, customers]);

    const totalCost = useMemo(() =>
        watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0),
        [watchedItems]
    );

    // Auto-update Paid Amount for Walk-in Customer
    useEffect(() => {
        const customer = customers.find(c => c.id === watchedCustomerId);
        const isWalkIn = customer?.name.toLowerCase() === "walk-in customer";
        if (isWalkIn) {
            form.setValue("amountPaid", totalCost === 0 ? "" as any : totalCost);
        }
    }, [watchedCustomerId, totalCost, customers, form]);

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
                quantity: item.quantity,
                price: item.price,
            };
        });

        addTransaction(
            newTransactions,
            { name: customer.name, contact: customer.contact, address: customer.address },
            finalAmountPaid
        );

        toast({ title: 'Success', description: 'Sales entry submitted successfully.' });
        form.reset({
            customerId: "",
            salesDate: new Date(),
            items: [],
            amountPaid: "" as any,
            paymentType: "Cash",
        });
    }

    const clearBill = () => {
        form.reset({
            customerId: "",
            salesDate: new Date(),
            items: [],
            amountPaid: "" as any,
            paymentType: "Cash",
        });
        toast({ title: "Bill Cleared", description: "All fields have been reset." });
    };


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
            <Header title="New Sales Entry">
                <div className="flex items-center gap-2">
                    <Link href="/sales/customers">
                        <Button size="sm" variant="outline" className="gap-1">
                            <Users className="h-4 w-4" />
                            Customers
                        </Button>
                    </Link>
                    <Link href="/sales/payments">
                        <Button size="sm" variant="outline" className="gap-1">
                            <CreditCard className="h-4 w-4" />
                            Payments
                        </Button>
                    </Link>
                    <Link href="/sales/history">
                        <Button size="sm" variant="outline" className="gap-1">
                            <History className="h-4 w-4" />
                            History
                        </Button>
                    </Link>
                </div>
            </Header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-muted/20">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left Column: Bill Info & Item Entry */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Bill Information Card */}
                                <Card className="shadow-sm border-primary/10">
                                    <CardHeader className="pb-3 border-b bg-muted/30">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            Bill Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                                            <div>
                                                <Label className="text-xs text-muted-foreground uppercase font-bold">Bill Number</Label>
                                                <div className="text-xl font-bold text-primary">#{
                                                    (() => {
                                                        const targetDate = watchedSalesDate ? format(watchedSalesDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                                                        const maxBillNumber = useTransactions().transactions
                                                            .filter(t => t.date === targetDate)
                                                            .reduce((max, t) => (t.billNumber || 0) > max ? (t.billNumber || 0) : max, 0);
                                                        return maxBillNumber + 1;
                                                    })()
                                                }</div>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="paymentType"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex flex-col gap-1"
                                                            >
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="Cash" className="h-4 w-4" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-semibold text-sm cursor-pointer">Cash Bill</FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="Credit" className="h-4 w-4" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-semibold text-sm cursor-pointer">Credit Bill</FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="customerId"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="font-semibold">Customer</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    ref={customerTriggerRef}
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="w-full justify-between h-10 !text-[#064e3b] !font-bold"
                                                                >
                                                                    {field.value
                                                                        ? customers.find((c) => c.id === field.value)?.name
                                                                            ? `${customers.find((c) => c.id === field.value)?.code || ''} - ${customers.find((c) => c.id === field.value)?.name}`
                                                                            : "Select Customer"
                                                                        : "Select Customer"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search customer..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No customer found.</CommandEmpty>
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
                                                                                <span className="flex items-center gap-2 text-base py-1 !text-[#064e3b] !font-bold">
                                                                                    {customer.code && (
                                                                                        <span className="px-1.5 py-0.5 rounded bg-green-100 font-mono text-xs font-bold !text-[#064e3b]">
                                                                                            {customer.code}
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="!font-bold !text-[#064e3b]">{customer.name}</span>
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
                                            name="salesDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="font-semibold">Sales Date</FormLabel>
                                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    ref={dateTriggerRef}
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal h-10",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                                                            <DatePickerCustom
                                                                selected={field.value}
                                                                onSelect={(date) => {
                                                                    field.onChange(date);
                                                                    if (date) setTimeout(() => itemTypeTriggerRef.current?.focus(), 0);
                                                                }}
                                                                onClose={() => setIsCalendarOpen(false)}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Add Items Card */}
                                <Card className="shadow-sm border-primary/10">
                                    <CardHeader className="pb-3 border-b bg-muted/30">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-primary" />
                                            Add Items
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Item Type</Label>
                                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        ref={itemTypeTriggerRef}
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCombobox}
                                                        className="w-full justify-between h-10 !text-[#064e3b] !font-bold"
                                                    >
                                                        {newItemId
                                                            ? products.find((p) => p.id === newItemId)?.name
                                                                ? `${products.find((p) => p.id === newItemId)?.itemCode} - ${products.find((p) => p.id === newItemId)?.name}`
                                                                : "Select Item Type"
                                                            : "Select Item Type"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search item..." />
                                                        <CommandList>
                                                            <CommandEmpty>No item found.</CommandEmpty>
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
                                                                        <span className="flex items-center gap-2 text-base py-1 !text-[#064e3b] !font-bold">
                                                                            {product.itemCode && (
                                                                                <span className="px-1.5 py-0.5 rounded bg-green-100 font-mono text-xs font-bold !text-[#064e3b]">
                                                                                    {product.itemCode}
                                                                                </span>
                                                                            )}
                                                                            <span className="!font-bold !text-[#064e3b]">{product.name}</span>
                                                                        </span>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="font-semibold">Weight/KG</Label>
                                                <Input
                                                    ref={weightRef}
                                                    placeholder="0.00"
                                                    value={newItemQuantity}
                                                    onChange={e => setNewItemQuantity(e.target.value)}
                                                    type="number"
                                                    className="h-10"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            priceRef.current?.focus();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-semibold">Price</Label>
                                                <Input
                                                    ref={priceRef}
                                                    placeholder="0.00"
                                                    value={newItemPrice}
                                                    onChange={e => setNewItemPrice(e.target.value)}
                                                    type="number"
                                                    className="h-10"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddItem();
                                                            setTimeout(() => itemTypeTriggerRef.current?.focus(), 0);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <Button type="button" onClick={handleAddItem} className="w-full h-10 mt-2 gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add to List
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Items List & Total */}
                            <div className="lg:col-span-8 space-y-6">
                                <Card className="flex flex-col h-full shadow-sm border-primary/10 min-h-[500px]">
                                    <CardHeader className="pb-3 border-b bg-muted/30 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">Items List</CardTitle>
                                            <CardDescription>Review and manage items for this bill</CardDescription>
                                        </div>
                                        <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                                            {fields.length} Items
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0 overflow-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="w-[40%]">Item</TableHead>
                                                    <TableHead className="text-right">Weight / KG</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right font-bold">Total</TableHead>
                                                    <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fields.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                                                            No items added yet. Use the form on the left to add items.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    fields.map((field, index) => {
                                                        const product = products.find(p => p.id === field.itemId);
                                                        return (
                                                            <TableRow key={field.id} className="hover:bg-muted/30 transition-colors">
                                                                <TableCell className="font-medium">{product?.name}</TableCell>
                                                                <TableCell className="text-right">{field.quantity.toFixed(2)}</TableCell>
                                                                <TableCell className="text-right">{formatCurrency(field.price)}</TableCell>
                                                                <TableCell className="text-right font-bold">{formatCurrency(field.quantity * field.price)}</TableCell>
                                                                <TableCell>
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 hover:text-destructive">
                                                                        <Trash className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>

                                    <CardFooter className="border-t bg-muted/30 flex flex-col gap-4 pt-6">
                                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Total Bill:</span>
                                                    <span className="font-semibold">{formatCurrency(totalCost)}</span>
                                                </div>
                                                {(() => {
                                                    const customer = customers.find(c => c.id === watchedCustomerId);
                                                    const isWalkIn = customer?.name.toLowerCase() === "walk-in customer";
                                                    if (isWalkIn) return null;
                                                    return (
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Outstanding:</span>
                                                            <span className="font-semibold text-destructive">{formatCurrency(outstanding)}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <div className="flex justify-between items-center bg-primary/10 p-2 rounded text-lg font-bold text-primary">
                                                    <span>Grand Total:</span>
                                                    <span>{formatCurrency(balanceAmount)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-end gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="amountPaid"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-sm font-bold text-primary">Paid Amount</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        id="amountPaid"
                                                                        type="number"
                                                                        className="pl-9 text-right font-bold text-lg h-10 border-primary/20"
                                                                        placeholder="0.00"
                                                                        {...field}
                                                                        value={field.value === 0 ? "" : field.value}
                                                                        onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full flex items-center gap-2 pt-2 border-t">
                                            <Button type="button" variant="outline" onClick={clearBill} className="gap-2">
                                                <Trash className="h-4 w-4" />
                                                Clear Bill
                                            </Button>
                                            <div className="flex-1" />
                                            <Button type="submit" size="lg" className="px-8 shadow-md">Save Bill</Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button type="button" variant="outline" size="icon" className="h-11 w-11 border-primary/20 hover:bg-primary/5">
                                                        <Printer className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onSelect={() => setTimeout(handlePrintThermal, 100)} className="gap-2 py-2">
                                                        <Printer className="h-4 w-4" />
                                                        Thermal Receipt
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setTimeout(handlePrintA5, 100)} className="gap-2 py-2">
                                                        <Printer className="h-4 w-4" />
                                                        A5 Print Out
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button type="button" variant="outline" size="icon" onClick={handleWhatsApp} className="h-11 w-11 text-green-600 hover:text-green-700 hover:bg-green-50">
                                                <MessageCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </form>
                </Form>
            </main >
        </>
    );
}
