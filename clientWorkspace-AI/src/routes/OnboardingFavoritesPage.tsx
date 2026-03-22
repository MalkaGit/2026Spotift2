import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryContext } from '@/context/LibraryContext';
import { useArtistSearch } from '@/hooks/useArtistSearch';
import { getMyLikes } from '@/api/likesApi';
import { getArtistCount } from '@/utils/library';
import { ArtistSearchBar } from '@/components/Search/ArtistSearchBar';
import { ArtistList } from '@/components/Search/ArtistList';
import { Button } from '@/components/Common/Button';
import type { SearchItem } from '@/types';

export function OnboardingFavoritesPage() {
  const { loadLibrary } = useLibraryContext();
  const { results, isLoading, search, toggleLike } = useArtistSearch({
    onLikeSuccess: loadLibrary,
  });
  const [likedCount, setLikedCount] = useState(0);
  const navigate = useNavigate();

  async function refreshLikedCount() {
    try {
      const { items } = await getMyLikes({ limit: 100 });
      setLikedCount(getArtistCount(items));
    } catch {
      setLikedCount(0);
    }
  }

  useEffect(() => {
    refreshLikedCount();
  }, []);

  async function handleLike(item: SearchItem) {
    if (item.liked) return;
    await toggleLike(item);
    await refreshLikedCount();
  }

  function handleContinue() {
    navigate('/library', { replace: true });
  }

  return (
    <>
      <h1 className="page-title">Pick your favorites</h1>
      <p className="empty-state" style={{ textAlign: 'left', padding: '0 0 20px 0' }}>
        Add artists you like to personalize your library. You can continue anytime.
        {likedCount > 0 && (
          <span style={{ display: 'block', marginTop: 8 }}>
            You've selected {likedCount} artist{likedCount !== 1 ? 's' : ''}.
          </span>
        )}
      </p>
      <ArtistSearchBar
        onSearch={search}
        placeholder="Search for artists..."
      />
      <ArtistList
        items={results}
        onLike={handleLike}
        isLoading={isLoading}
      />
      <div style={{ marginTop: 32 }}>
        <Button onClick={handleContinue}>
          Continue to Library
          {likedCount > 0 ? ` (${likedCount} selected)` : ''}
        </Button>
      </div>
    </>
  );
}
