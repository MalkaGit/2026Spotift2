import type { SearchItem } from '@/types';

interface ArtistCardProps {
  item: SearchItem;
  onLike: (item: SearchItem) => void;
}

export function ArtistCard({ item, onLike }: ArtistCardProps) {
  const isLiked = item.liked === true;
  return (
    <div className="artist-card-spotify">
      <div className="artist-card-spotify-image-wrap">
        <img
          src={item.imageUrl || ''}
          alt=""
          className={`artist-card-spotify-image ${!item.imageUrl ? 'placeholder' : ''}`}
        />
      </div>
      <div className="artist-card-spotify-name">{item.name}</div>
      <div className="artist-card-spotify-meta">Artist</div>
      <button
        type="button"
        className={`artist-follow-btn ${isLiked ? 'following' : ''}`}
        onClick={() => !isLiked && onLike(item)}
        aria-label={isLiked ? 'Following' : 'Follow'}
        disabled={isLiked}
      >
        {isLiked ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
