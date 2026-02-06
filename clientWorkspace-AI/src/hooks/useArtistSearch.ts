import { useCallback, useState } from 'react';
import { searchArtists } from '@/api/searchApi';
import { addLike } from '@/api/likesApi';
import type { SearchItem } from '@/types';

export interface UseArtistSearchOptions {
  /** Called after an artist is successfully added to the library (e.g. to refresh library sidebar). */
  onLikeSuccess?: () => void;
}

export function useArtistSearch(options?: UseArtistSearchOptions) {
  const { onLikeSuccess } = options ?? {};
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { items } = await searchArtists({ q: q.trim(), limit: 20 });
      setResults(
        items.map((i) => ({ ...i, liked: i.liked === true }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (item: SearchItem) => {
    if (item.liked === true) return;
    try {
      await addLike({ entityType: 'artist', entityId: item.id });
      setResults((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, liked: true } : r))
      );
      onLikeSuccess?.();
    } catch {
      // keep UI unchanged on error
    }
  }, [onLikeSuccess]);

  return { query, setQuery, results, isLoading, error, search, toggleLike };
}
