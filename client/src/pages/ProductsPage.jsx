import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import styles from './ProductsPage.module.css';

const CATEGORIES = ['All','Microcontrollers','Sensors','Modules','Components','Power','Display','Communication','Tools','Kits','Other'];

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const searchQuery = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 16 };
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, page, searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [activeCategory, searchQuery]);

  return (
    <main className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={`section-title`}>
            {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
          </h1>
          {total > 0 && (
            <p className={styles.resultCount}>{total} product{total !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className={styles.categoryTabs}>
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`${styles.catTab} ${activeCategory === cat ? styles.catTabActive : ''}`}
            onClick={() => setActiveCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="product-grid" style={{ marginTop: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={`skeleton ${styles.skeletonImage}`} />
              <div className={styles.skeletonContent}>
                {[75, 55, 40].map((w, j) => (
                  <div key={j} className="skeleton" style={{ height: 13, width: `${w}%`, borderRadius: 6 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Zap size={48} />
          <p style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 14 }}>No products found</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Try a different search or category</p>
        </div>
      ) : (
        <>
          <div className="product-grid fade-in" style={{ marginTop: 20 }}>
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
