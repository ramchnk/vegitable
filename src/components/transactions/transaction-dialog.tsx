"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, User, Wallet, Banknote, Scale, FileText, ChevronsUpDown, Search } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
            "z-[9999] w-[--radix-popover-trigger-width] rounded-md border bg-popover p-0 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
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
    const paymentMethodRef = useRef<HTMLSelectElement>(null);
    const narrationRef = useRef<HTMLInputElement>(null);
    const partyButtonRef = useRef<HTMLButtonElement>(null);
    const printBtnRef = useRef<HTMLButtonElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPartyPopoverOpen, setIsPartyPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(0);

    const filteredParties = useMemo(() => {
        const partyList = type === "Customer" 
            ? customers.filter((c: any) => c.code !== "000") 
            : suppliers;
        return partyList.filter((p: any) => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [type, customers, suppliers, searchQuery]);

    useEffect(() => {
        setFocusedIndex(0);
    }, [searchQuery, isPartyPopoverOpen]);

    const handleSelectParty = (party: any) => {
        setSelectedPartyId(party.id);
        setSelectedPartyName(party.name);
        const paymentDetail = (type === "Customer" ? customerPayments : supplierPayments)
            .find(p => p.partyId === party.id);
        setSelectedDueAmount(paymentDetail?.dueAmount || 0);
        form.setValue("partyId", party.id);
        setIsPartyPopoverOpen(false);
        setSearchQuery("");
        setTimeout(() => amountInputRef.current?.focus(), 100);
    };

    // Helper: move focus up/down/next through fields
    const handleFieldKeyDown = (
        e: React.KeyboardEvent,
        refs: React.RefObject<HTMLElement | null>[]
    ) => {
        const active = document.activeElement;
        const isSelect = active?.tagName.toLowerCase() === "select";
        const isButton = active?.tagName.toLowerCase() === "button";

        // Let native select dropdown handle its own navigation arrows
        if (isSelect && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ")) {
            return;
        }
        
        // Let buttons trigger natively on Enter
        if (isButton && e.key === "Enter") {
            return;
        }

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
            e.preventDefault();
            const currentIndex = refs.findIndex(r => r.current === active);
            if (currentIndex === -1) return;
            
            // Enter or ArrowDown moves to the next field
            const nextIndex = (e.key === "ArrowDown" || e.key === "Enter")
                ? Math.min(currentIndex + 1, refs.length - 1)
                : Math.max(currentIndex - 1, 0);
                
            refs[nextIndex].current?.focus();
        }
    };

    const fieldRefs = [partyButtonRef, amountInputRef, paymentMethodRef, narrationRef, printBtnRef, submitBtnRef] as React.RefObject<HTMLElement | null>[];

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
            <DialogContent className="max-w-[420px] p-0 overflow-visible border border-[#E5E7EB] shadow-xl rounded-2xl bg-white">
                {/* Header */}
                <DialogHeader
                    className="px-6 py-4 rounded-t-2xl"
                    style={{ backgroundColor: themeColor }}
                >
                    <DialogTitle className="text-base font-semibold tracking-wide text-white">
                        {type === "Customer" ? t('payments.buyer_title') : t('payments.supplier_title')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="px-6 py-5 space-y-5">

                        {/* Party Selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {type === "Customer" ? t('forms.customer') : t('forms.supplier')}
                            </Label>
                            {partyId ? (
                                <div className="px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{partyName}</span>
                                    <User className="h-4 w-4 text-gray-400" />
                                </div>
                            ) : (
                                <div className="relative">
                                        <Button
                                            ref={partyButtonRef}
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isPartyPopoverOpen}
                                            className="w-full justify-between h-10 border-[#E5E7EB] text-sm font-medium text-gray-800 rounded-lg"
                                            onClick={() => setIsPartyPopoverOpen(!isPartyPopoverOpen)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setIsPartyPopoverOpen(!isPartyPopoverOpen);
                                                } else if (!isPartyPopoverOpen) {
                                                    handleFieldKeyDown(e, fieldRefs);
                                                }
                                            }}
                                        >
                                            {selectedPartyId
                                                ? (type === "Customer" ? customers : suppliers).find((p) => p.id === selectedPartyId)?.name
                                                : (type === "Customer" ? t('forms.select_customer') : t('forms.select_supplier'))}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                        </Button>
                                    
                                    {isPartyPopoverOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 z-[9999] rounded-md border bg-white shadow-xl overflow-hidden flex flex-col">
                                            <div className="flex items-center border-b px-3">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder={type === "Customer" ? t('forms.search_customer') : t('forms.search_supplier')}
                                                    autoFocus
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            setIsPartyPopoverOpen(false);
                                                        } else if (e.key === "ArrowDown") {
                                                            e.preventDefault();
                                                            setFocusedIndex(prev => Math.min(prev + 1, filteredParties.length - 1));
                                                        } else if (e.key === "ArrowUp") {
                                                            e.preventDefault();
                                                            setFocusedIndex(prev => Math.max(prev - 1, 0));
                                                        } else if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            const party = filteredParties[focusedIndex];
                                                            if (party) handleSelectParty(party);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                                                {(type === "Customer" ? customersLoading : suppliersLoading) && (
                                                    <div className="p-4 text-center text-xs text-muted-foreground italic">Loading...</div>
                                                )}
                                                
                                                {filteredParties.length === 0 && !customersLoading && !suppliersLoading ? (
                                                    <div className="p-4 text-center text-sm text-gray-500">{type === "Customer" ? t('forms.no_customer_found') : t('forms.no_supplier_found')}</div>
                                                ) : (
                                                    filteredParties.map((party, index) => (
                                                        <button
                                                            key={party.id}
                                                            type="button"
                                                            className={cn(
                                                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                                                index === focusedIndex ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100 hover:text-gray-900"
                                                            )}
                                                            onMouseEnter={() => setFocusedIndex(index)}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleSelectParty(party);
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
                                                                <span className="font-semibold">{party.name}</span>
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Balance Summary Card */}
                        <div className="rounded-xl border border-[#E5E7EB] bg-gray-50 divide-y divide-[#E5E7EB]">
                            {/* Opening Balance */}
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {t('payments.opening_balance_debit')}
                                </span>
                                <span className="text-sm font-bold text-gray-700">
                                    {(selectedDueAmount || 0).toFixed(0)}
                                </span>
                            </div>
                            {/* Closing Balance */}
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {t('payments.closing_balance')}
                                </span>
                                <span className={cn(
                                    "text-lg font-black",
                                    closingBalance < 0 ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {closingBalance.toFixed(0)}
                                </span>
                            </div>
                        </div>

                        {/* Amount Field */}
                        <FormField
                            control={form.control}
                            name="givenAmount"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t('payments.given_amount')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? ""}
                                            ref={amountInputRef}
                                            className="h-11 rounded-lg border-[#E5E7EB] bg-white text-base font-bold text-gray-900 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                            onKeyDown={(e) => handleFieldKeyDown(e, fieldRefs)}
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
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t('forms.payment_type') || 'Payment Method'}
                                    </FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            ref={paymentMethodRef}
                                            className="w-full h-11 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            onKeyDown={(e) => handleFieldKeyDown(e, fieldRefs)}
                                        >
                                            <option value="Cash">{t('payments.cash') || 'Cash'}</option>
                                            <option value="GPay">GPay</option>
                                            <option value="NEFT">{t('forms.neft') || 'Card / Bank'}</option>
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Narration */}
                        <FormField
                            control={form.control}
                            name="narration"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {t('payments.narration')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            ref={narrationRef}
                                            value={field.value ?? ""}
                                            placeholder={t('payments.narration')}
                                            autoComplete="off"
                                            className="h-11 rounded-lg border-[#E5E7EB] bg-white text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                            onKeyDown={(e) => handleFieldKeyDown(e, fieldRefs)}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Divider */}
                        <div className="border-t border-[#E5E7EB]" />

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                            {/* Save & Print – secondary outline */}
                            <Button
                                ref={printBtnRef}
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isSubmitting || !givenAmount || givenAmount <= 0}
                                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                                className="h-10 px-4 text-sm font-semibold border-[#E5E7EB] text-gray-700 hover:bg-gray-50"
                                onKeyDown={(e) => handleFieldKeyDown(e, fieldRefs)}
                            >
                                {t('actions.save_and_print')}
                            </Button>
                            {/* Submit – primary */}
                            <Button
                                ref={submitBtnRef}
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !givenAmount || givenAmount <= 0 || !selectedPartyId}
                                className={cn("h-10 px-6 text-sm font-semibold text-white border-none shadow-sm", btnColor)}
                                onKeyDown={(e) => handleFieldKeyDown(e, fieldRefs)}
                            >
                                {isSubmitting ? "…" : t('actions.submit')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

