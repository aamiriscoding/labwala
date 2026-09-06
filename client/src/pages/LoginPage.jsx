import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const defaultRole = location.state?.role || 'seller';
  const [role, setRole] = useState(defaultRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Enter username and password'); return; }
    setLoading(true);
    try {
      await login(username, password, role);
      toast.success('Logged in!');
      navigate(role === 'admin' ? '/admin' : '/sell');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <Zap size={20} />
          <span>Lab<span className={styles.accent}>Wala</span></span>
        </div>
        <div className={styles.lockIcon}><Lock size={22} /></div>
        <h1 className={styles.title}>{role === 'admin' ? 'Admin Access' : 'Seller Login'}</h1>
        <p className={styles.sub}>
          {role === 'admin'
            ? 'Full access to analytics and product management'
            : "Mark sales and view today's summary"}
        </p>
        <div className={styles.roleToggle}>
          <button type="button" className={`${styles.roleBtn} ${role === 'seller' ? styles.roleBtnActive : ''}`} onClick={() => setRole('seller')}>Seller</button>
          <button type="button" className={`${styles.roleBtn} ${role === 'admin' ? styles.roleBtnActive : ''}`} onClick={() => setRole('admin')}>Admin</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" autoFocus />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passWrap}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Logging in...' : `Login as ${role === 'admin' ? 'Admin' : 'Seller'}`}
          </button>
        </form>
        <p className={styles.hint}>Access via /sell or /admin in the address bar.</p>
      </div>
    </div>
  );
}
