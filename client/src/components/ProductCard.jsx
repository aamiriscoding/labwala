import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Pin, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShopConfig } from '../context/ShopConfigContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, sellerMode = false, backRoute = '/products' }) {
  const { addToCart } = useCart();
  const { buildWhatsAppLink } = useShopConfig() || {};
  const [priceHover, setPriceHover] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const waMessage = `Hi! I'd like to order:\n*${product.name}* (ID: ${product.productId || ''})\n₹${product.sellingPrice}\n\nQty: 1`;
  const waLink = !sellerMode ? buildWhatsAppLink?.(waMessage) : null;

  const getStockBadge = () => {
    if (sellerMode) {
      const s = product.stock ?? 0;
      if (s === 0) return { label: 'Out of Stock', cls: 'badge-danger' };
      if (s <= 5)  return { label: `${s} left`, cls: 'badge-warning' };
      return { label: `${s} in stock`, cls: 'badge-success' };
    }
    if (!product.inStock) {
      const label = product.outOfStockLabel === 'available_on_order' ? 'Available on Order'
                  : product.outOfStockLabel === 'restocking_soon'   ? 'Restocking Soon'
                  : product.outOfStockLabel                          ? product.outOfStockLabel
                  : 'Out of Stock';
      const cls = (product.outOfStockLabel && product.outOfStockLabel !== '') ? 'badge-warning' : 'badge-danger';
      return { label, cls };
    }
    return { label: 'In Stock', cls: 'badge-success' };
  };

  const soldLabel = product.totalSold > 0 ? `${product.totalSold} sold` : null;
  const { label, cls } = getStockBadge();
  const stockPillClass = cls === 'badge-success' ? 'stockOk' : cls === 'badge-warning' ? 'stockWarn' : 'stockDanger';
  const image = product.images?.[0];
  const hasMarketPrice = product.marketPrice && product.marketPrice > product.sellingPrice;

  return (
    <Link to={`/product/${product.productId || product._id}`} state={{ from: backRoute }} className={`card ${styles.card} ${product.isPinned ? styles.pinned : ''}`}>
      {product.isPinned && (
        <div className={styles.pinnedBadge} title="Pinned by seller"><Pin size={10} /></div>
      )}
      {product.adminNotes && (
        <div className={styles.notesIndicator} title="Seller has notes for this product">✦</div>
      )}

      {/* Image */}
      <div className={styles.imageWrap}>
        {image
          ? <img src={image} alt={product.name} className={styles.image} />
          : <div className={styles.imagePlaceholder}><Package size={36} /></div>}
        <div className={styles.imagePills}>
          <span className={`${styles.overlayBadge} ${styles[stockPillClass]}`}>{label}</span>
          {soldLabel && <span className={`${styles.overlayBadge} ${styles.soldPill}`}>{soldLabel}</span>}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>

        <div className={styles.footer}>
          {/* Price block */}
          <div className={styles.priceBlock}>
            <div className={`price ${styles.price}`}>₹{product.sellingPrice}</div>
            {hasMarketPrice && (
              <div
                className={styles.marketPriceWrap}
                onMouseEnter={() => setPriceHover(true)}
                onMouseLeave={() => setPriceHover(false)}
              >
                <span className={styles.marketStrike}>₹{product.marketPrice}</span>
                {/* Proper UI tooltip */}
                {priceHover && (
                  <div className={styles.marketTooltip}>
                    <div className={styles.tooltipArrow} />
                    <div className={styles.tooltipContent}>
                      <span className={styles.tooltipLabel}>Price in local stores</span>
                      <span className={styles.tooltipSave}>You save ₹{product.marketPrice - product.sellingPrice}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.actionBtns}>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className={styles.waBtn}
                aria-label="Order on WhatsApp"
                title="Order on WhatsApp"
                onClick={e => e.stopPropagation()}
              >
                <MessageCircle size={16} />
              </a>
            )}
            <button className={styles.addBtn} onClick={handleAdd} aria-label="Add to cart">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
