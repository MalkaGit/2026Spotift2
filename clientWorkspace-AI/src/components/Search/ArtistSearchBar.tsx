import { useState, useCallback } from 'react';

interface ArtistSearchBarProps {
  onSearch: (q: string) => void;
  placeholder?: string;
}

export function ArtistSearchBar({ onSearch, placeholder = 'Search artists...' }: ArtistSearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value);
    },
    [value, onSearch]
  );

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <input
        type="search"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search artists"
      />
      <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>
        Search
      </button>
    </form>
  );
}
