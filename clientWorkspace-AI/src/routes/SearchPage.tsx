import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibraryContext } from '@/context/LibraryContext';
import { useArtistSearch } from '@/hooks/useArtistSearch';
import { ArtistList } from '@/components/Search/ArtistList';
import { ErrorMessage } from '@/components/Common/ErrorMessage';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { loadLibrary } = useLibraryContext();
  const { results, isLoading, error, search, toggleLike } = useArtistSearch({
    onLikeSuccess: loadLibrary,
  });

  useEffect(() => {
    if (q) {
      search(q);
    }
  }, [q, search]);

  return (
    <>
      <h1 className="page-title">Search</h1>
      {error && <ErrorMessage message={error} />}
      <ArtistList items={results} onLike={toggleLike} isLoading={isLoading} />
    </>
  );
}
