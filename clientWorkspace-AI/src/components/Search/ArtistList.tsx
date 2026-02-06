import type { SearchItem } from '@/types';
import { ArtistCard } from './ArtistCard';

interface ArtistListProps {
  items: SearchItem[];
  onLike: (item: SearchItem) => void;
  isLoading?: boolean;
}

export function ArtistList({ items, onLike, isLoading }: ArtistListProps) {
  if (isLoading) {
    return (
      <div className="layout-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Search for artists to add to your library.</p>
      </div>
    );
  }
  return (
    <div className="artist-grid">
      {items.map((item) => (
        <ArtistCard key={item.id} item={item} onLike={onLike} />
      ))}
    </div>
  );
}
