"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, User, Wallet, Banknote, Scale, FileText } from "lucide-react";
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
import { createRoot } from 'react-dom/client';
import { PaymentReceipt } from "./payment-receipt";

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
    partyId: string;
    partyName: string;
    initialDueAmount: number;
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
    const { addPayment } = useTransactions();
    const { toast } = useToast();
    const { t } = useLanguage();
    const amountInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            partyId: partyId,
            givenAmount: undefined,
            paymentMethod: "Cash",
            narration: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                partyId: partyId,
                givenAmount: undefined,
                paymentMethod: "Cash",
                narration: "",
            });
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 100);
        }
    }, [open, partyId, form]);

    const { givenAmount, paymentMethod, narration } = form.watch();

    const closingBalance = useMemo(() => {
        return (initialDueAmount || 0) - (givenAmount || 0);
    }, [initialDueAmount, givenAmount]);

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
                    partyName={partyName}
                    partyType={type}
                    paymentMethod={paymentMethod === "Cash" ? t('payments.cash') : (paymentMethod === "NEFT" ? t('forms.neft') : paymentMethod)}
                    amount={givenAmount || 0}
                    narration={narration}
                    oldBalance={initialDueAmount}
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
                partyId,
                partyName,
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
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-3 text-white" style={{ backgroundColor: themeColor }}>
                    <DialogTitle className="text-base font-bold">
                        {type === "Customer" ? t('payments.buyer_title') : t('payments.supplier_title')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="p-5 space-y-4">
                        {/* Party Info */}
                        <div className="grid grid-cols-2 items-center gap-4">
                            <span className="text-sm font-bold text-gray-700">{type === "Customer" ? t('forms.customer') : t('forms.supplier')}</span>
                            <span className="text-sm font-black text-gray-900 text-right truncate">{partyName}</span>
                        </div>

                        {/* Opening Balance */}
                        <div className="grid grid-cols-2 items-center gap-4">
                            <span className="text-sm font-bold text-gray-700">{t('payments.opening_balance_debit')}</span>
                            <span className="text-base font-bold text-slate-900 text-right">{initialDueAmount.toFixed(0)}</span>
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
                                disabled={isSubmitting || !givenAmount || givenAmount <= 0}
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

