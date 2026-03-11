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
        <div ref={ref} className="p-2 font-mono text-[12px] w-[80mm] mx-auto bg-white text-black leading-tight">
            {/* Header */}
            <div className="text-center mb-1.5">
                <h1 className="text-lg font-black mb-1 whitespace-nowrap">ஓம் சரவணா ஏஜென்சி</h1>
                <p className="text-[12px] font-bold">26-26 மருந்தீஸ்வரர் காம்ப்ளக்ஸ்</p>
                <p className="text-[12px] font-bold">திருவான்மியூர், சென்னை-41.</p>
                <p className="text-[12px] font-bold">:{customerPhone ? `9176134333,7305984233(${customerPhone})` : '9176134333,7305984233'}</p>
            </div>

            <div className="text-center font-bold mb-1.5 text-[13px] uppercase">
                {paymentType === "Cash" ? "CASH BILL" : "CREDIT BILL"}
            </div>

            <div className="mb-1.5 text-[13px] font-bold uppercase">
                <div className="flex gap-2">
                    <span>C.No: {billNo}</span>
                    <span className="flex-1">{customerName}</span>
                </div>
                {customerAddress && (
                    <div className="flex justify-between font-normal text-[12px]">
                        <span>{customerAddress}</span>
                    </div>
                )}
                {customerPhone && (
                    <div className="flex gap-2 font-normal text-[12px]">
                        <span>Mobile:</span>
                        <span>{customerPhone}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between mb-1 text-[12px] font-bold border-t border-black pt-1.5">
                <span>B.No:{billNo.toString().padStart(6, '0')}</span>
                <span>{format(date, 'HH:mm')}</span>
                <span>C.No 1</span>
                <span>Dt :{format(date, 'dd/MM/yy')}</span>
            </div>

            <div className="border-b border-black my-1.5" />

            {/* Items Table */}
            <table className="w-full border-collapse">
                <thead>
                    <tr className="font-bold text-[13px] border-b border-black">
                        <th className="text-left py-1.5">Particulars</th>
                        <th className="text-right py-1.5" style={{ width: '45px' }}>Qty</th>
                        <th className="text-right py-1.5" style={{ width: '65px' }}>Rate</th>
                        <th className="text-right py-1.5" style={{ width: '80px' }}>Amount</th>
                    </tr>
                </thead>
                <tbody className="text-[13px] leading-relaxed">
                    {items.map((item, index) => (
                        <tr key={index} className="align-top border-b border-black/10">
                            <td className="py-1">{item.name}</td>
                            <td className="py-1 text-right font-bold">{item.quantity}</td>
                            <td className="py-1 text-right font-bold ">{item.price.toFixed(2)}</td>
                            <td className="py-1 text-right font-bold">{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Totals */}
            <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center text-[12px] font-bold">
                    <div className="flex gap-6">
                        <span>{totalItems} Items</span>
                        <span>Qty {totalQty}</span>
                    </div>
                    <span className="">{totalAmount.toFixed(2)}</span>
                </div>

                <div className="border-b border-black my-2" />

                <div className="flex justify-between text-lg font-black items-center">
                    <span className="text-base">TOTAL Rs.</span>
                    <span className="text-2xl">{totalAmount.toFixed(2)}</span>
                </div>

                <div className="space-y-0.5 text-[13px] font-bold mt-2">
                    <div className="flex justify-between">
                        <span>Old. Bal. :</span>
                        <span>{oldBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Cur. Bal. :</span>
                        <span>{currentBalance.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-black mt-3 pt-3" />

            {/* Footer Message */}
            <div className="text-center text-[12px] font-bold space-y-1">
                <p>சப்ளை செய்யப்படும் !</p>
                <p>நன்றி ! மீண்டும் வருக !!</p>
            </div>
        </div>
    );
});

ThermalPrint.displayName = "ThermalPrint";
