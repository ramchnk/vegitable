import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface PaymentReceiptProps {
    date: Date;
    partyName: string;
    partyType: "Customer" | "Supplier";
    paymentMethod: string;
    amount: number;
    narration?: string;
    oldBalance: number;
    currentBalance: number;
}

export const PaymentReceipt = React.forwardRef<HTMLDivElement, PaymentReceiptProps>((props, ref) => {
    const {
        date,
        partyName,
        partyType,
        paymentMethod,
        amount,
        oldBalance,
        currentBalance
    } = props;

    return (
        <div ref={ref} className="p-4 font-mono text-sm w-[80mm] bg-white text-black box-border overflow-hidden">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold tracking-widest uppercase">RECEIPT</h1>
                <p className="text-xs font-bold mt-1">({partyType === "Customer" ? "CUSTOMER PAYMENT" : "SUPPLIER PAYMENT"})</p>
            </div>

            {/* Date and Name */}
            <div className="space-y-4 mb-4 text-base font-bold">
                <div className="flex items-center gap-2">
                    <span>Date :</span>
                    <span>{format(date, 'dd-MM-yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Name :</span>
                    <span className="uppercase">{partyName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Type :</span>
                    <span className="text-sm">{paymentMethod === "NEFT" ? "Card/Bank" : paymentMethod}</span>
                </div>
            </div>

            <div className="border-t-2 border-black my-2" />

            {/* Old Balance */}
            <div className="flex justify-between items-center py-1 text-base font-bold">
                <span>Old Balance</span>
                <span>{Number(oldBalance || 0).toFixed(2)}</span>
            </div>

            {/* Payments */}
            <div className="flex justify-between items-start pt-2 text-base font-bold">
                <div className="flex flex-col">
                    <span>Payments :</span>
                    <span className="text-sm pl-2">{paymentMethod === "NEFT" ? "Card/Bank" : paymentMethod}</span>
                </div>
                <span className="pt-0.5">{Number(amount || 0).toFixed(2)}</span>
            </div>

            <div className="border-t-2 border-black my-2" />

            {/* Current Balance */}
            <div className="flex justify-between items-center py-1 text-base font-bold">
                <span>Current Balance :</span>
                <span>{Number(currentBalance || 0).toFixed(2)}</span>
            </div>

            <div className="border-t-2 border-black w-1/2 my-4" />
        </div>
    );
});

PaymentReceipt.displayName = "PaymentReceipt";
