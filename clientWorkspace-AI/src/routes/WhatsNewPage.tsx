import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getReleaseFeed, type ReleaseFeedEventType } from '@/api/feedApi';
import { ReleaseFeedItemCard } from '@/components/Feed/ReleaseFeedItemCard';
import { Spinner } from '@/components/Common/Spinner';
import { ErrorMessage } from '@/components/Common/ErrorMessage';

type FeedFilter = 'music' | 'podcasts';

const FILTER_EVENT_TYPE: Record<FeedFilter, ReleaseFeedEventType> = {
  music: 'release_album',
  podcasts: 'release_episode',
};

export function WhatsNewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get('filter') as FeedFilter) || 'music';
  const validFilter = filter === 'podcasts' ? 'podcasts' : 'music';

  const setFilter = useCallback(
    (f: FeedFilter) => {
      setSearchParams({ filter: f }, { replace: true });
    },
    [setSearchParams]
  );

  const { items, isLoading, error, refetch } = useReleaseFeed(validFilter);

  return (
    <>
      <h1 className="page-title">What&apos;s New</h1>
      <p className="feed-subtitle">
        The latest releases from artists, podcasts, and shows you follow.
      </p>

      <div className="feed-filter-buttons">
        <button
          type="button"
          className={`feed-filter-btn ${validFilter === 'music' ? 'active' : ''}`}
          onClick={() => setFilter('music')}
        >
          Music
        </button>
        <button
          type="button"
          className={`feed-filter-btn ${validFilter === 'podcasts' ? 'active' : ''}`}
          onClick={() => setFilter('podcasts')}
        >
          Podcasts &amp; Shows
        </button>
      </div>

      {error && (
        <div>
          <ErrorMessage message={error} />
          <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="layout-center" style={{ minHeight: 200 }}>
          <Spinner />
        </div>
      ) : validFilter === 'podcasts' ? (
        <div className="empty-state">
          <p>Episodes feed is coming soon.</p>
          <p>Follow podcasts and shows to see new episodes here.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No new releases from your liked artists.</p>
          <p>Follow more artists to see their latest albums here.</p>
        </div>
      ) : (
        <section className="feed-section">
          <h2 className="feed-section-title">Earlier</h2>
          <ul className="feed-list">
            {items.map((item) => (
              <li key={`${item.feedObject.id}-${item.occurredAt}`}>
                <ReleaseFeedItemCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function useReleaseFeed(filter: FeedFilter) {
  const [state, setState] = useState<{
    items: import('@/types').ReleaseFeedItem[];
    nextCursor?: string;
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  const fetchFeed = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const eventType = FILTER_EVENT_TYPE[filter];

    try {
      if (filter === 'podcasts') {
        setState({
          items: [],
          isLoading: false,
          error: null,
        });
        return;
      }

      const res = await getReleaseFeed({
        event_type: eventType,
        days: 60,
        limit: 20,
      });
      setState({
        items: res.items,
        nextCursor: res.nextCursor,
        isLoading: false,
        error: null,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load feed';
      setState((s) => ({
        ...s,
        isLoading: false,
        error: msg,
      }));
    }
  }, [filter]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    ...state,
    refetch: fetchFeed,
  };
}
