"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash, Printer, MessageCircle } from "lucide-react";
import Link from "next/link";

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
import { products } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
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
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export default function AddSalesPage() {
  const { customers, customerPayments, addTransaction } = useTransactions();
  const { toast } = useToast();
  const [outstanding, setOutstanding] = useState(0);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      customerId: "",
      salesDate: new Date(),
      items: [],
      amountPaid: 0,
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
    
    const paymentMethod = data.amountPaid < totalCost ? 'Credit' : 'Cash';

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
        data.amountPaid
    );

    toast({ title: 'Success', description: 'Sales entry submitted successfully.' });
    form.reset({
      customerId: data.customerId, // Keep customer selected
      salesDate: new Date(),
      items: [],
      amountPaid: 0,
    });
  }

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
    const product = products.find(p => p.id === itemId);
    if (product) {
      setNewItemPrice(product.rate1.toString());
    }
  }

  return (
    <>
      <Header title="Sales">
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
        </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>New Sales Entry</CardTitle>
                <CardDescription>Log details of item sold to customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salesDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                         <FormLabel>Sales Date</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

                <div className="space-y-2 rounded-lg border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
                        <div className="md:col-span-3">
                            <Label>Item Type</Label>
                            <Select onValueChange={handleItemSelect} value={newItemId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Item Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                             <Label>Weight/KG</Label>
                            <Input placeholder="e.g. 100" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} type="number" />
                        </div>
                        <div className="md:col-span-2">
                             <Label>Price</Label>
                            <Input placeholder="e.g. 80" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} type="number" />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="button" size="icon" onClick={handleAddItem} className="w-full">
                                <Plus className="h-4 w-4"/>
                                <span className="sr-only">Add Item</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div>
                  <FormLabel>Items</FormLabel>
                   <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Weight / KG</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead><span className="sr-only">Remove</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">No items added.</TableCell>
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
                            <span className="font-medium text-muted-foreground">Total</span>
                            <span className="text-right font-medium">{formatCurrency(totalCost)}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4 items-center">
                            <span className="font-medium text-muted-foreground">Net Amount</span>
                            <span className="text-right font-medium">{formatCurrency(netAmount)}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4 items-center">
                            <FormLabel htmlFor="amountPaid">Debit</FormLabel>
                             <FormField
                                control={form.control}
                                name="amountPaid"
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <Input id="amountPaid" type="number" className="text-right" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4 items-center font-bold">
                            <span>Total</span>
                            <span className="text-right">{formatCurrency(balanceAmount)}</span>
                         </div>
                    </div>
                </div>

              </CardContent>
              <CardFooter className="gap-2">
                <Button type="submit" size="lg">Submit Sales</Button>
                <Button type="button" variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon"><MessageCircle className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </main>
    </>
  );
}
