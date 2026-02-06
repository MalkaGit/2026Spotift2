import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMyLikes } from '@/api/likesApi';
import type { LikesItem } from '@/types';

type SortField = 'created_at' | 'name';
type SortDirection = 'asc' | 'desc';

interface LibraryContextValue {
  items: LikesItem[];
  sort: SortField;
  direction: SortDirection;
  isLoading: boolean;
  error: string | null;
  loadLibrary: (sortBy?: SortField, dir?: SortDirection) => Promise<void>;
  setSortAndReload: (sortBy: SortField, dir: SortDirection) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LikesItem[]>([]);
  const [sort, setSort] = useState<SortField>('created_at');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(async (sortBy?: SortField, dir?: SortDirection, signal?: AbortSignal) => {
    const s = sortBy ?? sort;
    const d = dir ?? direction;
    setIsLoading(true);
    setError(null);
    try {
      const { items: list } = await getMyLikes({ sort: s, direction: d, limit: 100 }, signal);
      if (signal?.aborted) return;
      setItems(list);
      if (sortBy != null) setSort(sortBy);
      if (dir != null) setDirection(dir);
    } catch (e: unknown) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [sort, direction]);

  useEffect(() => {
    const controller = new AbortController();
    loadLibrary(undefined, undefined, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const setSortAndReload = useCallback(
    (sortBy: SortField, dir: SortDirection) => {
      setSort(sortBy);
      setDirection(dir);
      loadLibrary(sortBy, dir);
    },
    [loadLibrary]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      items,
      sort,
      direction,
      isLoading,
      error,
      loadLibrary,
      setSortAndReload,
    }),
    [items, sort, direction, isLoading, error, loadLibrary, setSortAndReload]
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibraryContext(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibraryContext must be used within LibraryProvider');
  return ctx;
}
