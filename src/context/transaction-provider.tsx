
"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Transaction, PaymentDetail, Supplier, Customer, DailyAccountSummary, Product } from '@/lib/types';
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
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplier: Supplier) => void;
    customers: Customer[];
    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (customer: Customer) => void;
    dailySummaries: DailyAccountSummary[];
    saveDailySummary: (summary: DailyAccountSummary) => void;
    addPayment: (
        partyId: string,
        partyName: string,
        partyType: "Supplier" | "Customer",
        amount: number,
        paymentMethod?: string
    ) => Promise<void>;
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const transactionsRef = useMemo(() => firestore && user ? collection(firestore, 'transactions') : null, [firestore, user]);
    const { data: transactionsData, loading: transactionsLoading } = useCollection<Transaction>(transactionsRef);

    const supplierPaymentsRef = useMemo(() => firestore && user ? collection(firestore, 'supplierPayments') : null, [firestore, user]);
    const { data: supplierPaymentsData, loading: supplierPaymentsLoading } = useCollection<PaymentDetail>(supplierPaymentsRef);

    const customerPaymentsRef = useMemo(() => firestore && user ? collection(firestore, 'customerPayments') : null, [firestore, user]);
    const { data: customerPaymentsData, loading: customerPaymentsLoading } = useCollection<PaymentDetail>(customerPaymentsRef);

    const suppliersRef = useMemo(() => firestore && user ? collection(firestore, 'suppliers') : null, [firestore, user]);
    const { data: suppliersData, loading: suppliersLoading } = useCollection<Supplier>(suppliersRef);

    const customersRef = useMemo(() => firestore && user ? collection(firestore, 'customers') : null, [firestore, user]);
    const { data: customersData, loading: customersLoading } = useCollection<Customer>(customersRef);

    const dailySummariesRef = useMemo(() => firestore && user ? collection(firestore, 'dailySummaries') : null, [firestore, user]);
    const { data: dailySummariesData, loading: dailySummariesLoading } = useCollection<DailyAccountSummary>(dailySummariesRef);

    const productsRef = useMemo(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]);
    const { data: productsData, loading: productsLoading } = useCollection<Product>(productsRef);

    const transactions = transactionsData || [];
    const supplierPayments = supplierPaymentsData || [];
    const customerPayments = customerPaymentsData || [];
    const suppliers = suppliersData || [];
    const customers = customersData || [];
    const dailySummaries = dailySummariesData || [];
    const products = productsData || [];

    const loading = transactionsLoading || supplierPaymentsLoading || customerPaymentsLoading || suppliersLoading || customersLoading || dailySummariesLoading || productsLoading;

    const addSupplier = async (newSupplierData: Omit<Supplier, 'id'>) => {
        if (!firestore) {
            const error = new Error("Firestore not initialized");
            console.error(error);
            throw error;
        }

        if (!user) {
            const error = new Error("User not authenticated");
            console.error(error);
            throw error;
        }

        if (suppliers.some(s => s.name.toLowerCase() === newSupplierData.name.toLowerCase())) {
            toast({ title: 'Error', description: 'Supplier with this name already exists.', variant: 'destructive' });
            return;
        }

        if (newSupplierData.code && suppliers.some(s => s.code === newSupplierData.code)) {
            toast({ title: 'Error', description: 'Supplier with this code already exists.', variant: 'destructive' });
            return;
        }

        const newSupplierRef = doc(collection(firestore, 'suppliers'));
        const newSupplierId = newSupplierRef.id;
        const supplierWithId = { ...newSupplierData, id: newSupplierId, code: newSupplierData.code || '' };

        try {
            await setDoc(newSupplierRef, supplierWithId);

            const paymentRef = doc(firestore, 'supplierPayments', newSupplierId);
            const newPayment: PaymentDetail = {
                id: newSupplierId,
                partyId: newSupplierId,
                partyName: newSupplierData.name,
                totalAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
                paymentMethod: 'Credit',
            };
            await setDoc(paymentRef, newPayment);

            toast({ title: 'Success', description: 'Supplier added successfully.' });

        } catch (e: any) {
            console.error("Error adding supplier:", e);
            console.error("User authenticated:", !!user);
            console.error("Firestore initialized:", !!firestore);
            const permissionError = new FirestorePermissionError({ path: newSupplierRef.path, operation: 'create', requestResourceData: newSupplierData });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    };

    const addCustomer = async (newCustomerData: Omit<Customer, 'id'>) => {
        if (!firestore) {
            const error = new Error("Firestore not initialized");
            console.error(error);
            throw error;
        }

        if (!user) {
            const error = new Error("User not authenticated");
            console.error(error);
            throw error;
        }

        if (customers.some(c => c.name.toLowerCase() === newCustomerData.name.toLowerCase())) {
            toast({ title: 'Error', description: 'Customer with this name already exists.', variant: 'destructive' });
            return;
        }

        if (newCustomerData.code && customers.some(c => c.code === newCustomerData.code)) {
            toast({ title: 'Error', description: 'Customer with this code already exists.', variant: 'destructive' });
            return;
        }

        const newCustomerRef = doc(collection(firestore, 'customers'));
        const newCustomerId = newCustomerRef.id;
        const customerWithId = { ...newCustomerData, id: newCustomerId };

        try {
            await setDoc(newCustomerRef, customerWithId);

            const paymentRef = doc(firestore, 'customerPayments', newCustomerId);
            const newPayment: PaymentDetail = {
                id: newCustomerId,
                partyId: newCustomerId,
                partyName: newCustomerData.name,
                totalAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
                paymentMethod: 'Credit',
            };
            await setDoc(paymentRef, newPayment);
            toast({ title: 'Success', description: 'Customer added successfully.' });

        } catch (e: any) {
            console.error("Error adding customer:", e);
            console.error("User authenticated:", !!user);
            console.error("Firestore initialized:", !!firestore);
            const permissionError = new FirestorePermissionError({ path: newCustomerRef.path, operation: 'create', requestResourceData: newCustomerData });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    };

    const addTransaction = (
        newTransactions: Omit<Transaction, 'id'>[],
        partyDetails: { name: string; contact: string; address: string },
        amountPaidOverride?: number
    ) => {
        if (!firestore || newTransactions.length === 0) return;

        const batch = writeBatch(firestore);

        // Calculate next bill number
        const maxBillNumber = transactions.reduce((max, t) => {
            return (t.billNumber || 0) > max ? (t.billNumber || 0) : max;
        }, 0);
        const nextBillNumber = maxBillNumber + 1;

        newTransactions.forEach(t => {
            const transRef = doc(collection(firestore, 'transactions'));
            batch.set(transRef, { ...t, billNumber: nextBillNumber });
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
                batch.set(paymentRef, {
                    id: customerId,
                    partyId: customerId,
                    partyName: partyDetails.name,
                    totalAmount: totalAmount,
                    paidAmount: amountPaid,
                    dueAmount: dueAmount,
                    paymentMethod: paymentMethod,
                });
            }

            // Create a Payment transaction record if amount was paid
            if (amountPaid > 0) {
                const paymentTransRef = doc(collection(firestore, 'transactions'));
                batch.set(paymentTransRef, {
                    id: paymentTransRef.id,
                    date: newTransactions[0].date,
                    party: partyName,
                    type: "Payment",
                    item: "Partial/Full Payment during Sale",
                    amount: amountPaid,
                    payment: paymentMethod,
                    debit: amountPaid,
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
                batch.set(paymentRef, {
                    id: supplierId,
                    partyId: supplierId,
                    partyName: partyDetails.name,
                    totalAmount: totalAmount,
                    paidAmount: amountPaid,
                    dueAmount: dueAmount,
                    paymentMethod: paymentMethod,
                });
            }

            // Create a Payment transaction record if amount was paid
            if (amountPaid > 0) {
                const paymentTransRef = doc(collection(firestore, 'transactions'));
                batch.set(paymentTransRef, {
                    id: paymentTransRef.id,
                    date: newTransactions[0].date,
                    party: partyName,
                    type: "Payment",
                    item: "Partial/Full Payment during Purchase",
                    amount: amountPaid,
                    payment: paymentMethod,
                    credit: amountPaid,
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

    const updateSupplier = async (updatedSupplier: Supplier) => {
        if (!firestore) return;

        // Check for duplicate code if code is changed
        if (updatedSupplier.code) {
            const existingCodeSupplier = suppliers.find(s => s.code === updatedSupplier.code && s.id !== updatedSupplier.id);
            if (existingCodeSupplier) {
                toast({ title: 'Error', description: 'Supplier with this code already exists.', variant: 'destructive' });
                return;
            }
        }

        const supplierRef = doc(firestore, 'suppliers', updatedSupplier.id);
        try {
            await updateDoc(supplierRef, updatedSupplier as any);
            toast({ title: 'Success', description: 'Supplier updated successfully.' });
        } catch (e) {
            console.error("Error updating supplier:", e);
            toast({ title: 'Error', description: 'Failed to update supplier.', variant: 'destructive' });
            const permissionError = new FirestorePermissionError({ path: supplierRef.path, operation: 'update', requestResourceData: updatedSupplier });
            errorEmitter.emit('permission-error', permissionError);
        }

        const paymentRef = doc(firestore, 'supplierPayments', updatedSupplier.id);
        updateDoc(paymentRef, { partyName: updatedSupplier.name, code: updatedSupplier.code || '' }).catch(e => {
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

    const deleteCustomer = async (customerId: string) => {
        if (!firestore) return;
        const customerRef = doc(firestore, 'customers', customerId);
        const paymentRef = doc(firestore, 'customerPayments', customerId);

        try {
            await deleteDoc(customerRef);
            await deleteDoc(paymentRef);
            toast({ title: 'Success', description: 'Customer deleted successfully.' });
        } catch (e: any) {
            console.error("Error deleting customer:", e);
            const permissionError = new FirestorePermissionError({ path: customerRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    }

    const saveDailySummary = (summary: DailyAccountSummary) => {
        if (!firestore) return;
        const summaryRef = doc(firestore, "dailySummaries", summary.date);
        setDoc(summaryRef, summary, { merge: true }).catch(e => {
            const permissionError = new FirestorePermissionError({ path: summaryRef.path, operation: 'update', requestResourceData: summary });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const addPayment = async (
        partyId: string,
        partyName: string,
        partyType: "Supplier" | "Customer",
        amount: number,
        paymentMethod: string = "Cash"
    ) => {
        if (!firestore || !user) return;

        const batch = writeBatch(firestore);
        const timestamp = new Date().toISOString();

        // 1. Create Transaction Record
        const transRef = doc(collection(firestore, 'transactions'));
        const transaction: Transaction = {
            id: transRef.id,
            date: timestamp,
            party: partyName,
            type: "Payment",
            item: "Payment Received/Given",
            amount: amount,
            payment: paymentMethod,
            credit: partyType === "Supplier" ? amount : 0, // Supplier payment is credit (reducing our debt)
            debit: partyType === "Customer" ? amount : 0,  // Customer payment is debit (reducing their debt)
        };
        batch.set(transRef, transaction);

        // 2. Update Payment Summary
        const collectionName = partyType === "Supplier" ? "supplierPayments" : "customerPayments";
        const paymentRef = doc(firestore, collectionName, partyId);

        // Find existing payment detail to update
        const existingPayment = (partyType === "Supplier" ? supplierPayments : customerPayments).find(p => p.partyId === partyId);

        if (existingPayment) {
            batch.update(paymentRef, {
                paidAmount: existingPayment.paidAmount + amount,
                dueAmount: existingPayment.dueAmount - amount,
                paymentMethod: paymentMethod
            });
        }

        try {
            await batch.commit();
            toast({ title: 'Success', description: 'Payment recorded successfully.' });
        } catch (e) {
            console.error("Error adding payment:", e);
            toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' });
            const permissionError = new FirestorePermissionError({ path: 'batch-write', operation: 'write' });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const addProduct = async (newProductData: Omit<Product, 'id'>) => {
        if (!firestore) {
            const error = new Error("Firestore not initialized");
            console.error(error);
            throw error;
        }

        if (!user) {
            const error = new Error("User not authenticated");
            console.error(error);
            throw error;
        }

        const newProductRef = doc(collection(firestore, 'products'));
        const newProductId = newProductRef.id;
        const productWithId = { ...newProductData, id: newProductId };

        try {
            await setDoc(newProductRef, productWithId);
            toast({ title: 'Success', description: 'Product added successfully.' });
        } catch (e: any) {
            console.error("Error adding product:", e);
            const permissionError = new FirestorePermissionError({ path: newProductRef.path, operation: 'create', requestResourceData: newProductData });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    }

    const updateProduct = (updatedProduct: Product) => {
        if (!firestore) return;
        const productRef = doc(firestore, 'products', updatedProduct.id);
        updateDoc(productRef, updatedProduct as any).catch(e => {
            const permissionError = new FirestorePermissionError({ path: productRef.path, operation: 'update', requestResourceData: updatedProduct });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const deleteProduct = async (productId: string) => {
        if (!firestore) return;
        const productRef = doc(firestore, 'products', productId);
        try {
            await deleteDoc(productRef);
            toast({ title: 'Success', description: 'Product deleted successfully.' });
        } catch (e: any) {
            console.error("Error deleting product:", e);
            const permissionError = new FirestorePermissionError({ path: productRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    }

    const value: TransactionContextType = { transactions, addTransaction, supplierPayments, customerPayments, updateSupplierPayment, updateCustomerPayment, suppliers, addSupplier, updateSupplier, customers, addCustomer, updateCustomer, deleteCustomer, dailySummaries, saveDailySummary, addPayment, products, addProduct, updateProduct, deleteProduct, loading };

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
