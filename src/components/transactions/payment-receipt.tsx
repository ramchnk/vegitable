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
                <table width="100%">
                    <tbody>
                        <tr>
                            <td width="30%">Date :</td>
                            <td>{format(date, 'dd-MM-yyyy')}</td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%">
                    <tbody>
                        <tr>
                            <td width="30%">Name :</td>
                            <td className="uppercase">{partyName}</td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%">
                    <tbody>
                        <tr>
                            <td width="30%">Type :</td>
                            <td className="text-sm">{paymentMethod === "NEFT" ? "Card/Bank" : paymentMethod}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="border-t-2 border-black my-2" />

            {/* Old Balance */}
            <table width="100%" className="py-1 text-base font-bold">
                <tbody>
                    <tr>
                        <td>Old Balance</td>
                        <td align="right">{Number(oldBalance || 0).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Payments */}
            <table width="100%" className="pt-2 text-base font-bold">
                <tbody>
                    <tr style={{ verticalAlign: 'top' }}>
                        <td>
                            <div>Payments :</div>
                            <div className="text-sm pl-2">{paymentMethod === "NEFT" ? "Card/Bank" : paymentMethod}</div>
                        </td>
                        <td align="right" className="pt-0.5">{Number(amount || 0).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="border-t-2 border-black my-2" />

            {/* Current Balance */}
            <table width="100%" className="py-1 text-base font-bold">
                <tbody>
                    <tr>
                        <td>Current Balance :</td>
                        <td align="right">{Number(currentBalance || 0).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="border-t-2 border-black w-1/2 my-4" />
        </div>
    );
});

PaymentReceipt.displayName = "PaymentReceipt";
