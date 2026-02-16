import type { Product, Supplier, Customer, PaymentDetail } from './types';

export const products: Product[] = [
    { id: '1', itemCode: 'VEG001', name: 'Tomato', rate1: 30, rate2: 28, rate3: 25 },
    { id: '2', itemCode: 'VEG002', name: 'Onion', rate1: 40, rate2: 38, rate3: 35 },
    { id: '3', itemCode: 'VEG003', name: 'Potato', rate1: 25, rate2: 23, rate3: 20 },
    { id: '4', itemCode: 'VEG004', name: 'Carrot', rate1: 50, rate2: 48, rate3: 45 },
    { id: '5', itemCode: 'VEG005', name: 'Cabbage', rate1: 20, rate2: 18, rate3: 15 },
];

export const suppliers: Supplier[] = [
    { id: 'SUP001', name: 'Koyambedu Market', contact: '9876543210', address: 'Koyambedu, Chennai' },
    { id: 'SUP002', name: 'Ooty Farms', contact: '9876543211', address: 'Ooty, Tamil Nadu' },
    { id: 'SUP003', name: 'Local Farmers Co-op', contact: '9876543212', address: 'Tiruvallur, Tamil Nadu' },
];

export const customers: Customer[] = [
    { id: 'CUS001', name: 'Venkatesh', contact: '9123456780', address: 'T. Nagar, Chennai' },
    { id: 'CUS002', name: 'Suresh Kumar', contact: '9123456781', address: 'Anna Nagar, Chennai' },
    { id: 'CUS003', name: 'Anbu Retail', contact: '9123456782', address: 'Velachery, Chennai' },
    { id: 'CUS004', name: 'Kannan Stores', contact: '9123456783', address: 'Adyar, Chennai' },
];

export const supplierPaymentDetails: PaymentDetail[] = [
    { id: '1', partyId: 'SUP001', partyName: 'Koyambedu Market', totalAmount: 50000, paidAmount: 45000, dueAmount: 5000 },
    { id: '2', partyId: 'SUP002', partyName: 'Ooty Farms', totalAmount: 75000, paidAmount: 75000, dueAmount: 0 },
    { id: '3', partyId: 'SUP003', partyName: 'Local Farmers Co-op', totalAmount: 22000, paidAmount: 10000, dueAmount: 12000 },
];

export const customerPaymentDetails: PaymentDetail[] = [
    { id: '1', partyId: 'CUS001', partyName: 'Venkatesh', totalAmount: 1250, paidAmount: 1250, dueAmount: 0 },
    { id: '2', partyId: 'CUS003', partyName: 'Anbu Retail', totalAmount: 8400, paidAmount: 5000, dueAmount: 3400 },
    { id: '3', partyId: 'CUS004', partyName: 'Kannan Stores', totalAmount: 550, paidAmount: 550, dueAmount: 0 },
];
