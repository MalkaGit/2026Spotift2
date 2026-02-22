import { Link } from 'react-router-dom';
import type { SearchItem } from '@/types';

interface ArtistCardProps {
  item: SearchItem;
  onLike: (item: SearchItem) => void;
}

export function ArtistCard({ item, onLike }: ArtistCardProps) {
  return (
    <div className="artist-card-spotify">
      <Link to={`/artist/${item.id}`} className="artist-card-spotify-link">
        <div className="artist-card-spotify-image-wrap">
          <img
            src={item.imageUrl || ''}
            alt=""
            className={`artist-card-spotify-image ${!item.imageUrl ? 'placeholder' : ''}`}
          />
        </div>
        <div className="artist-card-spotify-name">{item.name}</div>
        <div className="artist-card-spotify-meta">Artist</div>
      </Link>
      <button
        type="button"
        className={`artist-card-follow-btn ${item.liked ? 'following' : ''}`}
        aria-label={item.liked ? 'Following' : 'Follow'}
        disabled={item.liked}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!item.liked) {
            onLike(item);
          }
        }}
      >
        {item.liked ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
