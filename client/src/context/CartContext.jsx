import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
const CART_KEY = 'labwala-cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Allow adding OOS items — no stock cap enforced
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item._id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  // Total for ALL items
  const cartTotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  // Total for in-stock items only
  const cartTotalInStock = cart.reduce((sum, item) => {
    const inStock = item.inStock !== false;
    return inStock ? sum + item.sellingPrice * item.quantity : sum;
  }, 0);
  // Total at local store (market) prices for savings display
  const cartMarketTotal = cart.reduce((sum, item) => {
    const mp = item.marketPrice && item.marketPrice > item.sellingPrice ? item.marketPrice : item.sellingPrice;
    return sum + mp * item.quantity;
  }, 0);
  const cartSavings = cartMarketTotal - cartTotal;
  const hasMarketSavings = cartSavings > 0;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasOosItems = cart.some(item => item.inStock === false);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartTotalInStock, cartMarketTotal, cartSavings, hasMarketSavings,
      cartCount, hasOosItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
