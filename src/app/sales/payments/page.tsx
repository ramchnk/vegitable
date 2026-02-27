
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { Check, X, ChevronsUpDown, User, Wallet, Banknote, Scale } from "lucide-react";
import { useTransactions } from "@/context/transaction-provider";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/context/language-context";

const transactionFormSchema = z.object({
  partyId: z.string().min(1, "Please select a customer"),
  givenAmount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(["Cash", "GPay", "NEFT"]),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function CustomerPaymentsPage() {
  const { customerPayments, addPayment } = useTransactions();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openPopover, setOpenPopover] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      partyId: "",
      givenAmount: undefined,
      paymentMethod: "Cash",
    },
  });

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId) {
      form.setValue("partyId", customerId);
      // Also auto-focus the amount input if a customer is pre-selected
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams, form]);

  const watchedPartyId = form.watch("partyId");
  const { givenAmount } = form.watch();

  const selectedPayment = useMemo(() =>
    customerPayments.find(p => p.partyId === watchedPartyId) || null
    , [watchedPartyId, customerPayments]);

  const closingBalance = useMemo(() => {
    if (!selectedPayment) return 0;
    return (selectedPayment.dueAmount || 0) - (givenAmount || 0);
  }, [selectedPayment, givenAmount]);

  async function onSubmit(data: TransactionFormValues) {
    if (selectedPayment) {
      try {
        await addPayment(
          selectedPayment.partyId,
          selectedPayment.partyName,
          "Customer",
          data.givenAmount,
          data.paymentMethod
        );
        form.reset({
          partyId: "",
          givenAmount: undefined,
          paymentMethod: "Cash",
        });
        router.push(`/sales/customers/${selectedPayment.partyId}`);
      } catch (error) {
        console.error("Submit error:", error);
      }
    }
  }

  return (
    <>
      <Header title={t('payments.buyer_title')} backHref="/credits" />
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 bg-gray-50">
        <Card className="w-full max-w-2xl overflow-hidden border-none shadow-lg">
          <div className="bg-[#3730a3] text-white p-4">
            <h2 className="text-xl font-medium">{t('payments.buyer_title')}</h2>
          </div>

          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">

                {/* Customer Selection */}
                <div className="grid grid-cols-[200px_1fr] items-center">
                  <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#3730a3]" />
                    {t('forms.customer')}
                  </Label>
                  <FormField
                    control={form.control}
                    name="partyId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover open={openPopover} onOpenChange={setOpenPopover}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!!searchParams.get("customerId")}
                                className={cn(
                                  "w-full justify-between bg-white border-gray-300 h-10 text-gray-900 font-medium",
                                  !field.value && "text-gray-500 font-normal",
                                  searchParams.get("customerId") && "opacity-100 bg-gray-50"
                                )}
                              >
                                {field.value
                                  ? (() => {
                                    const p = customerPayments.find((p) => p.partyId === field.value);
                                    return p ? `${p.partyName} ${p.code ? `(${p.code})` : ''}` : '';
                                  })()
                                  : t('payments.select_customer')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder={t('forms.search_customer')} />
                              <CommandList>
                                <CommandEmpty>{t('forms.no_customer_found')}</CommandEmpty>
                                <CommandGroup>
                                  {customerPayments.filter(p => p.code !== "000").map((p) => (
                                    <CommandItem
                                      value={`${p.partyName} ${p.code || ''}`}
                                      key={p.partyId}
                                      className="text-black font-semibold cursor-pointer data-[selected=true]:text-black"
                                      onSelect={() => {
                                        form.setValue("partyId", p.partyId);
                                        setOpenPopover(false);
                                        setTimeout(() => amountInputRef.current?.focus(), 0);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-[#4f46e5]",
                                          p.partyId === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="flex-1">
                                        {p.partyName}
                                        {p.code && <span className="ml-2 text-xs text-gray-400 font-normal">({p.code})</span>}
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
                </div>

                {/* Opening Balance */}
                <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 pb-4">
                  <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#3730a3]" />
                    {t('payments.opening_balance_debit')}
                  </Label>
                  <span className="text-xl font-bold">{selectedPayment ? selectedPayment.dueAmount.toFixed(0) : "0"}</span>
                </div>

                {/* Inputs */}
                <FormField
                  control={form.control}
                  name="givenAmount"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[200px_1fr] items-center space-y-0">
                      <FormLabel className="text-base font-bold text-gray-700 flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-[#3730a3]" />
                        {t('payments.given_amount')}
                      </FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            ref={amountInputRef}
                            className="bg-white border-gray-300 h-10 focus-visible:ring-1 focus-visible:ring-blue-400 w-full"
                          />
                        </FormControl>
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field: methodField }) => (
                            <div className="flex flex-row items-center gap-6 whitespace-nowrap ml-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="cash"
                                  checked={methodField.value === "Cash"}
                                  onCheckedChange={(checked) => {
                                    if (checked) methodField.onChange("Cash");
                                  }}
                                />
                                <Label htmlFor="cash" className="text-sm font-medium cursor-pointer">{t('payments.cash')}</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="gpay"
                                  checked={methodField.value === "GPay"}
                                  onCheckedChange={(checked) => {
                                    if (checked) methodField.onChange("GPay");
                                  }}
                                />
                                <Label htmlFor="gpay" className="text-sm font-medium cursor-pointer">{t('forms.gpay')}</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="neft"
                                  checked={methodField.value === "NEFT"}
                                  onCheckedChange={(checked) => {
                                    if (checked) methodField.onChange("NEFT");
                                  }}
                                />
                                <Label htmlFor="neft" className="text-sm font-medium cursor-pointer">{t('forms.neft')}</Label>
                              </div>
                            </div>
                          )}
                        />
                      </div>
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  )}
                />

                {/* Closing Balance */}
                <div className="grid grid-cols-[200px_1fr] items-center border-t border-gray-100 pt-4">
                  <Label className="text-base font-bold text-gray-700 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#3730a3]" />
                    {t('payments.closing_balance')}
                  </Label>
                  <span className="text-xl font-bold">{closingBalance.toFixed(0)}</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6">
                  <Button type="submit" className="bg-[#4f46e5] hover:bg-[#4338ca] text-white h-11 px-8 font-medium shadow-sm">
                    {t('actions.submit')}
                  </Button>
                  <Link href="/credits">
                    <Button type="button" variant="secondary" className="bg-[#64748b] hover:bg-[#475569] text-white h-11 px-8 font-medium border-none shadow-sm">
                      {t('actions.cancel')}
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
