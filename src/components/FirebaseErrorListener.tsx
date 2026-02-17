
'use client';

import { useEffect } from 'react';

import { errorEmitter } from '@/firebase/error-emitter';

export default function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: Error) => {
      // In a Next.js development environment, this will be caught by the dev overlay
      // In production, you might want to log this to a service like Sentry
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
