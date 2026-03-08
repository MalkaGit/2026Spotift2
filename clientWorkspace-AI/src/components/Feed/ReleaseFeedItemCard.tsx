import type { ReleaseFeedItem } from '@/types';

interface ReleaseFeedItemCardProps {
  item: ReleaseFeedItem;
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatDuration(ms?: number): string {
  if (ms == null) return '';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min} min ${sec} sec`;
}

export function ReleaseFeedItemCard({ item }: ReleaseFeedItemCardProps) {
  const { feedActors, feedObject, occurredAt } = item;
  const artistNames = feedActors.map((a) => a.name).join(', ');
  const timeAgo = formatTimeAgo(occurredAt);
  const isAlbum = feedObject.type === 'album';
  const meta = isAlbum
    ? `${feedObject.albumType ?? 'Album'} • ${timeAgo}`
    : `Episode • ${timeAgo}${feedObject.episodeDurationMs ? ` • ${formatDuration(feedObject.episodeDurationMs)}` : ''}`;

  return (
    <div className="feed-item-card">
      <div className="feed-item-card-image-wrap">
        <img
          src={feedObject.imageUrl || ''}
          alt=""
          className={`feed-item-card-image ${!feedObject.imageUrl ? 'placeholder' : ''}`}
        />
      </div>
      <div className="feed-item-card-body">
        <h3 className="feed-item-card-title">{feedObject.title}</h3>
        <p className="feed-item-card-subtitle">{artistNames}</p>
        <p className="feed-item-card-meta">{meta}</p>
      </div>
    </div>
  );
}
