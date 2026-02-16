export type Product = {
    id: string;
    itemCode: string;
    name: string;
    rate1: number;
    rate2: number;
    rate3: number;
};

export type Supplier = {
    id: string;
    name: string;
    contact: string;
    address: string;
};

export type Customer = {
    id: string;
    name: string;
    contact: string;
    address: string;
};

export type Purchase = {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string;
    itemName: string;
    price: number;
    quantity: number;
    paymentMethod: 'Cash' | 'UPI/Digital' | 'Credit';
    totalAmount: number;
};

export type Sale = {
    id: string;
    date: string;
    customerId: string;
    customerName: string;
    itemName: string;
    price: number;
    quantity: number;
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
}
