
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { Transaction, PaymentDetail, Supplier, Customer } from '@/lib/types';
import { initialTransactions } from '@/lib/transactions';
import { 
    initialSupplierPaymentDetails, 
    initialCustomerPaymentDetails,
    suppliers as initialSuppliers,
    customers as initialCustomers
} from '@/lib/data';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (
        transactions: Omit<Transaction, 'id'>[],
        partyDetails: { name: string; contact: string; address: string },
        amountPaidOverride?: number
    ) => void;
    supplierPayments: PaymentDetail[];
    customerPayments: PaymentDetail[];
    updateSupplierPayment: (payment: PaymentDetail) => void;
    updateCustomerPayment: (payment: PaymentDetail) => void;
    suppliers: Supplier[];
    updateSupplier: (supplier: Supplier) => void;
    customers: Customer[];
    updateCustomer: (customer: Customer) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [supplierPayments, setSupplierPayments] = useState<PaymentDetail[]>(initialSupplierPaymentDetails);
    const [customerPayments, setCustomerPayments] = useState<PaymentDetail[]>(initialCustomerPaymentDetails);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

     useEffect(() => {
        try {
            const storedTransactions = window.localStorage.getItem('transactions');
            if (storedTransactions) setTransactions(JSON.parse(storedTransactions));

            const storedSupplierPayments = window.localStorage.getItem('supplierPayments');
            if (storedSupplierPayments) setSupplierPayments(JSON.parse(storedSupplierPayments));

            const storedCustomerPayments = window.localStorage.getItem('customerPayments');
            if (storedCustomerPayments) setCustomerPayments(JSON.parse(storedCustomerPayments));

            const storedSuppliers = window.localStorage.getItem('suppliers');
            if(storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));

            const storedCustomers = window.localStorage.getItem('customers');
            if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        } catch (error) {
            console.error("Failed to load from localStorage", error);
        }
    }, []);


    useEffect(() => {
        try {
            window.localStorage.setItem('transactions', JSON.stringify(transactions));
        } catch (error) {
            console.error('Error writing to localStorage for key "transactions":', error);
        }
    }, [transactions]);

    useEffect(() => {
        try {
            window.localStorage.setItem('supplierPayments', JSON.stringify(supplierPayments));
        } catch (error) {
            console.error('Error writing to localStorage for key "supplierPayments":', error);
        }
    }, [supplierPayments]);

    useEffect(() => {
        try {
            window.localStorage.setItem('customerPayments', JSON.stringify(customerPayments));
        } catch (error) {
            console.error('Error writing to localStorage for key "customerPayments":', error);
        }
    }, [customerPayments]);

    useEffect(() => {
        try {
            window.localStorage.setItem('suppliers', JSON.stringify(suppliers));
        } catch (error) {
            console.error('Error writing to localStorage for key "suppliers":', error);
        }
    }, [suppliers]);

    useEffect(() => {
        try {
            window.localStorage.setItem('customers', JSON.stringify(customers));
        } catch (error) {
            console.error('Error writing to localStorage for key "customers":', error);
        }
    }, [customers]);


    const addTransaction = (
        newTransactions: Omit<Transaction, 'id'>[],
        partyDetails: { name: string; contact: string; address: string },
        amountPaidOverride?: number
    ) => {
        setTransactions(prev => {
            const newId = (prev.length > 0 ? Math.max(...prev.map(t => t.id)) : 0) + 1;
            const newTrans = [
                ...prev, 
                ...newTransactions.map((t, i) => ({...t, id: newId + i}))
            ];
            return newTrans;
        });

        if (newTransactions.length === 0) return;

        const totalAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
        const transactionType = newTransactions[0].type;
        const paymentMethod = newTransactions[0].payment;
        const partyName = partyDetails.name;

        if (transactionType === 'Sale') {
            let customer = customers.find(c => c.name.toLowerCase() === partyName.toLowerCase());
            if (!customer) {
                const newCustomerId = `CUS${(customers.length + 1).toString().padStart(3, '0')}`;
                customer = {
                    id: newCustomerId,
                    name: partyDetails.name,
                    contact: partyDetails.contact,
                    address: partyDetails.address
                };
                setCustomers(prev => [...prev, customer!]);
            }
    
            setCustomerPayments(prev => {
                const updatedPayments = [...prev];
                const existingPaymentIndex = updatedPayments.findIndex(p => p.partyId === customer!.id);
                 const amountPaid = amountPaidOverride !== undefined 
                    ? amountPaidOverride 
                    : (paymentMethod !== 'Credit' ? totalAmount : 0);
                
                if (existingPaymentIndex > -1) {
                    const existingPayment = updatedPayments[existingPaymentIndex];
                    existingPayment.totalAmount += totalAmount;
                    existingPayment.paidAmount += amountPaid;
                    existingPayment.dueAmount = existingPayment.totalAmount - existingPayment.paidAmount;
                    existingPayment.paymentMethod = paymentMethod;
    
                    return updatedPayments;
                } else {
                    const newPaymentId = (Math.max(0, ...prev.map(p => parseInt(p.id) || 0)) + 1).toString();
                    const newPayment = {
                        id: newPaymentId,
                        partyId: customer!.id,
                        partyName: customer!.name,
                        totalAmount: totalAmount,
                        paidAmount: amountPaid,
                        dueAmount: totalAmount - amountPaid,
                        paymentMethod: paymentMethod,
                    };
                    return [...prev, newPayment];
                }
            });
        } else { // Purchase
            let supplier = suppliers.find(s => s.name.toLowerCase() === partyName.toLowerCase());
            if (!supplier) {
                const newSupplierId = `SUP${(suppliers.length + 1).toString().padStart(3, '0')}`;
                supplier = {
                    id: newSupplierId,
                    name: partyDetails.name,
                    contact: partyDetails.contact,
                    address: partyDetails.address,
                };
                setSuppliers(prev => [...prev, supplier!]);
            }
    
            setSupplierPayments(prev => {
                const updatedPayments = [...prev];
                const existingPaymentIndex = updatedPayments.findIndex(p => p.partyId === supplier!.id);
                const amountPaid = amountPaidOverride !== undefined
                    ? amountPaidOverride
                    : (paymentMethod !== 'Credit' ? totalAmount : 0);

                if (existingPaymentIndex > -1) {
                    const existingPayment = updatedPayments[existingPaymentIndex];
                    existingPayment.totalAmount += totalAmount;
                    existingPayment.paidAmount += amountPaid;
                    existingPayment.dueAmount = existingPayment.totalAmount - existingPayment.paidAmount;
                    existingPayment.paymentMethod = paymentMethod;
    
                    return updatedPayments;
                } else {
                    const newPaymentId = (Math.max(0, ...prev.map(p => parseInt(p.id) || 0)) + 1).toString();
                     const newPayment: PaymentDetail = {
                        id: newPaymentId,
                        partyId: supplier!.id,
                        partyName: supplier!.name,
                        totalAmount: totalAmount,
                        paidAmount: amountPaid,
                        dueAmount: totalAmount - amountPaid,
                        paymentMethod: paymentMethod,
                    };
                    return [...prev, newPayment];
                }
            });
        }
    };

    const updateSupplierPayment = (updatedPayment: PaymentDetail) => {
        setSupplierPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    }

    const updateCustomerPayment = (updatedPayment: PaymentDetail) => {
        setCustomerPayments(prev => prev.map(c => c.id === updatedPayment.id ? updatedPayment : c));
    }

    const updateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
        setSupplierPayments(prev => prev.map(p => p.partyId === updatedSupplier.id ? {...p, partyName: updatedSupplier.name} : p));
    }

    const updateCustomer = (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setCustomerPayments(prev => prev.map(p => p.partyId === updatedCustomer.id ? {...p, partyName: updatedCustomer.name} : p));
    }


    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, supplierPayments, customerPayments, updateSupplierPayment, updateCustomerPayment, suppliers, updateSupplier, customers, updateCustomer }}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
}
