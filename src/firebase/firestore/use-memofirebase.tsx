import { useMemo } from 'react';

export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  // We disable the exhaustive-deps rule because we want to explicitly control the dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
