import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Star, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useShopConfig } from '../context/ShopConfigContext';
import toast from 'react-hot-toast';
import styles from './ProductPage.module.css';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [marketHover, setMarketHover] = useState(false);
  const { addToCart } = useCart();
  const { buildWhatsAppLink } = useShopConfig() || {};

  const backRoute = location.state?.from || '/products';

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const waLink = product && buildWhatsAppLink?.(
    `Hi! I'd like to order:\n*${product.name}* (ID: ${product.productId || ''})\n₹${product.sellingPrice} x ${quantity} = ₹${(product.sellingPrice * quantity).toFixed(0)}`
  );

  if (loading) return (
    <div className="container" style={{ paddingTop: 80 }}>
      <div className={styles.loadingGrid}>
        <div className={`skeleton ${styles.skeletonImage}`} />
        <div className={styles.skeletonInfo}>
          {[80, 55, 65, 40].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 20, width: `${w}%`, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container" style={{ paddingTop: 80 }}>
      <div className="empty-state">
        <Package size={48} />
        <p style={{ marginTop: 16 }}>Product not found</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate(backRoute)}>
          Go Back
        </button>
      </div>
    </div>
  );

  const getStockBadge = () => {
    if (!product.inStock) {
      const label = product.outOfStockLabel === 'available_on_order' ? 'Available on Order'
        : product.outOfStockLabel === 'restocking_soon' ? 'Restocking Soon'
          : product.outOfStockLabel ? product.outOfStockLabel
            : 'Out of Stock';
      const cls = (product.outOfStockLabel && product.outOfStockLabel !== '') ? 'badge-warning' : 'badge-danger';
      return { label, cls };
    }
    return { label: 'In Stock', cls: 'badge-success' };
  };

  const { label, cls } = getStockBadge();
  const images = product.images?.length > 0 ? product.images : [];
  const hasMarketPrice = product.marketPrice && product.marketPrice > product.sellingPrice;

  return (
    <main className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
      {/* Back button */}
      <button className={styles.back} onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        Back
      </button>

      <div className={styles.grid}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {images.length > 0 ? (
              <>
                <img src={images[activeImage]} alt={product.name} />
                {images.length > 1 && (
                  <>
                    <button className={`${styles.galleryBtn} ${styles.galleryBtnLeft}`}
                      onClick={() => setActiveImage(prev => (prev - 1 + images.length) % images.length)}>
                      <ChevronLeft size={18} />
                    </button>
                    <button className={`${styles.galleryBtn} ${styles.galleryBtnRight}`}
                      onClick={() => setActiveImage(prev => (prev + 1) % images.length)}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className={styles.noImage}><Package size={64} /><span>No image available</span></div>
            )}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button key={i} className={`${styles.thumb} ${activeImage === i ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}>
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.categoryRow}>
            <span className="badge badge-warning">{product.category}</span>
            <span className={`badge ${cls}`}>{label}</span>
            {product.totalSold > 0 && (
              <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(245,158,11,0.25)' }}>
                {product.totalSold} sold
              </span>
            )}
          </div>

          <h1 className={styles.name}>{product.name}</h1>

          {/* Price row — market price always visible, proper tooltip on hover */}
          <div className={styles.priceRow}>
            <div className={styles.priceBlock}>
              <span className={`price ${styles.price}`}>₹{product.sellingPrice}</span>
              {hasMarketPrice && (
                <div className={styles.marketPriceInline}>
                  <div
                    className={styles.marketStrikeWrap}
                    onMouseEnter={() => setMarketHover(true)}
                    onMouseLeave={() => setMarketHover(false)}
                  >
                    <span className={styles.marketStrike}>₹{product.marketPrice}</span>
                    {marketHover && (
                      <div className={styles.marketTooltip}>
                        <div className={styles.tooltipContent}>
                          <span className={styles.tooltipLabel}>Price in local stores</span>
                          <span className={styles.tooltipSave}>You save ₹{product.marketPrice - product.sellingPrice}!</span>
                        </div>
                        <div className={styles.tooltipArrow} />
                      </div>
                    )}
                  </div>
                  <span className={styles.marketSave}>
                    Save ₹{product.marketPrice - product.sellingPrice}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className={styles.description}>{product.description}</p>

          {product.tags?.length > 0 && (
            <div className={styles.tags}>
              {product.tags.map(tag => <span key={tag} className={styles.tag}>#{tag}</span>)}
            </div>
          )}

          <div className={styles.addSection}>
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Qty:</span>
              <div className={styles.qtyControls}>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={13} /></button>
                <span className={styles.qty}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity(q => q + 1)}><Plus size={13} /></button>
              </div>
              <span className={styles.qtyTotal}>= ₹{(product.sellingPrice * quantity).toFixed(0)}</span>
            </div>
            <div className={styles.actionRow}>
              <button className={`btn btn-primary btn-lg ${styles.addBtn}`} onClick={handleAdd}>
                <ShoppingCart size={17} />
                {product.inStock ? 'Add to Cart' : 'Add to Cart (OOS)'}
              </button>
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer" className={`btn btn-lg ${styles.waBtn}`}>
                  <MessageCircle size={17} />
                  Order on WhatsApp
                </a>
              )}
            </div>
            {!product.inStock && (
              <p className={styles.oosNote}>This item may be out of stock — the seller can still fulfil it.</p>
            )}
          </div>

          {product.adminNotes && (
            <div className="admin-notes" style={{ marginTop: 24 }}>
              <div className="admin-notes-label">
                <Star size={11} fill="currentColor" /> {"Seller's Notes"}
              </div>
              <div className="admin-notes-text">{product.adminNotes}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
