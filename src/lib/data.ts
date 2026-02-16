import type { Product, Supplier, Customer, PaymentDetail } from './types';

export const products: Product[] = [
    { id: '1', itemCode: 'VEG001', name: 'Tomato', rate1: 30, rate2: 28, rate3: 25 },
    { id: '2', itemCode: 'VEG002', name: 'Onion', rate1: 40, rate2: 38, rate3: 35 },
    { id: '3', itemCode: 'VEG003', name: 'Potato', rate1: 25, rate2: 23, rate3: 20 },
    { id: '4', itemCode: 'VEG004', name: 'Carrot', rate1: 50, rate2: 48, rate3: 45 },
    { id: '5', itemCode: 'VEG005', name: 'Cabbage', rate1: 20, rate2: 18, rate3: 15 },
];

export const suppliers: Supplier[] = [
    { id: 'SUP001', name: 'Hari', contact: '9876543210', address: 'Koyambedu, Chennai' },
    { id: 'SUP002', name: 'Asif', contact: '9876543211', address: 'Ooty, Tamil Nadu' },
    { id: 'SUP003', name: 'Ram', contact: '9876543212', address: 'Tiruvallur, Tamil Nadu' },
    { id: 'SUP004', name: 'Vijay', contact: '9876543213', address: 'Madurai, Tamil Nadu' },
    { id: 'SUP005', name: 'Ajith', contact: '9876543214', address: 'Coimbatore, Tamil Nadu' },
    { id: 'SUP006', name: 'Surya', contact: '9876543215', address: 'Salem, Tamil Nadu' },
    { id: 'SUP007', name: 'Ajith kumar', contact: '9876543216', address: 'Erode, Tamil Nadu' },
    { id: 'SUP008', name: 'Vishnu', contact: '9876543217', address: 'Tiruppur, Tamil Nadu' },
    { id: 'SUP009', name: 'Rajini', contact: '9876543218', address: 'Vellore, Tamil Nadu' },
    { id: 'SUP010', name: 'Ktms', contact: '9876543219', address: 'Thanjavur, Tamil Nadu' },
    { id: 'SUP011', name: 'Reddy', contact: '9876543220', address: 'Dindigul, Tamil Nadu' },
    { id: 'SUP012', name: 'Kv', contact: '9876543221', address: 'Cuddalore, Tamil Nadu' },
    { id: 'SUP013', name: 'Sst', contact: '9876543222', address: 'Kanchipuram, Tamil Nadu' },
    { id: 'SUP014', name: 'Ss', contact: '9876543223', address: 'Tirunelveli, Tamil Nadu' },
];

export const customers: Customer[] = [
    { id: 'CUS001', name: 'Venkatesh', contact: '9123456780', address: 'T. Nagar, Chennai' },
    { id: 'CUS002', name: 'Suresh Kumar', contact: '9123456781', address: 'Anna Nagar, Chennai' },
    { id: 'CUS003', name: 'Anbu Retail', contact: '9123456782', address: 'Velachery, Chennai' },
    { id: 'CUS004', name: 'Kannan Stores', contact: '9123456783', address: 'Adyar, Chennai' },
];

export const initialSupplierPaymentDetails: PaymentDetail[] = [
    { id: '1', partyId: 'SUP001', partyName: 'Hari', totalAmount: 1000, paidAmount: 50330, dueAmount: -49330, paymentMethod: 'Credit' },
    { id: '2', partyId: 'SUP002', partyName: 'Asif', totalAmount: 30000, paidAmount: 10386, dueAmount: 19614, paymentMethod: 'Credit' },
    { id: '3', partyId: 'SUP003', partyName: 'Ram', totalAmount: 10000, paidAmount: 4559, dueAmount: 5441, paymentMethod: 'Credit' },
    { id: '4', partyId: 'SUP004', partyName: 'Vijay', totalAmount: 5000, paidAmount: 3365, dueAmount: 1635, paymentMethod: 'Credit' },
    { id: '5', partyId: 'SUP005', partyName: 'Ajith', totalAmount: 1000, paidAmount: 922, dueAmount: 78, paymentMethod: 'Credit' },
    { id: '6', partyId: 'SUP006', partyName: 'Surya', totalAmount: 500, paidAmount: 408, dueAmount: 92, paymentMethod: 'Credit' },
    { id: '7', partyId: 'SUP007', partyName: 'Ajith kumar', totalAmount: 2000, paidAmount: 685, dueAmount: 1315, paymentMethod: 'Credit' },
    { id: '8', partyId: 'SUP008', partyName: 'Vishnu', totalAmount: 40000, paidAmount: 5570, dueAmount: 34430, paymentMethod: 'Credit' },
    { id: '9', partyId: 'SUP009', partyName: 'Rajini', totalAmount: 5000, paidAmount: 1905, dueAmount: 3095, paymentMethod: 'Credit' },
    { id: '10', partyId: 'SUP010', partyName: 'Ktms', totalAmount: 1000, paidAmount: 335, dueAmount: 665, paymentMethod: 'Credit' },
    { id: '11', partyId: 'SUP011', partyName: 'Reddy', totalAmount: 1000, paidAmount: 460, dueAmount: 540, paymentMethod: 'Credit' },
    { id: '12', partyId: 'SUP012', partyName: 'Kv', totalAmount: 500, paidAmount: 280, dueAmount: 220, paymentMethod: 'Credit' },
    { id: '13', partyId: 'SUP013', partyName: 'Sst', totalAmount: 1000, paidAmount: 164, dueAmount: 836, paymentMethod: 'Credit' },
    { id: '14', partyId: 'SUP014', partyName: 'Ss', totalAmount: 5000, paidAmount: 1650, dueAmount: 3350, paymentMethod: 'Credit' },
];

export const initialCustomerPaymentDetails: PaymentDetail[] = [
    { id: '1', partyId: 'CUS001', partyName: 'Venkatesh', totalAmount: 1250, paidAmount: 1250, dueAmount: 0, paymentMethod: 'UPI/Digital' },
    { id: '2', partyId: 'CUS003', partyName: 'Anbu Retail', totalAmount: 8400, paidAmount: 5000, dueAmount: 3400, paymentMethod: 'Credit' },
    { id: '3', partyId: 'CUS004', partyName: 'Kannan Stores', totalAmount: 550, paidAmount: 550, dueAmount: 0, paymentMethod: 'Cash' },
];
