import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ShopConfigProvider } from './context/ShopConfigContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WhatsAppFloatButton from './components/WhatsAppFloatButton';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductPage from './pages/ProductPage';
import ServicesPage from './pages/ServicesPage';
import QnAPage from './pages/QnAPage';
import SellPage from './pages/SellPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

// Saves scroll position per pathname before leaving, restores on POP (back/forward)
function ScrollManager() {
  const location = useLocation();
  const scrollPositions = useRef({});
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[prevPathname.current] = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    prevPathname.current = location.pathname;

    if (location.action === 'POP') {
      // Restore saved scroll position after paint
      const saved = scrollPositions.current[location.pathname] ?? 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved, behavior: 'instant' });
        });
      });
    } else {
      // Forward navigation — go to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return null;
}

function PublicLayout({ children, onCartClick }) {
  return (
    <>
      <Navbar onCartClick={onCartClick} />
      {children}
      {/* <Footer /> */}
      <WhatsAppFloatButton />
    </>
  );
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ShopConfigProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollManager />
            <Toaster
              position="top-center"
              containerStyle={{ top: 72 }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  boxShadow: 'var(--shadow-card)',
                },
                success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
                error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#fff' } },
              }}
            />
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <Routes>
              <Route path="/" element={<PublicLayout onCartClick={() => setCartOpen(true)}><HomePage /></PublicLayout>} />
              <Route path="/products" element={<PublicLayout onCartClick={() => setCartOpen(true)}><ProductsPage /></PublicLayout>} />
              <Route path="/product/:id" element={<PublicLayout onCartClick={() => setCartOpen(true)}><ProductPage /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout onCartClick={() => setCartOpen(true)}><ServicesPage /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout onCartClick={() => setCartOpen(true)}><QnAPage /></PublicLayout>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sell" element={<SellPage cartOpen={cartOpen} setCartOpen={setCartOpen} />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </ShopConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
