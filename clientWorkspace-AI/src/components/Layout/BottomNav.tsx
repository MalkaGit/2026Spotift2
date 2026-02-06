import { NavLink } from 'react-router-dom';

const links = [
  { to: '/library', label: 'Library' },
  { to: '/search', label: 'Search' },
];

export function BottomNav() {
  return (
    <nav className="app-bottom-nav">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
