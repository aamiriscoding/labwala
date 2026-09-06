import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Lab<span className={styles.logoAccent}>Wala</span></span>
          </div>
          <p className={styles.tagline}>Electronics parts, right from the hostel.</p>
          <p className={styles.sub}>College electronics store — Arduinos, sensors, modules & more.</p>
        </div>

        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <div className={styles.groupTitle}>Shop</div>
            <Link to="/products" className={styles.link}>All Products</Link>
            <Link to="/products?category=Microcontrollers" className={styles.link}>Microcontrollers</Link>
            <Link to="/products?category=Sensors" className={styles.link}>Sensors</Link>
            <Link to="/products?category=Modules" className={styles.link}>Modules</Link>
          </div>
          <div className={styles.linkGroup}>
            <div className={styles.groupTitle}>Info</div>
            <Link to="/services" className={styles.link}>Services</Link>
            <Link to="/faq" className={styles.link}>FAQ</Link>
            <Link to="/services" className={styles.link}>Soldering</Link>
            <Link to="/services" className={styles.link}>Project Building</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span className={styles.copy}>© {new Date().getFullYear()} LabWala. Built with ⚡ in the hostel.</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>v1.0.0</span>
      </div>
    </footer>
  );
}
