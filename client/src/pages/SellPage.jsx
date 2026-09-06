import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogOut, CheckCircle, Sun, Moon, RotateCcw, X, Plus, Minus, Search, ShoppingCart, Trash2, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import styles from './SellPage.module.css';

export default function SellPage() {
  const { user, logout, loading } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [todaySummary, setTodaySummary] = useState(null);
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returning, setReturning] = useState(false);
  const [selling, setSelling] = useState(false);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // Mark as Sold modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellNote, setSellNote] = useState('');
  const [sellAmountPaid, setSellAmountPaid] = useState('');
  // Return modal note state
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { state: { role: 'seller' } });
    if (!loading && user && user.role !== 'seller' && user.role !== 'admin') navigate('/login', { state: { role: 'seller' } });
  }, [user, loading, navigate]);

  const fetchProducts = useCallback(async () => {
    setLoadingProds(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/sell/products', { params });
      setProducts(res.data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoadingProds(false); }
  }, [search]);

  const fetchToday = useCallback(async () => {
    try { const res = await api.get('/sell/today'); setTodaySummary(res.data); } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (user) fetchToday(); }, [user, fetchToday]);

  const handleMarkSold = () => {
    if (!cart.length) { toast.error('Cart is empty'); return; }
    setSellAmountPaid(cartTotal.toFixed(0));
    setSellNote('');
    setSellModalOpen(true);
  };

  const confirmSell = async () => {
    setSelling(true);
    try {
      const items = cart.map(item => ({ productId: item._id, quantity: item.quantity }));
      await api.post('/sell/mark-sold', { items, note: sellNote, amountPaid: sellAmountPaid });
      toast.success('Sale recorded!');
      clearCart(); fetchProducts(); fetchToday();
      setSellModalOpen(false); setCartOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSelling(false); }
  };

  const handleReturn = async () => {
    if (!cart.length) { toast.error('Cart is empty'); return; }
    setReturning(true);
    try {
      const items = cart.map(item => ({ productId: item._id, quantity: item.quantity }));
      await api.post('/sell/return', { items, note: returnNote });
      toast.success('Return recorded!');
      clearCart(); fetchProducts(); fetchToday();
      setReturnConfirm(false); setReturnNote(''); setCartOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Return failed'); }
    finally { setReturning(false); }
  };

  const getStockBadge = (p) => {
    const s = p.stock ?? 0;
    if (s === 0) return { label: 'OOS', cls: styles.badgeDanger };
    if (s <= 5)  return { label: `${s}`, cls: styles.badgeWarning };
    return { label: `${s}`, cls: styles.badgeSuccess };
  };

  if (loading || !user) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-mono)', color:'var(--color-text-muted)', fontSize:13 }}>
      Authenticating...
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--color-primary)'}}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Lab<span className={styles.logoAccent}>Wala</span></span>
            <span className={styles.sellerBadge}>SELLER</span>
          </div>

          {/* Desktop search */}
          <div className={styles.navSearch}>
            <Search size={13} className={styles.navSearchIcon} />
            <input type="text" placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={styles.navSearchInput} />
            {search && <button onClick={() => setSearch('')} className={styles.navSearchClear}><X size={12} /></button>}
          </div>

          <div className={styles.navActions}>
            <button className={styles.iconBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Mobile cart toggle */}
            <button className={`${styles.iconBtn} ${styles.mobileCartBtn}`} onClick={() => setCartOpen(v => !v)}>
              <ShoppingCart size={15} />
              {cart.length > 0 && <span className={styles.cartDot}>{cart.length}</span>}
            </button>
            <button className={styles.iconBtn} onClick={() => { logout(); navigate('/'); }} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Mobile search bar below navbar */}
        <div className={styles.mobileSearchBar}>
          <Search size={13} />
          <input type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </nav>

      {/* ── Mark as Sold Modal ── */}
      {sellModalOpen && (
        <div className={styles.sellModalOverlay} onClick={() => !selling && setSellModalOpen(false)}>
          <div className={styles.sellModal} onClick={e => e.stopPropagation()}>
            <div className={styles.sellModalHeader}>
              <span className={styles.sellModalTitle}><CheckCircle size={15}/> Confirm Sale</span>
              <button className={styles.sellModalClose} onClick={() => setSellModalOpen(false)}><X size={14}/></button>
            </div>
            <div className={styles.sellModalBody}>
              <div className={styles.sellModalItems}>
                {cart.map(item => (
                  <div key={item._id} className={styles.sellModalItem}>
                    <span>{item.name}</span>
                    <span className={styles.sellModalItemRight}>×{item.quantity} · ₹{(item.sellingPrice * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.sellModalField}>
                <label className={styles.sellModalLabel}>Amount Paid (₹)</label>
                <input
                  type="number"
                  className={styles.sellModalInput}
                  value={sellAmountPaid}
                  onChange={e => setSellAmountPaid(e.target.value)}
                  placeholder={cartTotal.toFixed(0)}
                />
                {sellAmountPaid && Number(sellAmountPaid) !== cartTotal && (
                  <div className={styles.sellModalDiff}>
                    {Number(sellAmountPaid) > cartTotal
                      ? <span className={styles.sellModalExtra}>+₹{(Number(sellAmountPaid) - cartTotal).toFixed(0)} extra paid</span>
                      : <span className={styles.sellModalDiscount}>₹{(cartTotal - Number(sellAmountPaid)).toFixed(0)} discount given</span>
                    }
                  </div>
                )}
              </div>
              <div className={styles.sellModalField}>
                <label className={styles.sellModalLabel}>Notes (optional)</label>
                <textarea
                  className={styles.sellModalTextarea}
                  value={sellNote}
                  onChange={e => setSellNote(e.target.value)}
                  placeholder="Customer name, remarks, etc."
                  rows={2}
                />
              </div>
            </div>
            <div className={styles.sellModalFooter}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSellModalOpen(false)}>Cancel</button>
              <button className="btn btn-success btn-sm" onClick={confirmSell} disabled={selling}>
                <CheckCircle size={13}/> {selling ? 'Recording...' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Modal ── */}
      {returnConfirm && (
        <div className={styles.sellModalOverlay} onClick={() => !returning && setReturnConfirm(false)}>
          <div className={styles.sellModal} onClick={e => e.stopPropagation()}>
            <div className={styles.sellModalHeader}>
              <span className={styles.sellModalTitle}><RotateCcw size={15}/> Confirm Return</span>
              <button className={styles.sellModalClose} onClick={() => setReturnConfirm(false)}><X size={14}/></button>
            </div>
            <div className={styles.sellModalBody}>
              <p className={styles.sellModalNote}>Stock will be restored and sales decremented for {cart.length} item(s).</p>
              <div className={styles.sellModalItems}>
                {cart.map(item => (
                  <div key={item._id} className={styles.sellModalItem}>
                    <span>{item.name}</span>
                    <span className={styles.sellModalItemRight}>×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className={styles.sellModalField}>
                <label className={styles.sellModalLabel}>Reason / Notes (optional)</label>
                <textarea
                  className={styles.sellModalTextarea}
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="Reason for return..."
                  rows={2}
                />
              </div>
            </div>
            <div className={styles.sellModalFooter}>
              <button className="btn btn-secondary btn-sm" onClick={() => setReturnConfirm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleReturn} disabled={returning}>
                <RotateCcw size={13}/> {returning ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Split Layout ── */}
      <div className={styles.splitLayout}>
        {/* LEFT — product table */}
        <div className={styles.leftPanel}>
          {loadingProds ? (
            <div className={styles.loadingState}>Loading products...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const cartItem = cart.find(c => c._id === p._id);
                  return (
                    <tr key={p._id} className={p.isPinned ? styles.pinnedRow : ''}>
                      <td>
                        <div className={styles.productCell}>
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className={styles.productImg} />
                            : <div className={styles.productImgPlaceholder}>⚡</div>}
                          <div>
                            <div className={styles.productName}>
                              {p.isPinned && '📌 '}{p.name}
                            </div>
                            {p.adminNotes && <div className={styles.hasNotes}>✦ notes</div>}
                          </div>
                        </div>
                      </td>
                      <td className={styles.cellPrice}>₹{p.sellingPrice}</td>
                      <td className={styles.actionCell}>
                        {cartItem ? (
                          <div className={styles.qtyControls}>
                            <button className={styles.qtyBtn} onClick={() => updateQuantity(p._id, cartItem.quantity - 1)}><Minus size={11} /></button>
                            <span className={styles.qtyNum}>{cartItem.quantity}</span>
                            <button className={styles.qtyBtn} onClick={() => updateQuantity(p._id, cartItem.quantity + 1)}><Plus size={11} /></button>
                          </div>
                        ) : (
                          <div className={styles.addBtnWrap}>
                            <button className={styles.addBtn} onClick={() => { addToCart(p, 1); toast.success(`Added`); }}>
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT — persistent cart (desktop) / slide-in drawer (mobile) */}
        {cartOpen && <div className={styles.cartOverlayActive} onClick={() => setCartOpen(false)} />}
        <div className={`${styles.rightPanel} ${cartOpen ? styles.rightPanelOpen : ''}`}>

          <div className={styles.cartInner}>
            <div className={styles.cartHeader}>
              <div className={styles.cartTitle}><ShoppingCart size={15} /> Cart
                {cart.length > 0 && <span className={styles.cartCount}>{cart.length}</span>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {cart.length > 0 && <button className={styles.clearBtn} onClick={clearCart}>Clear</button>}
                <button className={`${styles.clearBtn} ${styles.mobileCloseCart}`} onClick={() => setCartOpen(false)}><X size={14} /></button>
              </div>
            </div>

            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>
                  <ShoppingCart size={30} /><p>Add products from the table</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className={styles.cartItem}>
                    <div className={styles.cartItemName}>{item.name}</div>
                    <div className={styles.cartItemRow}>
                      <div className={styles.qtyControls}>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={10} /></button>
                        <span className={styles.qtyNum}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={10} /></button>
                      </div>
                      <span className={styles.cartItemSubtotal}>₹{(item.sellingPrice * item.quantity).toFixed(0)}</span>
                      <button className={styles.removeBtn} onClick={() => removeFromCart(item._id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Fixed bottom actions */}
            <div className={styles.cartFooter}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalAmount}>₹{cartTotal.toFixed(0)}</span>
              </div>
              <button className={`btn btn-success ${styles.soldBtn}`} onClick={handleMarkSold} disabled={selling || !cart.length}>
                <CheckCircle size={14} /> {selling ? 'Recording...' : 'Mark as Sold'}
              </button>
              <button className={`btn btn-secondary ${styles.returnBtn}`} onClick={() => setReturnConfirm(true)} disabled={!cart.length}>
                <RotateCcw size={12} /> Return Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
