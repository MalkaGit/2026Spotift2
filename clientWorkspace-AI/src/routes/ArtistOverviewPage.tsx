import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtistOverview } from '@/api/artistsApi';
import type { ArtistOverviewOutput, ArtistOverviewTrackItem } from '@/types/ArtistOverview';
import { addLike, removeLike } from '@/api/likesApi';
import { recordTrackPlay } from '@/api/tracksApi';
import { useLibraryContext } from '@/context/LibraryContext';

function formatMonthlyListeners(n: number): string {
  const s = n.toLocaleString('en-US');
  return `${s} monthly listeners`;
}

function formatPlayCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '')}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ArtistOverviewPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ArtistOverviewOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackMenuTrackId, setTrackMenuTrackId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { loadLibrary } = useLibraryContext();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!artistId) {
      setError('Missing artist');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getArtistOverview(artistId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsLiked(res.isLiked);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load artist');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [artistId]);

  async function handleToggleFollow() {
    if (!artistId || isLiked == null) return;

    const payload = { entityType: 'artist' as const, entityId: artistId };
    const next = !isLiked;

    // Optimistic update for snappy UX
    setIsLiked(next);

    try {
      if (next) {
        await addLike(payload);
      } else {
        await removeLike(payload);
      }
      loadLibrary();
    } catch {
      // Revert on failure
      setIsLiked(!next);
      // Optional: show error to user
    }
  }

  if (loading) {
    return (
      <div className="layout-center artist-overview-loading">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="artist-overview-error">
        <p>{error || 'Artist not found'}</p>
        <button type="button" className="artist-overview-back" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const hasHeaderImage = Boolean(data.headerImageUrl?.trim());

  return (
    <div className="artist-overview">
      <div
        className={`artist-overview-header ${hasHeaderImage ? 'has-image' : ''}`}
        style={hasHeaderImage ? { backgroundImage: `url(${data.headerImageUrl})` } : undefined}
      >
        <div className="artist-overview-header-shade" />
        <div className="artist-overview-header-content">
          <h1 className="artist-overview-name">{data.artistName}</h1>
          <p className="artist-overview-monthly-listeners">
            {formatMonthlyListeners(data.monthlyListeners)}
          </p>
        </div>
      </div>

      <div className="artist-overview-actions">
        <button type="button" className="artist-overview-play-btn" aria-label="Play">
          <img src="/icons/play.svg" alt="" className="artist-overview-play-icon" aria-hidden />
        </button>
        {data.actionBarImageUrl && (
          <img
            src={data.actionBarImageUrl}
            alt=""
            className="artist-overview-action-bar-image"
            aria-hidden
          />
        )}
        <button
          type="button"
          className={`artist-overview-shuffle-btn ${isShuffleOn ? 'is-on' : ''}`}
          aria-label="Shuffle"
          aria-pressed={isShuffleOn}
          onClick={() => setIsShuffleOn((prev) => !prev)}
        >
          <img
            src={isShuffleOn ? '/icons/shuffle-on.png' : '/icons/shuffle-off.png'}
            alt=""
            className="artist-overview-shuffle-icon"
            aria-hidden
          />
        </button>
        <button
          type="button"
          className={`artist-overview-follow-btn ${isLiked ? 'following' : ''}`}
          aria-label={isLiked ? 'Following' : 'Follow'}
          onClick={handleToggleFollow}
          disabled={isLiked == null}
        >
          {isLiked ? 'Following' : 'Follow'}
        </button>
        <div className="artist-overview-more-wrap" ref={menuRef}>
          <button
            type="button"
            className="artist-overview-more-btn"
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>⋯</span>
          </button>
          {menuOpen && (
            <div className="artist-overview-context-menu" role="menu">
              {!isLiked ? (
                <button
                  type="button"
                  className="artist-overview-context-menu-item"
                  role="menuitem"
                  onClick={() => {
                    handleToggleFollow();
                    setMenuOpen(false);
                  }}
                >
                  <span className="artist-overview-context-menu-icon" aria-hidden>
                    <img src="/icons/follow.svg" alt="" width="24" height="24" />
                  </span>
                  Follow
                </button>
              ) : (
                <button
                  type="button"
                  className="artist-overview-context-menu-item"
                  role="menuitem"
                  onClick={() => {
                    handleToggleFollow();
                    setMenuOpen(false);
                  }}
                >
                  <span className="artist-overview-context-menu-icon artist-overview-context-menu-icon--unfollow" aria-hidden>
                    <img src="/icons/unfollow.svg" alt="" width="24" height="24" />
                  </span>
                  Unfollow
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="artist-overview-popular">
        <h2 className="artist-overview-popular-title">Popular</h2>
        <ul className="artist-overview-track-list" role="list">
          {data.topTracks.map((track) => (
            <TrackRow
              key={track.trackId}
              track={track}
              isSelected={selectedTrackId === track.trackId}
              isMenuOpen={trackMenuTrackId === track.trackId}
              onSelectRow={() => setSelectedTrackId((id) => (id === track.trackId ? null : track.trackId))}
              onOpenMenu={() => setTrackMenuTrackId((id) => (id === track.trackId ? null : track.trackId))}
              onCloseMenu={() => setTrackMenuTrackId(null)}
              onPlayTrack={() => recordTrackPlay(track.trackId)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function TrackRow({
  track,
  isSelected,
  isMenuOpen,
  onSelectRow,
  onOpenMenu,
  onCloseMenu,
  onPlayTrack,
}: {
  track: ArtistOverviewTrackItem;
  isSelected: boolean;
  isMenuOpen: boolean;
  onSelectRow: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onPlayTrack: () => void;
}) {
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        onCloseMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, onCloseMenu]);

  return (
    <li
      className={`artist-overview-track-row ${isSelected ? 'is-selected' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onSelectRow();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest('button')) onSelectRow();
        }
      }}
      aria-pressed={isSelected}
    >
      <button
        type="button"
        className="artist-overview-track-rank-cell"
        aria-label={`Play ${track.trackName}`}
        onClick={(e) => {
          e.stopPropagation();
          onPlayTrack();
        }}
      >
        <span className="artist-overview-track-rank-num">{track.rank}</span>
        <span className="artist-overview-track-rank-play" aria-hidden>
          <img src="/icons/play.svg" alt="" width="20" height="20" />
        </span>
      </button>
      <img
        src={track.albumImageUrl || ''}
        alt=""
        className={`artist-overview-track-artwork ${!track.albumImageUrl ? 'placeholder' : ''}`}
      />
      <div className="artist-overview-track-info">
        <span className="artist-overview-track-name">{track.trackName}</span>
        <span className="artist-overview-track-meta">Song</span>
      </div>
      <div className="artist-overview-track-plays-cell">
        <button
          type="button"
          className="artist-overview-track-add-btn"
          aria-label="Add to library"
          title="Add to library (not yet implemented)"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
        <span className="artist-overview-track-plays">{formatPlayCount(track.totalPlays)}</span>
      </div>
      <span className="artist-overview-track-duration">{formatDuration(track.durationMs)}</span>
      <div className="artist-overview-track-more-wrap" ref={rowMenuRef}>
        <button
          type="button"
          className="artist-overview-track-more-btn"
          aria-label="More options for track"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu();
          }}
        >
          <span aria-hidden>⋯</span>
        </button>
        {isMenuOpen && (
          <div className="artist-overview-track-context-menu" role="menu">
            {/* Empty for now */}
          </div>
        )}
      </div>
    </li>
  );
}
