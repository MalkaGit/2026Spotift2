import { NavLink } from 'react-router-dom';
import type { LikesItem } from '@/types';
import { useArtistImageFallback } from '@/hooks/useArtistImageFallback';

interface LibraryItemRowProps {
  item: LikesItem;
  /** Compact style for sidebar (icon + name only). */
  compact?: boolean;
  /** When compact: whether this row is selected (light gray background). */
  isSelected?: boolean;
  /** When compact: called when the row is clicked (to set selection). */
  onSelect?: () => void;
}

const typeLabels: Record<string, string> = {
  artist: 'Artist',
  album: 'Album',
  playlist: 'Playlist',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function LibraryItemIcon({ type }: { type: string }) {
  if (type === 'artist') return <span className="library-item-icon library-item-icon-artist">♪</span>;
  if (type === 'album') return <span className="library-item-icon library-item-icon-album">◷</span>;
  return <span className="library-item-icon library-item-icon-playlist">▢</span>;
}

export function LibraryItemRow({ item, compact, isSelected, onSelect }: LibraryItemRowProps) {
  const typeLabel = typeLabels[item.likedEntityType] ?? item.likedEntityType ?? '—';
  const name = item.likedEntityName ?? '—';
  const dateStr = item.createdAt != null && item.createdAt !== '' ? formatDate(item.createdAt) : '—';

  if (compact) {
    const needsFallback = item.likedEntityType === 'artist' && !item.likedEntityImageUrl;
    const fallbackUrl = useArtistImageFallback(
      needsFallback ? item.likedEntityName : '',
      item.likedEntityId
    );
    const imageUrl = item.likedEntityImageUrl ?? (item.likedEntityType === 'artist' ? fallbackUrl : undefined);
    const compactClass = `list-row list-row-compact${isSelected ? ' active' : ''}`;
    return (
      <NavLink
        to="/library"
        className={() => compactClass}
        onClick={onSelect}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="list-row-compact-img"
          />
        ) : (
          <LibraryItemIcon type={item.likedEntityType} />
        )}
        <span className="list-row-compact-text">
          <span className="list-row-name-compact">{name}</span>
          <span className="list-row-type-compact">{typeLabel}</span>
        </span>
      </NavLink>
    );
  }

  return (
    <div className="list-row">
      <span className="list-row-type" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        {typeLabel}
      </span>
      <span className="list-row-name" style={{ flex: 1, fontWeight: 500 }}>
        {name}
      </span>
      <span className="list-row-date" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {dateStr}
      </span>
    </div>
  );
}
