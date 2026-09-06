import { MessageCircle } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';
import styles from './WhatsAppFloatButton.module.css';

export default function WhatsAppFloatButton() {
  const { buildWhatsAppLink } = useShopConfig() || {};
  const link = buildWhatsAppLink?.("Hi! I'd like to ask about a product / place an order.");

  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={styles.fab}
      aria-label="Chat on WhatsApp"
      title="Chat / order on WhatsApp"
    >
      <MessageCircle size={24} fill="currentColor" />
    </a>
  );
}
