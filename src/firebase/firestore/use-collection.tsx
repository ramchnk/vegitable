'use client';

import {
  collection,
  onSnapshot,
  query,
  Query,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  SecurityRuleContext,
} from '@/firebase/errors';

interface UseCollectionOptions {
  deps?: any[];
}

export function useCollection<T = DocumentData>(
  queryOrRef: Query | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const deps = options?.deps ?? [];

  useEffect(() => {
    if (queryOrRef === null) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      queryOrRef,
      (snapshot: QuerySnapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(data);
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: queryOrRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryOrRef, ...deps]);

  return { data, loading, error };
}
