import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Zap, Shield, Wrench, Clock, Cpu, Code, Lightbulb, MessageCircle, Package, Settings, BarChart2, Star, IndianRupee, Wifi, Battery, Layers, BookOpen, HelpCircle, CheckCircle, Award, Truck, Heart } from 'lucide-react';
import api from '../api/axios';
import styles from './HomePage.module.css';

const ICON_MAP = { Zap, Shield, Wrench, Clock, Cpu, Code, Lightbulb, MessageCircle, Package, Settings, BarChart2, Star, IndianRupee, Wifi, Battery, Layers, BookOpen, HelpCircle, CheckCircle, Award, Truck, Heart };

function getShopStatus(schedule) {
  if (!schedule?.length) return { open: false, label: 'Closed' };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const today = schedule.find(s => s.day === todayName);
  if (!today?.isOpen) return { open: false, label: 'Closed today' };
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [oH, oM] = today.openTime.split(':').map(Number);
  const [cH, cM] = today.closeTime.split(':').map(Number);
  const openMins = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  if (nowMins >= openMins && nowMins < closeMins) return { open: true, label: `Open · Closes ${today.closeTime}` };
  if (nowMins < openMins) return { open: false, label: `Opens at ${today.openTime}` };
  return { open: false, label: 'Closed for today' };
}

export default function HomePage() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get('/admin/config/public').then(r => setConfig(r.data)).catch(() => { });
  }, []);

  const shopStatus = config ? getShopStatus(config.schedule) : null;
  const stats = config?.homeStats?.filter(s => s.isVisible) || [
    { num: '50+', label: 'Products' },
    { num: '₹40+', label: 'From' },
    { num: 'Instant', label: 'Pickup' },
    { num: '100%', label: 'Genuine' },
  ];
  const features = config?.homeFeatures?.filter(f => f.isVisible).sort((a, b) => a.order - b.order) || [];

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroInner}`}>

          {/* Status badge */}
          <div className={styles.statusBadge}>
            <span className={`${styles.statusDot} ${shopStatus?.open ? styles.statusOpen : styles.statusClosed}`} />
            <span>{shopStatus ? shopStatus.label : 'LabWala'}</span>
            {config?.location && (
              <span className={styles.locationBadge}>
                <MapPin size={10} /> {config.location}
              </span>
            )}
          </div>

          <h1 className={styles.heroTitle}>
            Your campus<br />
            <span className={styles.heroAccent}>electronics</span><br />
            store
          </h1>

          <p className={styles.heroSub}>
            {config?.tagline || 'Arduinos, sensors, modules & components — ready to pick up. No shipping. No waiting. Just come grab it.'}
          </p>

          <div className={styles.heroActions}>
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now <ArrowRight size={17} />
            </Link>
            <Link to="/services" className="btn btn-secondary btn-lg">
              Our Services
            </Link>
          </div>

          {/* Stats row — inside hero so it's visible without scrolling */}
          {stats.length > 0 && (
            <div className={styles.stats}>
              {stats.map((s, i) => (
                <div key={i} className={styles.stat}>
                  <span className={styles.statNum}>{s.num}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature cards — why buy from us */}
      {features.length > 0 && (
        <section className={`container ${styles.features}`}>
          <h2 className={`section-title ${styles.sectionHeading}`}>Why buy from LabWala?</h2>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => {
              const IconComp = ICON_MAP[f.icon] || Zap;
              return (
                <div key={f.id || i} className={`card ${styles.featureCard}`}>
                  <div className={styles.featureIcon}><IconComp size={22} /></div>
                  <h3 className={styles.featureName}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={`container ${styles.ctaSection}`}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Have a question?</h2>
          <p className={styles.ctaSub}>Shop hours, sourcing, payments, and more — find answers in our FAQs.</p>
          <Link to="/faq" className="btn btn-primary btn-lg">
            View FAQs <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
