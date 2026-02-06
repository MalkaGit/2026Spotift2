import { useEffect, useState } from 'react';
import { searchArtists } from '@/api/searchApi';

/**
 * When the likes API doesn't return an image for an artist, fetch it from search.
 * Returns the image URL once found, or undefined while loading / if not found.
 */
export function useArtistImageFallback(artistName: string | undefined, entityId: string): string | undefined {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!artistName?.trim() || !entityId) return;

    let cancelled = false;
    searchArtists({ q: artistName.trim(), limit: 1 })
      .then(({ items }) => {
        if (cancelled) return;
        const match = items.find((i) => i.id === entityId);
        if (match?.imageUrl) setImageUrl(match.imageUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [artistName, entityId]);

  return imageUrl;
}
