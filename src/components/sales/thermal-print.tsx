import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface ThermalPrintProps {
    billNo: number;
    date: Date;
    customerName: string;
    customerAddress?: string;
    customerPhone?: string;
    paymentType: "Cash" | "Credit";
    items: {
        name: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    totalAmount: number;
    oldBalance: number;
    currentBalance: number;
    totalItems: number;
    totalQty: number;
}

export const ThermalPrint = React.forwardRef<HTMLDivElement, ThermalPrintProps>((props, ref) => {
    const {
        billNo,
        date,
        customerName,
        customerAddress,
        customerPhone,
        paymentType,
        items,
        totalAmount,
        oldBalance,
        currentBalance,
        totalItems,
        totalQty
    } = props;

    return (
        <div ref={ref} className="p-2 font-mono text-xs w-[78mm] mx-auto bg-white text-black">
            {/* Header */}
            <div className="text-center mb-2">
                <h1 className="text-lg font-bold">ஓம் சரவணா ஏஜென்சி</h1>
                <p>26-26 மருந்தீஸ்வரர் காம்ப்ளக்ஸ்</p>
                <p>திருவான்மியூர், சென்னை-41</p>
                <p>Ph: 9176134333, 7305984233 (CMPLT-8248255011)</p>
            </div>

            <div className="border-b border-black border-dashed my-2" />

            {/* Sub-Header */}
            <div className="text-center font-bold mb-2 text-sm">
                {paymentType.toUpperCase()} BILL
            </div>

            <div className="mb-2">
                <p className="font-bold">{customerName}</p>
                {customerAddress && <p>{customerAddress}</p>}
                {customerPhone && <p>Ph: {customerPhone}</p>}
            </div>

            <div className="flex justify-between mb-1">
                <span>No: {billNo}</span>
                <span>Dt: {format(date, 'dd/MM/yy hh:mm a')}</span>
            </div>

            <div className="border-b border-black border-dashed my-2" />

            {/* Items Table */}
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="pb-1 w-[40%]">Items</th>
                        <th className="pb-1 text-right w-[15%]">Qty</th>
                        <th className="pb-1 text-right w-[20%]">Price</th>
                        <th className="pb-1 text-right w-[25%]">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 align-top">{item.name}</td>
                            <td className="py-1 text-right align-top">{item.quantity}</td>
                            <td className="py-1 text-right align-top">{item.price.toFixed(2)}</td>
                            <td className="py-1 text-right align-top">{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed my-2" />

            {/* Footer Totals */}
            <div className="flex justify-between font-bold mb-1">
                <span>{totalItems} Items</span>
                <span>Qty: {totalQty}</span>
                <span>{totalAmount.toFixed(2)}</span>
            </div>

            <div className="border-b border-black border-dashed my-2" />

            <div className="flex justify-between text-lg font-bold mb-2">
                <span>TOTAL Rs.</span>
                <span>{totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
                <span>Old. Bal.:</span>
                <span>{oldBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
                <span>Cur. Bal.:</span>
                <span>{currentBalance.toFixed(2)}</span>
            </div>

            <div className="border-b border-black border-dashed my-4" />

            {/* Footer Message */}
            <div className="text-center text-sm">
                <p>&quot;சப்ளை செய்யப்படும்!</p>
                <p className="mt-1"> மீண்டும் வருக!! நன்றி!&quot;</p>
            </div>
        </div>
    );
});

ThermalPrint.displayName = "ThermalPrint";
