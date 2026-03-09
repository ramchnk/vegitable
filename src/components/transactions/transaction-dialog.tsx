"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, User, Wallet, Banknote, Scale, FileText, ChevronsUpDown } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { createRoot } from 'react-dom/client';
import { PaymentReceipt } from "./payment-receipt";

const PopoverContentInsideDialog = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
            "z-[100] w-[--radix-popover-trigger-width] rounded-md border bg-popover p-0 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));
PopoverContentInsideDialog.displayName = "PopoverContentInsideDialog";

const transactionFormSchema = z.object({
    partyId: z.string().min(1, "Required"),
    givenAmount: z.coerce.number().min(0.01, "Amount must be > 0"),
    paymentMethod: z.enum(["Cash", "GPay", "NEFT"]),
    narration: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "Customer" | "Supplier";
    partyId?: string;
    partyName?: string;
    initialDueAmount?: number;
    onSuccess?: () => void;
}

export function TransactionDialog({
    open,
    onOpenChange,
    type,
    partyId,
    partyName,
    initialDueAmount,
    onSuccess,
}: TransactionDialogProps) {
    const { addPayment, customers, customerPayments, suppliers, supplierPayments, customersLoading, suppliersLoading, loading } = useTransactions();
    const { toast } = useToast();
    const { t } = useLanguage();
    const amountInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPartyPopoverOpen, setIsPartyPopoverOpen] = useState(false);

    // Internal state for when used as a global dialog
    const [selectedPartyId, setSelectedPartyId] = useState<string | undefined>(partyId);
    const [selectedPartyName, setSelectedPartyName] = useState<string | undefined>(partyName);
    const [selectedDueAmount, setSelectedDueAmount] = useState<number | undefined>(initialDueAmount);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            partyId: partyId || "",
            givenAmount: undefined,
            paymentMethod: "Cash",
            narration: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                partyId: partyId || "",
                givenAmount: undefined,
                paymentMethod: "Cash",
                narration: "",
            });
            setSelectedPartyId(partyId);
            setSelectedPartyName(partyName);
            setSelectedDueAmount(initialDueAmount);

            if (partyId) {
                setTimeout(() => {
                    amountInputRef.current?.focus();
                }, 100);
            }
        }
    }, [open, partyId, partyName, initialDueAmount, form]);

    const { givenAmount, paymentMethod, narration } = form.watch();

    const closingBalance = useMemo(() => {
        return (selectedDueAmount || 0) - (givenAmount || 0);
    }, [selectedDueAmount, givenAmount]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(node => node.cloneNode(true));
            styles.forEach(style => printWindow.document.head.appendChild(style));

            const hideHeaderFooterStyle = printWindow.document.createElement('style');
            hideHeaderFooterStyle.innerHTML = `
        @page { size: 80mm auto; margin: 0; }
        body { margin: 0; padding: 0; width: 80mm; }
        * { box-sizing: border-box; }
      `;
            printWindow.document.head.appendChild(hideHeaderFooterStyle);
            printWindow.document.title = '';

            const container = printWindow.document.createElement('div');
            printWindow.document.body.appendChild(container);
            const root = createRoot(container);
            root.render(
                <PaymentReceipt
                    date={new Date()}
                    partyName={partyName || selectedPartyName || ""}
                    partyType={type}
                    paymentMethod={paymentMethod === "Cash" ? t('payments.cash') : (paymentMethod === "NEFT" ? t('forms.neft') : paymentMethod)}
                    amount={givenAmount || 0}
                    narration={narration}
                    oldBalance={initialDueAmount || selectedDueAmount || 0}
                    currentBalance={closingBalance}
                />
            );
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 1000);
        }
    };

    async function onSubmit(data: TransactionFormValues, shouldPrint: boolean = false) {
        setIsSubmitting(true);
        try {
            await addPayment(
                selectedPartyId!,
                selectedPartyName!,
                type,
                data.givenAmount,
                data.paymentMethod,
                data.narration
            );

            toast({
                title: t('common.success'),
                description: t('payments.payment_added_success'),
            });

            if (shouldPrint) {
                handlePrint();
            }

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Submit error:", error);
            toast({
                variant: "destructive",
                title: t('common.error'),
                description: t('common.error_occurred'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const themeColor = type === "Customer" ? "#6366f1" : "#166534";
    const btnColor = type === "Customer" ? "bg-[#4f46e5] hover:bg-[#4338ca]" : "bg-[#16a34a] hover:bg-[#15803d]";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-visible border-none shadow-2xl">
                <DialogHeader className="p-3 text-white" style={{ backgroundColor: themeColor }}>
                    <DialogTitle className="text-base font-bold">
                        {type === "Customer" ? t('payments.buyer_title') : t('payments.supplier_title')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="p-5 space-y-4">
                        {/* Party Selection (Searchable Dropdown if no partyId provided) */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-bold text-gray-700">
                                {type === "Customer" ? t('forms.customer') : t('forms.supplier')}
                            </Label>
                            {partyId ? (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-black text-gray-900 truncate">{partyName}</span>
                                    <User className="h-4 w-4 text-slate-400" />
                                </div>
                            ) : (
                                <Popover open={isPartyPopoverOpen} onOpenChange={setIsPartyPopoverOpen} modal={false}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between h-10 border-gray-300 font-bold text-gray-900"
                                        >
                                            {selectedPartyId
                                                ? (type === "Customer" ? customers : suppliers).find((p) => p.id === selectedPartyId)?.name
                                                : (type === "Customer" ? t('forms.select_customer') : t('forms.select_supplier'))}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContentInsideDialog
                                        className="w-[--radix-popover-trigger-width] p-0"
                                        align="start"
                                    >
                                        <Command onKeyDown={(e) => {
                                            // Prevent Escape from closing the Dialog while in the Command list
                                            if (e.key === "Escape") {
                                                e.stopPropagation();
                                                setIsPartyPopoverOpen(false);
                                            }
                                        }}>
                                            <CommandInput
                                                placeholder={type === "Customer" ? t('forms.search_customer') : t('forms.search_supplier')}
                                                autoFocus
                                            />
                                            <CommandList>
                                                {(type === "Customer" ? customersLoading : suppliersLoading) && (
                                                    <div className="p-4 text-center text-xs text-muted-foreground italic">Loading...</div>
                                                )}
                                                <CommandEmpty>{type === "Customer" ? t('forms.no_customer_found') : t('forms.no_supplier_found')}</CommandEmpty>
                                                <CommandGroup>
                                                    {(type === "Customer" 
                                                        ? customers.filter(c => (c as any).code !== "000") 
                                                        : suppliers).map((party) => (
                                                        <CommandItem
                                                            value={`${(party as any).code || ''} ${party.name}`}
                                                            key={party.id}
                                                            onSelect={() => {
                                                                setSelectedPartyId(party.id);
                                                                setSelectedPartyName(party.name);

                                                                // Fetch due amount
                                                                const paymentDetail = (type === "Customer" ? customerPayments : supplierPayments)
                                                                    .find(p => p.partyId === party.id);
                                                                setSelectedDueAmount(paymentDetail?.dueAmount || 0);

                                                                form.setValue("partyId", party.id);
                                                                setIsPartyPopoverOpen(false);

                                                                setTimeout(() => amountInputRef.current?.focus(), 100);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    party.id === selectedPartyId ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <span className="flex items-center gap-2">
                                                                {(party as any).code && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-600">
                                                                        {(party as any).code}
                                                                    </span>
                                                                )}
                                                                <span className="font-bold">{party.name}</span>
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContentInsideDialog>
                                </Popover>
                            )}
                        </div>

                        {/* Opening Balance */}
                        <div className="grid grid-cols-2 items-center gap-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-sm font-bold text-gray-700">{t('payments.opening_balance_debit')}</span>
                            <span className="text-base font-black text-slate-900 text-right">{(selectedDueAmount || 0).toFixed(0)}</span>
                        </div>

                        {/* Amount Field */}
                        <FormField
                            control={form.control}
                            name="givenAmount"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-bold text-gray-700">
                                        {t('payments.given_amount')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? ""}
                                            ref={amountInputRef}
                                            className="bg-white border-gray-300 h-10 text-lg font-bold focus-visible:ring-1 focus-visible:ring-blue-400"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method */}
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <div className="flex flex-row items-center justify-between py-2 bg-slate-50/50 rounded-lg px-3 gap-2">
                                    {["Cash", "GPay", "NEFT"].map((method) => (
                                        <div key={method} className="flex items-center space-x-2 font-bold">
                                            <Checkbox
                                                id={method}
                                                checked={field.value === method}
                                                onCheckedChange={(checked) => {
                                                    if (checked) field.onChange(method);
                                                }}
                                                className="h-5 w-5 border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                            />
                                            <Label htmlFor={method} className="text-xs font-bold cursor-pointer uppercase text-gray-600 tracking-tight">
                                                {method === "Cash" ? t('payments.cash') : (method === "NEFT" ? t('forms.neft') : method)}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />

                        {/* Closing Balance */}
                        <div className="grid grid-cols-2 items-center gap-4 py-1">
                            <span className="text-sm font-bold text-gray-700">{t('payments.closing_balance')}</span>
                            <span className={cn("text-xl font-black text-right", closingBalance < 0 ? "text-red-600" : "text-emerald-700")}>
                                {closingBalance.toFixed(0)}
                            </span>
                        </div>

                        {/* Narration */}
                        <FormField
                            control={form.control}
                            name="narration"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-bold text-gray-700">
                                        {t('payments.narration')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value ?? ""}
                                            placeholder={t('payments.narration')}
                                            autoComplete="off"
                                            className="bg-white border-gray-300 h-10 text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-10 px-5 font-bold border-slate-200 text-gray-600"
                            >
                                {t('actions.cancel')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isSubmitting || !givenAmount || givenAmount <= 0}
                                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                                className="h-10 px-5 font-bold border-slate-200 text-gray-700"
                            >
                                {t('actions.save_and_print')}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !givenAmount || givenAmount <= 0 || !selectedPartyId}
                                className={cn("h-10 px-8 font-bold text-white border-none shadow-md", btnColor)}
                            >
                                {isSubmitting ? "..." : t('actions.submit')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

