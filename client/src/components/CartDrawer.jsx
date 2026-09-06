import { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart, AlertTriangle, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShopConfig } from '../context/ShopConfigContext';
import styles from './CartDrawer.module.css';

export default function CartDrawer({ open, onClose, sellerMode = false, onMarkSold, onReturn }) {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, cartTotalInStock, cartMarketTotal, cartSavings, hasMarketSavings, hasOosItems } = useCart();
  const { buildWhatsAppLink } = useShopConfig() || {};
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showSavings, setShowSavings] = useState(false);

  // Prevent the page behind the drawer from scrolling while it's open
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prevPosition = style.position;
    const prevTop = style.top;
    const prevWidth = style.width;
    const prevOverflow = style.overflow;

    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';
    style.overflow = 'hidden';

    return () => {
      style.position = prevPosition;
      style.top = prevTop;
      style.width = prevWidth;
      style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const displayTotal = inStockOnly ? cartTotalInStock : cartTotal;

  const buildCartWaMessage = () => {
    const lines = cart.map(item =>
      `• *${item.name}* (ID: ${item.productId || 'N/A'}) x${item.quantity} — ₹${(item.sellingPrice * item.quantity).toFixed(0)}`
    );
    return `Hi! I'd like to order:\n\n${lines.join('\n')}\n\nTotal: ₹${displayTotal.toFixed(0)}`;
  };
  const cartWaLink = cart.length > 0 ? buildWhatsAppLink?.(buildCartWaMessage()) : null;

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`} onClick={onClose} />
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShoppingCart size={18} />
            <span>Cart</span>
            {cart.length > 0 && <span className={styles.itemCount}>{cart.length} items</span>}
          </div>
          <div className={styles.headerActions}>
            {cart.length > 0 && (
              <button className="btn btn-sm btn-secondary" onClick={clearCart}>Clear</button>
            )}
            <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* OOS Warning */}
        {hasOosItems && (
          <div className={styles.oosWarning}>
            <AlertTriangle size={14} />
            <span>Some items may be out of stock. Confirm availability before checkout.</span>
          </div>
        )}

        {/* Items */}
        <div className={styles.items}>
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <p style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Cart is empty</p>
              <p style={{ marginTop: 8, fontSize: 13 }}>Browse products and add them here</p>
            </div>
          ) : (
            cart.map(item => {
              const oos = item.inStock === false;
              return (
                <div key={item._id} className={`${styles.item} ${oos ? styles.itemOos : ''}`}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemName}>
                      {item.name}
                      {oos && <span className={styles.itemOosTag}>Out of stock</span>}
                    </div>
                    <div className={styles.itemPrice}>₹{item.sellingPrice} each</div>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.qtyControls}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={12} /></button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={12} /></button>
                    </div>
                    <div className={`${styles.itemSubtotal} ${oos ? styles.itemSubtotalOos : ''}`}>
                      ₹{(item.sellingPrice * item.quantity).toFixed(0)}
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            {hasOosItems && (
              <label className={styles.inStockToggle}>
                <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
                <span>Show total for in-stock items only</span>
              </label>
            )}
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{inStockOnly ? 'In-stock Total' : 'Total'}</span>
              <span className={styles.totalRight}>
                {hasMarketSavings && !inStockOnly && (
                  <span
                    className={styles.marketStrikeWrap}
                    onMouseEnter={() => setShowSavings(true)}
                    onMouseLeave={() => setShowSavings(false)}
                    onTouchStart={() => setShowSavings(v => !v)}
                  >
                    <span className={styles.marketTotalStrike}>₹{cartMarketTotal.toFixed(0)}</span>
                    {showSavings && (
                      <div className={styles.savingsTooltip}>
                        <span className={styles.tooltipLabel}>Local store price</span>
                        <span className={styles.tooltipSave}>You save ₹{cartSavings.toFixed(0)}!</span>
                      </div>
                    )}
                  </span>
                )}
                <span className={styles.totalAmount}>₹{displayTotal.toFixed(2)}</span>
              </span>
            </div>
            {sellerMode ? (
              <div className={styles.sellerActions}>
                <button className={`btn btn-success btn-lg ${styles.actionBtn}`} onClick={onMarkSold}>
                  ✓ Mark as Sold
                </button>
                <button className={`btn btn-secondary ${styles.returnBtn}`} onClick={onReturn}>
                  ↩ Return Items
                </button>
              </div>
            ) : (
              <div className={styles.customerNote}>
                {cartWaLink && (
                  <a href={cartWaLink} target="_blank" rel="noreferrer" className={`btn btn-lg ${styles.waOrderBtn}`}>
                    <MessageCircle size={17} />
                    Order via WhatsApp
                  </a>
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Visit us in the hostel to pay & collect
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
