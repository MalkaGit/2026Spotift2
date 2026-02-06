import { useState } from 'react';
import { useLibraryContext } from '@/context/LibraryContext';
import { LibrarySidebarSort } from '@/components/Library/LibrarySidebarSort';
import { LibraryList } from '@/components/Library/LibraryList';
import { Spinner } from '@/components/Common/Spinner';

export function SideNav() {
  const { items, isLoading, sort, direction, setSortAndReload } = useLibraryContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-library-header">
        <h2 className="sidebar-title">Your Library</h2>
      </div>
      <div className="sidebar-sort-row">
        <LibrarySidebarSort sort={sort} direction={direction} onSort={setSortAndReload} />
      </div>
      <div className="sidebar-library-section">
        {isLoading ? (
          <div className="sidebar-library-loading">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="sidebar-library-empty">No items yet</p>
        ) : (
          <LibraryList
            items={items}
            className="sidebar-library-list"
            compact
            selectedId={selectedId}
            onSelectId={setSelectedId}
          />
        )}
      </div>
    </aside>
  );
}
