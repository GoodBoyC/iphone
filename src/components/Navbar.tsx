import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: isHome
          ? 'linear-gradient(180deg, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 70%, transparent 100%)'
          : 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/nover/admin"
              className="text-xs font-mono text-zinc-500 hover:text-amber-400 transition-colors uppercase tracking-wider"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
