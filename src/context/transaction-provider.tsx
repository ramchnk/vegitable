
"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { format } from 'date-fns';
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
    addCustomer: (customer: Omit<Customer, 'id'>, silent?: boolean) => Promise<void>;
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
    deleteProduct: (id: string, silent?: boolean) => Promise<void>;
    deleteCustomer: (id: string, silent?: boolean) => Promise<void>;
    deleteSupplier: (id: string, silent?: boolean) => Promise<void>;
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

    const transactions = useMemo(() => {
        if (!transactionsData) return [];
        return [...transactionsData].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            // Within the same day, try sorting by billNumber descending
            if (a.billNumber !== b.billNumber) return (b.billNumber || 0) - (a.billNumber || 0);
            // If billNumbers are same (e.g. multiple items in same bill), try createdAt
            if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
            return 0;
        });
    }, [transactionsData]);
    const supplierPayments = useMemo(() => {
        if (!supplierPaymentsData) return [];
        return supplierPaymentsData.map(p => {
            const supplier = (suppliersData || []).find(s => s.id === p.partyId);
            return { ...p, code: supplier?.code };
        });
    }, [supplierPaymentsData, suppliersData]);
    const customerPayments = useMemo(() => {
        if (!customerPaymentsData) return [];
        return customerPaymentsData.map(p => {
            const customer = (customersData || []).find(c => c.id === p.partyId);
            const base = { ...p, code: customer?.code };
            if (customer?.code === "000") {
                return { ...base, dueAmount: 0 };
            }
            return base;
        });
    }, [customerPaymentsData, customersData]);
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

    const addCustomer = async (newCustomerData: Omit<Customer, 'id'>, silent: boolean = false) => {
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
            if (!silent) {
                toast({ title: 'Success', description: 'Customer added successfully.' });
            }

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
    ): Promise<number | void> => {
        if (!firestore || newTransactions.length === 0) return Promise.resolve();

        const batch = writeBatch(firestore);
        const createdAt = new Date().toISOString();

        // Calculate next bill number for this specific date
        const targetDate = newTransactions[0].date;
        const maxBillNumber = transactions
            .filter(t => t.date === targetDate)
            .reduce((max, t) => {
                return (t.billNumber || 0) > max ? (t.billNumber || 0) : max;
            }, 0);
        const nextBillNumber = maxBillNumber + 1;

        newTransactions.forEach(t => {
            const transRef = doc(collection(firestore, 'transactions'));
            batch.set(transRef, { ...t, billNumber: nextBillNumber, createdAt });
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
            const isWalkIn = customer?.code === "000";
            const amountPaid = isWalkIn ? totalAmount : (amountPaidOverride !== undefined ? amountPaidOverride : (paymentMethod !== 'Credit' ? totalAmount : 0));

            if (existingPayment) {
                const newTotalAmount = existingPayment.totalAmount + totalAmount;
                const newPaidAmount = existingPayment.paidAmount + amountPaid;
                batch.update(paymentRef, {
                    totalAmount: newTotalAmount,
                    paidAmount: newPaidAmount,
                    dueAmount: isWalkIn ? 0 : (newTotalAmount - newPaidAmount),
                    paymentMethod: isWalkIn ? 'Cash' : paymentMethod,
                });
            } else {
                const dueAmount = isWalkIn ? 0 : (totalAmount - amountPaid);
                batch.set(paymentRef, {
                    id: customerId,
                    partyId: customerId,
                    partyName: partyDetails.name,
                    totalAmount: totalAmount,
                    paidAmount: isWalkIn ? totalAmount : amountPaid,
                    dueAmount: dueAmount,
                    paymentMethod: isWalkIn ? 'Cash' : paymentMethod,
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
                    createdAt: createdAt
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
                    createdAt: createdAt
                });
            }
        }

        return batch.commit().then(() => nextBillNumber).catch(e => {
            const permissionError = new FirestorePermissionError({ path: 'batch-write', operation: 'write' });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
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

    const deleteCustomer = async (customerId: string, silent: boolean = false) => {
        if (!firestore) return;
        const customerRef = doc(firestore, 'customers', customerId);
        const paymentRef = doc(firestore, 'customerPayments', customerId);

        try {
            await deleteDoc(customerRef);
            await deleteDoc(paymentRef);
            if (!silent) {
                toast({ title: 'Success', description: 'Customer deleted successfully.' });
            }
        } catch (e: any) {
            console.error("Error deleting customer:", e);
            const permissionError = new FirestorePermissionError({ path: customerRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    }

    const deleteSupplier = async (supplierId: string, silent: boolean = false) => {
        if (!firestore) return;
        const supplierRef = doc(firestore, 'suppliers', supplierId);
        const paymentRef = doc(firestore, 'supplierPayments', supplierId);

        try {
            await deleteDoc(supplierRef);
            await deleteDoc(paymentRef);
            if (!silent) {
                toast({ title: 'Success', description: 'Supplier deleted successfully.' });
            }
        } catch (e: any) {
            console.error("Error deleting supplier:", e);
            const permissionError = new FirestorePermissionError({ path: supplierRef.path, operation: 'delete' });
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
        const currentISO = new Date().toISOString();
        const dateStr = format(new Date(), 'yyyy-MM-dd');

        // 1. Create Transaction Record
        const transRef = doc(collection(firestore, 'transactions'));
        const transaction: Transaction = {
            id: transRef.id,
            date: dateStr,
            party: partyName,
            type: "Payment",
            item: "Payment Received/Given",
            amount: amount,
            payment: paymentMethod,
            credit: partyType === "Supplier" ? amount : 0, // Supplier payment is credit (reducing our debt)
            debit: partyType === "Customer" ? amount : 0,  // Customer payment is debit (reducing their debt)
            createdAt: currentISO
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

        if (products.some(p => p.itemCode.toLowerCase() === newProductData.itemCode.toLowerCase())) {
            toast({ title: 'Error', description: 'Product with this code already exists.', variant: 'destructive' });
            return;
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

    const updateProduct = async (updatedProduct: Product) => {
        if (!firestore) return;

        if (products.some(p => p.itemCode.toLowerCase() === updatedProduct.itemCode.toLowerCase() && p.id !== updatedProduct.id)) {
            toast({ title: 'Error', description: 'Product with this code already exists.', variant: 'destructive' });
            return;
        }

        const productRef = doc(firestore, 'products', updatedProduct.id);
        try {
            await updateDoc(productRef, updatedProduct as any);
            toast({ title: 'Success', description: 'Product updated successfully.' });
        } catch (e) {
            console.error("Error updating product:", e);
            toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive' });
            const permissionError = new FirestorePermissionError({ path: productRef.path, operation: 'update', requestResourceData: updatedProduct });
            errorEmitter.emit('permission-error', permissionError);
        }
    }

    const deleteProduct = async (productId: string, silent: boolean = false) => {
        if (!firestore) return;
        const productRef = doc(firestore, 'products', productId);
        try {
            await deleteDoc(productRef);
            if (!silent) {
                toast({ title: 'Success', description: 'Product deleted successfully.' });
            }
        } catch (e: any) {
            console.error("Error deleting product:", e);
            const permissionError = new FirestorePermissionError({ path: productRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        }
    }

    const value: TransactionContextType = { transactions, addTransaction, supplierPayments, customerPayments, updateSupplierPayment, updateCustomerPayment, suppliers, addSupplier, updateSupplier, customers, addCustomer, updateCustomer, deleteCustomer, deleteSupplier, dailySummaries, saveDailySummary, addPayment, products, addProduct, updateProduct, deleteProduct, loading };

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
