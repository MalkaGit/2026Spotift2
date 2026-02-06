import { useState, useRef, useEffect } from 'react';

type SortField = 'created_at' | 'name';
type SortDirection = 'asc' | 'desc';

type SortPreset = 'recently_added' | 'alphabetical';

const PRESETS: { value: SortPreset; label: string; sort: SortField; direction: SortDirection }[] = [
  { value: 'recently_added', label: 'Recently added', sort: 'created_at', direction: 'desc' },
  { value: 'alphabetical', label: 'Alphabetical', sort: 'name', direction: 'asc' },
];

interface LibrarySidebarSortProps {
  sort: SortField;
  direction: SortDirection;
  onSort: (sort: SortField, direction: SortDirection) => void;
}

function getPreset(sort: SortField, direction: SortDirection): SortPreset {
  const found = PRESETS.find((p) => p.sort === sort && p.direction === direction);
  return found?.value ?? 'recently_added';
}

export function LibrarySidebarSort({ sort, direction, onSort }: LibrarySidebarSortProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePreset = getPreset(sort, direction);
  const activeLabel = PRESETS.find((p) => p.value === activePreset)?.label ?? 'Recently added';

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="sidebar-sort-popover" ref={containerRef}>
      <div className="sidebar-sort-row-inner">
        <span className="sidebar-sort-label">{activeLabel}</span>
        <button
          type="button"
          className="sidebar-sort-icon-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Sort by"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M2 4h12v1.5H2V4zm0 3.25h12v1.5H2v-1.5zm0 3.25h8v1.5H2v-1.5z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="sidebar-sort-popover-panel" role="listbox">
          <div className="sidebar-sort-popover-title">Sort by</div>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="option"
              aria-selected={p.value === activePreset}
              className={`sidebar-sort-option ${p.value === activePreset ? 'sidebar-sort-option-active' : ''}`}
              onClick={() => {
                onSort(p.sort, p.direction);
                setOpen(false);
              }}
            >
              {p.label}
              {p.value === activePreset && (
                <span className="sidebar-sort-option-check" aria-hidden>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
