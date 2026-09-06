import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${danger ? styles.iconDanger : styles.iconPrimary}`}>
            <AlertTriangle size={20} />
          </div>
          <button className={styles.closeBtn} onClick={onCancel}><X size={15} /></button>
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{title || 'Are you sure?'}</h3>
          <p className={styles.message}>{message || 'This action cannot be undone.'}</p>
        </div>
        <div className={styles.footer}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
