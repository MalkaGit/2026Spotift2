import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MIN_ARTISTS } from '@/constants';
import { useLibraryContext } from '@/context/LibraryContext';
import { useArtistSearch } from '@/hooks/useArtistSearch';
import { getMyLikes } from '@/api/likesApi';
import { getArtistCount } from '@/utils/library';
import { ArtistSearchBar } from '@/components/Search/ArtistSearchBar';
import { ArtistList } from '@/components/Search/ArtistList';
import { Button } from '@/components/Common/Button';
import { Modal } from '@/components/Common/Modal';
import type { SearchItem } from '@/types';

type LocationState = { fromLogin?: boolean; artistCount?: number } | null;

export function OnboardingFavoritesPage() {
  const { loadLibrary } = useLibraryContext();
  const { results, isLoading, search, toggleLike } = useArtistSearch({
    onLikeSuccess: loadLibrary,
  });
  const [likedCount, setLikedCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const fromLogin = state?.fromLogin === true;
  const artistCountFromLogin = state?.artistCount ?? 0;
  const needMore = MIN_ARTISTS - artistCountFromLogin;

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

  useEffect(() => {
    if (likedCount >= MIN_ARTISTS) {
      navigate('/library', { replace: true });
    }
  }, [likedCount, navigate]);

  async function handleLike(item: SearchItem) {
    if (item.liked) return;
    await toggleLike(item);
    await refreshLikedCount();
  }

  function handleContinue() {
    navigate('/library', { replace: true });
  }

  const canContinue = likedCount >= MIN_ARTISTS;
  const showModal = fromLogin && artistCountFromLogin < MIN_ARTISTS && showLoginModal;

  return (
    <>
      <Modal
        isOpen={showModal}
        onClose={() => setShowLoginModal(false)}
        title="Complete your setup"
      >
        <p style={{ margin: 0 }}>
          You need at least {MIN_ARTISTS} artists to continue. You have {artistCountFromLogin}. Add {needMore} more below.
        </p>
        <div className="modal-actions">
          <Button onClick={() => setShowLoginModal(false)}>OK</Button>
        </div>
      </Modal>
      <h1 className="page-title">Pick your favorites</h1>
      <p className="empty-state" style={{ textAlign: 'left', padding: '0 0 20px 0' }}>
        Choose at least {MIN_ARTISTS} artists to start your library.
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
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue to Library {canContinue ? `(${likedCount} selected)` : `(need ${MIN_ARTISTS - likedCount} more)`}
        </Button>
      </div>
    </>
  );
}
