import { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle, HelpCircle, Send } from 'lucide-react';
import api from '../api/axios';
import styles from './QnAPage.module.css';

export default function QnAPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/qna'),
      api.get('/admin/config/public'),
    ]).then(([qnaRes, configRes]) => {
      setItems(qnaRes.data);
      setConfig(configRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.badge}><HelpCircle size={13} /> FAQ</div>
          <h1 className={styles.title}>
            Frequently Asked<br />
            <span className={styles.accent}>Questions</span>
          </h1>
          <p className={styles.sub}>
            {"Everything you need to know. Can't find your answer? Reach out directly."}
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 80 }}>
        {loading ? (
          <div className={styles.skeletons}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skeletonItem}`} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <HelpCircle size={48} />
            <p style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 14 }}>No FAQs yet</p>
            <p style={{ marginTop: 8, fontSize: 13 }}>Check back soon or ask directly</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className={styles.category}>
              {Object.keys(grouped).length > 1 && (
                <h2 className={styles.categoryTitle}>{category}</h2>
              )}
              <div className={styles.accordion}>
                {categoryItems.map(item => (
                  <div key={item._id}
                    className={`${styles.accordionItem} ${openId === item._id ? styles.accordionOpen : ''}`}>
                    <button className={styles.question}
                      onClick={() => setOpenId(openId === item._id ? null : item._id)}>
                      <span>{item.question}</span>
                      <ChevronDown size={18} className={styles.chevron} />
                    </button>
                    <div className={styles.answerWrap}>
                      <div className={styles.answer}>{item.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Contact cards — WhatsApp and Telegram separately */}
        <div className={styles.contactSection}>
          <h3 className={styles.contactHeading}>{"Still have questions?"}</h3>
          <div className={styles.contactCards}>
            {config?.whatsappNumber && (
              <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noreferrer"
                className={styles.contactCard}>
                <div className={`${styles.contactCardIcon} ${styles.whatsappIcon}`}>
                  <MessageCircle size={24} />
                </div>
                <div className={styles.contactCardBody}>
                  <div className={styles.contactCardTitle}>Ask on WhatsApp</div>
                  <div className={styles.contactCardSub}>{"Get a reply within a few hours"}</div>
                </div>
                <div className={styles.contactCardArrow}>→</div>
              </a>
            )}
            {config?.telegramLink && (
              <a href={config.telegramLink} target="_blank" rel="noreferrer"
                className={styles.contactCard}>
                <div className={`${styles.contactCardIcon} ${styles.telegramIcon}`}>
                  <Send size={24} />
                </div>
                <div className={styles.contactCardBody}>
                  <div className={styles.contactCardTitle}>Join Telegram Group</div>
                  <div className={styles.contactCardSub}>{"Community help & announcements"}</div>
                </div>
                <div className={styles.contactCardArrow}>→</div>
              </a>
            )}
            {!config?.whatsappNumber && !config?.telegramLink && (
              <div className={styles.contactCard} style={{ opacity: 0.5 }}>
                <div className={styles.contactCardBody}>
                  <div className={styles.contactCardTitle}>Contact details coming soon</div>
                  <div className={styles.contactCardSub}>{"Set WhatsApp/Telegram in admin settings"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
