import type { LikesItem } from '@/types';
import { LibraryItemRow } from './LibraryItemRow';

interface LibraryListProps {
  items: LikesItem[];
  /** Optional class for the list container (e.g. sidebar compact list). */
  className?: string;
  /** When true, render compact rows for sidebar. */
  compact?: boolean;
  /** When compact, id of the selected row (shows light gray). */
  selectedId?: string | null;
  /** When compact, called when a row is clicked to set selection. */
  onSelectId?: (id: string) => void;
}

export function LibraryList({ items, className, compact, selectedId, onSelectId }: LibraryListProps) {
  if (items.length === 0) return null;
  return (
    <ul className={className ? `card-list ${className}` : 'card-list'}>
      {items.map((item) => (
        <li key={item.id}>
          <LibraryItemRow
            item={item}
            compact={compact}
            isSelected={compact && selectedId === item.id}
            onSelect={compact && onSelectId ? () => onSelectId(item.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
