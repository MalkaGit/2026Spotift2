import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryContext } from '@/context/LibraryContext';
import { LibraryList } from '@/components/Library/LibraryList';
import { Spinner } from '@/components/Common/Spinner';
import { ErrorMessage } from '@/components/Common/ErrorMessage';

export function LibraryPage() {
  const { items, isLoading, error } = useLibraryContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && items.length === 0 && !error) {
      navigate('/onboarding/favorites', { replace: true });
    }
  }, [isLoading, items.length, error, navigate]);

  if (isLoading && items.length === 0) {
    return (
      <div className="layout-center">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0 && !error) {
    return null;
  }

  return (
    <>
      <h1 className="page-title">Your Library</h1>
      {error && <ErrorMessage message={error} />}
      <div className="library-main-list">
        <LibraryList items={items} />
      </div>
    </>
  );
}
