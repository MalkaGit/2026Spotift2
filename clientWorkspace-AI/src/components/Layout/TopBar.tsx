import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState('');
  const isSearchPage = location.pathname === '/search';

  const q = searchParams.get('q') ?? '';

  useEffect(() => {
    if (isSearchPage && q !== value) {
      setValue(q);
    }
  }, [isSearchPage, q]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      } else {
        navigate('/search');
      }
    },
    [value, navigate]
  );

  const handleFocus = useCallback(() => {
    if (location.pathname !== '/search') {
      navigate('/search');
    }
  }, [location.pathname, navigate]);

  return (
    <header className="app-top-bar">
      <div className="app-top-bar-inner">
        <form onSubmit={handleSubmit} className="app-top-bar-search-form">
          <span className="app-top-bar-search-icon" aria-hidden>⌕</span>
          <input
            type="search"
            className="app-top-bar-search-input"
            placeholder="What do you want to play?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={handleFocus}
            aria-label="Search"
          />
        </form>
      </div>
    </header>
  );
}
