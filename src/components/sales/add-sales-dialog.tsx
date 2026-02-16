
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash } from "lucide-react";
import { products } from "@/lib/data";
import { useState } from "react";

const salesFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  contact: z.string().min(1, "Contact is required"),
  address: z.string().min(1, "Address is required"),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one item is required"),
  paymentMethod: z.enum(["Cash", "UPI/Digital", "Credit"]),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export function AddSalesDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      customerName: "",
      contact: "",
      address: "",
      items: [{ itemName: "", price: 0, quantity: 1 }],
      paymentMethod: "Cash",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function onSubmit(data: SalesFormValues) {
    console.log(data);
    // Here you would typically handle the form submission, e.g., send to an API
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Sales</DialogTitle>
          <DialogDescription>
            Enter the details of the new sale. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Venkatesh" {...field} />
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
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. 9123456780" {...field} />
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. T. Nagar, Chennai" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="space-y-2">
                <FormLabel>Items</FormLabel>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`items.${index}.itemName`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormControl>
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an item" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`items.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" size="sm" onClick={() => append({ itemName: "", price: 0, quantity: 1 })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
                <FormMessage>{form.formState.errors.items?.message}</FormMessage>
            </div>

            <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI/Digital">UPI/Digital</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <DialogFooter>
                <Button type="submit">Save Sales</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
