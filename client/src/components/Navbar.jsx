import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Search, X, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

const SEARCH_ROUTES = ['/products', '/sell'];

export default function Navbar({ onCartClick }) {
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const showSearch = SEARCH_ROUTES.includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    const base = location.pathname === '/sell' ? '/sell' : '/products';
    if (searchQuery.trim()) navigate(`${base}?search=${encodeURIComponent(searchQuery.trim())}`);
    else navigate(base);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/services', label: 'Services' },
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--color-primary)',flexShrink:0}}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span className={styles.logoText}>Lab<span className={styles.logoAccent}>Wala</span></span>
        </Link>

        <div className={styles.links}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`${styles.link} ${location.pathname === link.to ? styles.active : ''}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {showSearch && (
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input type="text" placeholder="Search components..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput} />
              {searchQuery && (
                <button type="button" className={styles.searchClear}
                  onClick={() => { setSearchQuery(''); navigate(location.pathname); }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </form>
        )}

        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className={styles.cartBtn} onClick={onCartClick} aria-label="Cart">
            <ShoppingCart size={17} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
          <button className={`${styles.iconBtn} ${styles.mobileMenuBtn}`}
            onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className={styles.mobileSearch}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <Search size={14} />
            <input type="text" placeholder="Search components..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </form>
        </div>
      )}

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
