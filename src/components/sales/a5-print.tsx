import React from 'react';
import { format } from 'date-fns';

interface A5PrintProps {
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
    paidAmount: number;
}

export const A5Print = React.forwardRef<HTMLDivElement, A5PrintProps>((props, ref) => {
    const {
        billNo,
        date,
        customerName,
        customerAddress,
        customerPhone,
        items,
        totalAmount,
        oldBalance,
        currentBalance,
        paidAmount
    } = props;

    // Fill empty rows to maintain A5 height/look
    const minRows = 15;
    const emptyRows = Math.max(0, minRows - items.length);

    return (
        <div ref={ref} className="w-[148mm] h-[210mm] bg-white text-black font-sans p-4 relative text-sm">
            {/* Header */}
            <div className="flex flex-col items-center mb-1">
                <h1 className="text-xl font-bold uppercase tracking-wider">OM SARAVANA AGENCY</h1>
                <p className="font-bold text-xs">26-26 MARUNTHEESWARAR COMPLEX</p>
                <p className="font-bold text-xs">THIRUVANMIYUR, CHENNAI - 41</p>
                <p className="font-bold text-xs mt-1">Ph : 9176134333,7305984233,(COMPLAINT-8248255011)</p>
                <h2 className="text-lg font-bold mt-1">G-PAY - 9381202227</h2>
            </div>

            {/* Customer & Bill Details */}
            <div className="flex border border-black mb-1">
                {/* Left Side: Customer */}
                <div className="w-[60%] border-r border-black p-1">
                    <div className="flex">
                        <span className="font-bold w-10">To :</span>
                        <span className="font-bold uppercase">{customerName}</span>
                    </div>
                    <div className="ml-10">
                        {customerAddress && <p>{customerAddress}</p>}
                        {customerPhone && <p>{customerPhone}</p>}
                    </div>
                </div>

                {/* Right Side: Bill Info */}
                <div className="w-[40%] flex flex-col">
                    <div className="flex border-b border-black">
                        <div className="w-1/2 border-r border-black p-1 text-center font-bold">{format(date, 'h:mm a')}</div>
                        <div className="w-1/2 p-1 text-center font-bold text-base">Bill No : {billNo}</div>
                    </div>
                    <div className="flex flex-1">
                        <div className="w-1/2 border-r border-black p-1 flex items-center justify-center font-bold">Date</div>
                        <div className="w-1/2 p-1 flex items-center justify-center font-bold">{format(date, 'dd/MM/yyyy')}</div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="border border-black mb-1">
                {/* Table Header */}
                <div className="flex border-b border-black text-center font-bold bg-transparent">
                    <div className="w-[8%] border-r border-black py-1">S.No</div>
                    <div className="w-[47%] border-r border-black py-1 text-left px-2">Description</div>
                    <div className="w-[15%] border-r border-black py-1">QTY</div>
                    <div className="w-[15%] border-r border-black py-1">Rate</div>
                    <div className="w-[15%] py-1">Amount</div>
                </div>

                {/* Table Body */}
                {items.map((item, index) => (
                    <div key={index} className="flex border-b border-black text-sm h-6">
                        <div className="w-[8%] border-r border-black text-center">{index + 1}</div>
                        <div className="w-[47%] border-r border-black px-2 truncate uppercase text-left">{item.name}</div>
                        <div className="w-[15%] border-r border-black text-center">{item.quantity.toFixed(3)}</div>
                        <div className="w-[15%] border-r border-black text-right px-1">{item.price.toFixed(2)}</div>
                        <div className="w-[15%] text-right px-1">{item.total.toFixed(2)}</div>
                    </div>
                ))}

                {/* Empty Rows */}
                {Array.from({ length: emptyRows }).map((_, index) => (
                    <div key={`empty-${index}`} className="flex border-b border-black text-sm h-6">
                        <div className="w-[8%] border-r border-black"></div>
                        <div className="w-[47%] border-r border-black"></div>
                        <div className="w-[15%] border-r border-black"></div>
                        <div className="w-[15%] border-r border-black"></div>
                        <div className="w-[15%]"></div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="border border-black text-sm font-bold">
                <div className="flex border-b border-black">
                    <div className="w-[65%] text-right pr-2 py-1"></div>
                    <div className="w-[15%] border-l border-r border-black text-center py-1">GrossTotal</div>
                    <div className="w-[20%] text-right px-1 py-1">{totalAmount.toFixed(2)}</div>
                </div>
                <div className="flex border-b border-black">
                    <div className="w-[15%] border-r border-black text-center py-1">O/Bal</div>
                    <div className="w-[20%] border-r border-black text-right px-1 py-1">{oldBalance.toFixed(2)}</div>
                    <div className="w-[30%] border-r border-black"></div>
                    <div className="w-[15%] border-r border-black text-center py-1">Paid.</div>
                    <div className="w-[20%] text-right px-1 py-1">{paidAmount.toFixed(2)}</div>
                </div>
                <div className="flex">
                    <div className="w-[15%] border-r border-black text-center py-1">Cur.Bal.</div>
                    <div className="w-[20%] border-r border-black text-right px-1 py-1">{currentBalance.toFixed(2)}</div>
                    <div className="w-[30%] border-r border-black"></div>
                    <div className="w-[15%] border-r border-black text-center py-1 text-xs">Total Amount</div>
                    <div className="w-[20%] text-right px-1 py-1">{(totalAmount - paidAmount).toFixed(2)}</div>
                </div>
            </div>

        </div>
    );
});

A5Print.displayName = "A5Print";
