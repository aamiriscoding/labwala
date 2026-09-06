import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const ShopConfigContext = createContext();

export function ShopConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get('/admin/config/public')
      .then(res => setConfig(res.data))
      .catch(() => setConfig(null));
  }, []);

  const whatsappNumber = config?.whatsappNumber?.replace(/[^\d]/g, '') || '';

  // Builds a wa.me link with a prefilled, URL-encoded message. Returns null
  // if no WhatsApp number has been configured by the seller yet.
  const buildWhatsAppLink = (message) => {
    if (!whatsappNumber) return null;
    return `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  };

  return (
    <ShopConfigContext.Provider value={{ config, whatsappNumber, buildWhatsAppLink }}>
      {children}
    </ShopConfigContext.Provider>
  );
}

export const useShopConfig = () => useContext(ShopConfigContext);
