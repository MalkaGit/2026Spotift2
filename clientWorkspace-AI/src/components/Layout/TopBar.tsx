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

  const handleBellClick = useCallback(() => {
    navigate('/feed');
  }, [navigate]);

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
        <button
          type="button"
          className="app-top-bar-bell-btn"
          onClick={handleBellClick}
          aria-label="What's New"
        >
          <BellIcon />
        </button>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}
