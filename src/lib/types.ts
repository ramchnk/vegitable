export type Product = {
    id: string;
    itemCode: string;
    name: string;
};

export type Supplier = {
    id: string;
    code: string;
    name: string;
    contact: string;
    address: string;
};

export type Customer = {
    id: string;
    code: string;
    name: string;
    contact: string;
    address: string;
};

export type LineItem = {
    itemName: string;
    price: number;
    quantity: number;
};

export type Purchase = {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string;
    items: LineItem[];
    paymentMethod: 'Cash' | 'UPI/Digital' | 'Credit';
    totalAmount: number;
};

export type Sale = {
    id: string;
    date: string;
    customerId: string;
    customerName: string;
    items: LineItem[];
    paymentMethod: 'Cash' | 'UPI/Digital' | 'Credit';
    totalAmount: number;
};

export type PaymentDetail = {
    id: string;
    partyId: string;
    partyName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod?: string;
}

export type Transaction = {
    id: string;
    date: string;
    party: string;
    type: "Sale" | "Purchase" | "Payment";
    item: string;
    amount: number;
    payment: string;
    billNumber?: number;
    debit?: number;
    credit?: number;
}

export type DailyAccountSummary = {
    date: string;
    openingBalance: number;
    totalExpenses: number;
    finalNote: string;
};
