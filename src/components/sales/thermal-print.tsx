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
        <div ref={ref} className="p-1 font-mono text-[9.5px] w-[58mm] mx-auto bg-white text-black leading-tight border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="text-center mb-1">
                <h1 className="text-sm font-black uppercase tracking-tighter">ஓம் சரவணா ஏஜென்சி</h1>
                <p className="text-[8px] font-bold">26-26 மருந்தீஸ்வரர் காம்ப்ளக்ஸ்</p>
                <p className="text-[8px] font-bold">திருவான்மியூர், சென்னை-41</p>
                <p className="text-[8px]">Ph: 9176134333, 7305984233</p>
            </div>

            <div className="border-b border-black border-dashed my-1" />

            {/* Sub-Header */}
            <div className="text-center font-bold mb-1 text-xs uppercase tracking-tight">
                {paymentType === "Cash" ? "Cash Bill" : "Credit Bill"}
            </div>

            <div className="mb-1 text-[11px] font-black uppercase">
                <p>{customerName}</p>
                {customerAddress && <p className="text-[8px] font-normal">{customerAddress}</p>}
                {customerPhone && <p className="text-[8px] font-normal">Ph: {customerPhone}</p>}
            </div>

            <div className="flex justify-between mb-0.5 text-[9px] font-bold">
                <span>No: {billNo}</span>
                <span>{format(date, 'dd/MM/yy hh:mm a')}</span>
            </div>

            <div className="border-b border-black border-dashed my-1" />

            {/* Items Table */}
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-black border-dashed font-black text-[10px]">
                        <th className="text-left pb-1">Items</th>
                        <th className="text-right pb-1 px-1" style={{ width: '30px' }}>Qty</th>
                        <th className="text-right pb-1 px-1" style={{ width: '40px' }}>Price</th>
                        <th className="text-right pb-1 pl-1" style={{ width: '45px' }}>Total</th>
                    </tr>
                </thead>
                <tbody className="text-[10px] leading-tight">
                    {items.map((item, index) => (
                        <tr key={index} className="align-top">
                            <td className="py-0.5 truncate max-w-[80px]">{item.name}</td>
                            <td className="py-0.5 text-right whitespace-nowrap px-1">{item.quantity}</td>
                            <td className="py-0.5 text-right whitespace-nowrap px-1">{item.price.toFixed(0)}</td>
                            <td className="py-0.5 text-right whitespace-nowrap pl-1 font-bold">{item.total.toFixed(0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed my-1" />

            {/* Footer Totals */}
            <div className="space-y-0.5 mt-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>{totalItems} Items (Qty: {totalQty})</span>
                    <span className="font-black text-xs">Sub: {totalAmount.toFixed(0)}</span>
                </div>

                <div className="border-b border-black border-double my-1.5" />

                <div className="flex justify-between text-sm font-black items-center tracking-tighter">
                    <span>GRAND TOTAL</span>
                    <span className="text-base leading-none">Rs. {totalAmount.toFixed(0)}</span>
                </div>

                <div className="border-b border-black border-dashed my-1.5" />

                <div className="flex justify-between text-[10px] items-center">
                    <span className="font-bold">Old Balance:</span>
                    <span className="font-black">{oldBalance.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[11px] items-center pt-0.5">
                    <span className="font-black">Closing Balance:</span>
                    <span className="font-black text-sm">{currentBalance.toFixed(0)}</span>
                </div>
            </div>

            <div className="border-t border-black border-dashed mt-4 pt-2" />

            {/* Footer Message */}
            <div className="text-center text-[10px] italic space-y-0.5 leading-tight font-bold">
                <p>&quot;சப்ளை செய்யப்படும்!</p>
                <p className="">மீண்டும் வருக!! நன்றி!&quot;</p>
            </div>
        </div>
    );
});

ThermalPrint.displayName = "ThermalPrint";
