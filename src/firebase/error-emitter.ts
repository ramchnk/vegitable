import { EventEmitter } from 'events';

import { FirestorePermissionError } from '@/firebase/errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// Use declaration merging to add types to the EventEmitter
declare interface TypedEventEmitter {
  on<E extends keyof Events>(event: E, listener: Events[E]): this;
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): boolean;
}

class TypedEventEmitter extends EventEmitter {}

export const errorEmitter = new TypedEventEmitter();
