import { Link } from 'react-router-dom';
import { useLibraryContext } from '@/context/LibraryContext';
import { LibraryList } from '@/components/Library/LibraryList';
import { Spinner } from '@/components/Common/Spinner';
import { ErrorMessage } from '@/components/Common/ErrorMessage';

export function LibraryPage() {
  const { items, isLoading, error } = useLibraryContext();

  if (isLoading && items.length === 0) {
    return (
      <div className="layout-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Your Library</h1>
      {error && <ErrorMessage message={error} />}
      {items.length === 0 && !error ? (
        <div className="empty-state" style={{ textAlign: 'left' }}>
          <p style={{ margin: '0 0 12px 0' }}>
            You haven’t added any artists yet. Search for artists to follow, or pick favorites to get started.
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/search">Go to Search</Link>
            {' · '}
            <Link to="/onboarding/favorites">Pick favorites</Link>
          </p>
        </div>
      ) : (
        <div className="library-main-list">
          <LibraryList items={items} />
        </div>
      )}
    </>
  );
}
