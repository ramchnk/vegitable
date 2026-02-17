
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { collection, doc, addDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Transaction, PaymentDetail, Supplier, Customer, DailyAccountSummary } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

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
    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    updateSupplier: (supplier: Supplier) => void;
    customers: Customer[];
    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    updateCustomer: (customer: Customer) => void;
    dailySummaries: DailyAccountSummary[];
    saveDailySummary: (summary: DailyAccountSummary) => void;
    loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const { data: transactionsData, loading: transactionsLoading } = useCollection<Transaction>(
        firestore && user ? collection(firestore, 'transactions') : null
    );
    const { data: supplierPaymentsData, loading: supplierPaymentsLoading } = useCollection<PaymentDetail>(
        firestore && user ? collection(firestore, 'supplierPayments') : null
    );
    const { data: customerPaymentsData, loading: customerPaymentsLoading } = useCollection<PaymentDetail>(
        firestore && user ? collection(firestore, 'customerPayments') : null
    );
    const { data: suppliersData, loading: suppliersLoading } = useCollection<Supplier>(
        firestore && user ? collection(firestore, 'suppliers') : null
    );
    const { data: customersData, loading: customersLoading } = useCollection<Customer>(
        firestore && user ? collection(firestore, 'customers') : null
    );
    const { data: dailySummariesData, loading: dailySummariesLoading } = useCollection<DailyAccountSummary>(
        firestore && user ? collection(firestore, 'dailySummaries') : null
    );

    const transactions = transactionsData || [];
    const supplierPayments = supplierPaymentsData || [];
    const customerPayments = customerPaymentsData || [];
    const suppliers = suppliersData || [];
    const customers = customersData || [];
    const dailySummaries = dailySummariesData || [];
    
    const loading = transactionsLoading || supplierPaymentsLoading || customerPaymentsLoading || suppliersLoading || customersLoading || dailySummariesLoading;

    const addSupplier = (newSupplierData: Omit<Supplier, 'id'>) => {
        if (!firestore) return;

        if (suppliers.some(s => s.name.toLowerCase() === newSupplierData.name.toLowerCase())) {
            toast({ title: 'Error', description: 'Supplier with this name already exists.', variant: 'destructive'});
            return;
        }

        const newSupplierRef = doc(collection(firestore, 'suppliers'));
        const newSupplierId = newSupplierRef.id;
        const supplierWithId = { ...newSupplierData, id: newSupplierId };

        setDoc(newSupplierRef, supplierWithId)
          .then(() => {
            const paymentRef = doc(firestore, 'supplierPayments', newSupplierId);
            const newPayment: Omit<PaymentDetail, 'id'> = {
                partyId: newSupplierId,
                partyName: newSupplierData.name,
                totalAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
                paymentMethod: 'Credit',
            };
            setDoc(paymentRef, newPayment).catch(e => {
                const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'create', requestResourceData: newPayment });
                errorEmitter.emit('permission-error', permissionError);
            });
          })
          .catch(e => {
              const permissionError = new FirestorePermissionError({ path: newSupplierRef.path, operation: 'create', requestResourceData: newSupplierData });
              errorEmitter.emit('permission-error', permissionError);
          });
    };

    const addCustomer = (newCustomerData: Omit<Customer, 'id'>) => {
        if (!firestore) return;

        if (customers.some(c => c.name.toLowerCase() === newCustomerData.name.toLowerCase())) {
            toast({ title: 'Error', description: 'Customer with this name already exists.', variant: 'destructive'});
            return;
        }

        const newCustomerRef = doc(collection(firestore, 'customers'));
        const newCustomerId = newCustomerRef.id;
        const customerWithId = { ...newCustomerData, id: newCustomerId };

        setDoc(newCustomerRef, customerWithId)
            .then(() => {
                const paymentRef = doc(firestore, 'customerPayments', newCustomerId);
                const newPayment: Omit<PaymentDetail, 'id'> = {
                    partyId: newCustomerId,
                    partyName: newCustomerData.name,
                    totalAmount: 0,
                    paidAmount: 0,
                    dueAmount: 0,
                    paymentMethod: 'Credit',
                };
                setDoc(paymentRef, newPayment).catch(e => {
                    const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'create', requestResourceData: newPayment });
                    errorEmitter.emit('permission-error', permissionError);
                });
            })
            .catch(e => {
                const permissionError = new FirestorePermissionError({ path: newCustomerRef.path, operation: 'create', requestResourceData: newCustomerData });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const addTransaction = (
        newTransactions: Omit<Transaction, 'id'>[],
        partyDetails: { name: string; contact: string; address: string },
        amountPaidOverride?: number
    ) => {
        if (!firestore || newTransactions.length === 0) return;

        const batch = writeBatch(firestore);

        newTransactions.forEach(t => {
            const transRef = doc(collection(firestore, 'transactions'));
            batch.set(transRef, t);
        });

        const totalAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
        const transactionType = newTransactions[0].type;
        const paymentMethod = newTransactions[0].payment;
        const partyName = partyDetails.name;

        if (transactionType === 'Sale') {
            let customer = customers.find(c => c.name.toLowerCase() === partyName.toLowerCase());
            let customerId: string;

            if (!customer) {
                const newCustomerRef = doc(collection(firestore, 'customers'));
                customerId = newCustomerRef.id;
                batch.set(newCustomerRef, { ...partyDetails, id: customerId });
            } else {
                customerId = customer.id;
            }

            const paymentRef = doc(firestore, 'customerPayments', customerId);
            const existingPayment = customerPayments.find(p => p.partyId === customerId);
            const amountPaid = amountPaidOverride !== undefined ? amountPaidOverride : (paymentMethod !== 'Credit' ? totalAmount : 0);

            if (existingPayment) {
                const newTotalAmount = existingPayment.totalAmount + totalAmount;
                const newPaidAmount = existingPayment.paidAmount + amountPaid;
                batch.update(paymentRef, {
                    totalAmount: newTotalAmount,
                    paidAmount: newPaidAmount,
                    dueAmount: newTotalAmount - newPaidAmount,
                    paymentMethod: paymentMethod,
                });
            } else {
                const dueAmount = totalAmount - amountPaid;
                const newPaymentId = (Math.max(0, ...customerPayments.map(p => parseInt(p.id) || 0)) + 1).toString();
                batch.set(paymentRef, {
                    id: newPaymentId,
                    partyId: customerId,
                    partyName: partyDetails.name,
                    totalAmount: totalAmount,
                    paidAmount: amountPaid,
                    dueAmount: dueAmount,
                    paymentMethod: paymentMethod,
                });
            }
        } else { // Purchase
            let supplier = suppliers.find(s => s.name.toLowerCase() === partyName.toLowerCase());
            let supplierId: string;
    
            if (!supplier) {
                const newSupplierRef = doc(collection(firestore, 'suppliers'));
                supplierId = newSupplierRef.id;
                batch.set(newSupplierRef, { ...partyDetails, id: supplierId });
            } else {
                supplierId = supplier.id;
            }
    
            const paymentRef = doc(firestore, 'supplierPayments', supplierId);
            const existingPayment = supplierPayments.find(p => p.partyId === supplierId);
            const amountPaid = amountPaidOverride !== undefined ? amountPaidOverride : (paymentMethod !== 'Credit' ? totalAmount : 0);

            if (existingPayment) {
                const newTotalAmount = existingPayment.totalAmount + totalAmount;
                const newPaidAmount = existingPayment.paidAmount + amountPaid;
                batch.update(paymentRef, {
                    totalAmount: newTotalAmount,
                    paidAmount: newPaidAmount,
                    dueAmount: newTotalAmount - newPaidAmount,
                    paymentMethod: paymentMethod,
                });
            } else {
                const dueAmount = totalAmount - amountPaid;
                const newPaymentId = (Math.max(0, ...supplierPayments.map(p => parseInt(p.id) || 0)) + 1).toString();
                batch.set(paymentRef, {
                    id: newPaymentId,
                    partyId: supplierId,
                    partyName: partyDetails.name,
                    totalAmount: totalAmount,
                    paidAmount: amountPaid,
                    dueAmount: dueAmount,
                    paymentMethod: paymentMethod,
                });
            }
        }

        batch.commit().catch(e => {
            const permissionError = new FirestorePermissionError({ path: 'batch-write', operation: 'write' });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const updateSupplierPayment = (updatedPayment: PaymentDetail) => {
        if (!firestore) return;
        const paymentRef = doc(firestore, 'supplierPayments', updatedPayment.partyId);
        updateDoc(paymentRef, updatedPayment as any).catch(e => {
             const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'update', requestResourceData: updatedPayment });
             errorEmitter.emit('permission-error', permissionError);
        });
    }

    const updateCustomerPayment = (updatedPayment: PaymentDetail) => {
        if (!firestore) return;
        const paymentRef = doc(firestore, 'customerPayments', updatedPayment.partyId);
        updateDoc(paymentRef, updatedPayment as any).catch(e => {
            const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'update', requestResourceData: updatedPayment });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const updateSupplier = (updatedSupplier: Supplier) => {
        if (!firestore) return;
        const supplierRef = doc(firestore, 'suppliers', updatedSupplier.id);
        updateDoc(supplierRef, updatedSupplier as any).catch(e => {
            const permissionError = new FirestorePermissionError({ path: supplierRef.path, operation: 'update', requestResourceData: updatedSupplier });
            errorEmitter.emit('permission-error', permissionError);
        });
        const paymentRef = doc(firestore, 'supplierPayments', updatedSupplier.id);
        updateDoc(paymentRef, { partyName: updatedSupplier.name }).catch(e => {
            const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'update', requestResourceData: { partyName: updatedSupplier.name } });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const updateCustomer = (updatedCustomer: Customer) => {
        if (!firestore) return;
        const customerRef = doc(firestore, 'customers', updatedCustomer.id);
        updateDoc(customerRef, updatedCustomer as any).catch(e => {
            const permissionError = new FirestorePermissionError({ path: customerRef.path, operation: 'update', requestResourceData: updatedCustomer });
            errorEmitter.emit('permission-error', permissionError);
        });
        const paymentRef = doc(firestore, 'customerPayments', updatedCustomer.id);
        updateDoc(paymentRef, { partyName: updatedCustomer.name }).catch(e => {
            const permissionError = new FirestorePermissionError({ path: paymentRef.path, operation: 'update', requestResourceData: { partyName: updatedCustomer.name } });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const saveDailySummary = (summary: DailyAccountSummary) => {
        if (!firestore) return;
        const summaryRef = doc(firestore, "dailySummaries", summary.date);
        setDoc(summaryRef, summary, { merge: true }).catch(e => {
            const permissionError = new FirestorePermissionError({ path: summaryRef.path, operation: 'update', requestResourceData: summary });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const value: TransactionContextType = { transactions, addTransaction, supplierPayments, customerPayments, updateSupplierPayment, updateCustomerPayment, suppliers, addSupplier, updateSupplier, customers, addCustomer, updateCustomer, dailySummaries, saveDailySummary, loading };

    return (
        <TransactionContext.Provider value={value}>
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
