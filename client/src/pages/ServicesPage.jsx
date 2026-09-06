import { useState, useEffect } from 'react';
import { Zap, Cpu, Wrench, Lightbulb, Code, MessageCircle, Package, Settings, BarChart2, Shield, Clock, Star, IndianRupee, Wifi, Battery, Layers, BookOpen, HelpCircle, CheckCircle, Award, Truck, Heart } from 'lucide-react';
import api from '../api/axios';
import styles from './ServicesPage.module.css';

const ICON_MAP = { Zap, Cpu, Wrench, Lightbulb, Code, MessageCircle, Package, Settings, BarChart2, Shield, Clock, Star, IndianRupee, Wifi, Battery, Layers, BookOpen, HelpCircle, CheckCircle, Award, Truck, Heart };

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/config/public')
      .then(r => {
        setConfig(r.data);
        setServices(r.data.services || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.badge}><Wrench size={13} /> Services</div>
          <h1 className={styles.title}>
            More than just<br />
            <span className={styles.accent}>selling parts</span>
          </h1>
          <p className={styles.sub}>
            {"I don't just sell components — I can help you build with them too. Soldering, programming, design, consultation. All from the hostel."}
          </p>
        </div>
        <div className={styles.heroGrid} />
      </section>

      <div className="container">
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {services.map((service, i) => {
              const IconComp = ICON_MAP[service.icon] || Wrench;
              return (
                <div key={service.id || i} className={`card ${styles.card}`}>
                  <div className={styles.iconWrap}><IconComp size={26} /></div>
                  <h2 className={styles.serviceName}>{service.title}</h2>
                  <p className={styles.serviceDesc}>{service.description}</p>
                  {service.tags?.length > 0 && (
                    <div className={styles.tags}>
                      {service.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.footer}>
                    <div className={styles.price}>{service.price}</div>
                    <div className={styles.turnaround}>{service.turnaround}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.cta}>
          <div className={styles.ctaInner}>
            <h3 className={styles.ctaTitle}>{"Ready to get started?"}</h3>
            <p className={styles.ctaSub}>
              {config?.location ? 'Find me at ' + config.location + ' or drop a message.' : 'Find me in Hostel Room 204 or drop a message.'}
            </p>
            <div className={styles.ctaButtons}>
              {config?.whatsappNumber ? (
                <a href={`https://wa.me/${config.whatsappNumber}`} className="btn btn-primary btn-lg" target="_blank" rel="noreferrer">
                  <MessageCircle size={18} /> WhatsApp Me
                </a>
              ) : (
                <a href="https://wa.me/" className="btn btn-primary btn-lg" target="_blank" rel="noreferrer">
                  <MessageCircle size={18} /> WhatsApp Me
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
