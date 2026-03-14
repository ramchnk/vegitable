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
                <table width="100%">
                    <tbody>
                        <tr>
                            <td>C.No: {billNo}</td>
                            <td style={{ textAlign: 'right' }}>{customerName}</td>
                        </tr>
                    </tbody>
                </table>
                {customerAddress && (
                    <table width="100%">
                        <tbody>
                            <tr>
                                <td className="font-normal text-[12px]">{customerAddress}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
                {customerPhone && (
                    <table width="100%">
                        <tbody>
                            <tr>
                                <td width="30%" className="font-normal text-[12px]">Mobile:</td>
                                <td className="font-normal text-[12px]">{customerPhone}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mb-1 text-[12px] font-bold">
                <table className="border-t border-black pt-1.5" width="100%">
                    <tbody>
                        <tr>
                            <td>B.No:{billNo.toString().padStart(6, '0')}</td>
                            <td style={{ textAlign: 'center' }}>{format(date, 'HH:mm')}</td>
                            <td style={{ textAlign: 'right' }}>Dt :{format(date, 'dd/MM/yy')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="border-b border-black my-1.5" />

            {/* Items Table */}
            <table width="100%" className="border-collapse">
                <thead>
                    <tr className="font-bold text-[13px] border-b border-black">
                        <th align="left" className="py-1.5">Particulars</th>
                        <th align="right" className="py-1.5" style={{ width: '45px' }}>Qty</th>
                        <th align="right" className="py-1.5" style={{ width: '65px' }}>Rate</th>
                        <th align="right" className="py-1.5" style={{ width: '80px' }}>Amount</th>
                    </tr>
                </thead>
                <tbody className="text-[13px] leading-relaxed">
                    {items.map((item, index) => (
                        <tr key={index} className="align-top border-b border-black/10">
                            <td className="py-1">{item.name}</td>
                            <td align="right" className="py-1 font-bold">{item.quantity}</td>
                            <td align="right" className="py-1 font-bold ">{item.price.toFixed(2)}</td>
                            <td align="right" className="py-1 font-bold">{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Totals */}
            <div className="space-y-1 mt-2">
                <table width="100%" className="text-[12px] font-bold">
                    <tbody>
                        <tr>
                            <td>{totalItems} Items | Qty {totalQty}</td>
                            <td style={{ textAlign: 'right' }}>{totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="border-b border-black my-2" />

                <table width="100%">
                    <tbody>
                        <tr>
                            <td style={{ fontSize: '16px', fontWeight: 900 }}>TOTAL Rs.</td>
                            <td style={{ textAlign: 'right', fontSize: '24px', fontWeight: 900 }}>{totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="space-y-0.5 text-[13px] font-bold mt-2">
                    <table width="100%">
                        <tbody>
                            <tr>
                                <td>Old. Bal. :</td>
                                <td align="right">{oldBalance.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Cur. Bal. :</td>
                                <td align="right">{currentBalance.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
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
