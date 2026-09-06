import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, BarChart2, Package, ShoppingBag, Settings, Sun, Moon,
  Plus, Edit2, Trash2, Save, X, Search, Pin, PinOff, RotateCcw,
  Clock, Wrench, Eye, EyeOff, HelpCircle, Download, ChevronUp, ChevronDown, Menu,
  Shield, Cpu, Code, Lightbulb, MessageCircle, Star, IndianRupee, Wifi, Battery,
  Layers, BookOpen, CheckCircle, Award, Truck, Heart, Copy, Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import styles from './AdminPage.module.css';

const CATEGORIES = ['Microcontrollers','Sensors','Modules','Components','Power','Display','Communication','Tools','Kits','Other'];
const ICONS = ['Zap','Cpu','Wrench','Lightbulb','Code','MessageCircle','Package','Settings','BarChart2','Shield','Clock','Star','IndianRupee','Wifi','Battery','Layers','BookOpen','HelpCircle','CheckCircle','Award','Truck','Heart'];
const ICON_MAP = { Zap, Cpu, Wrench, Lightbulb, Code, MessageCircle, Package, Settings, BarChart2, Shield, Clock, Star, IndianRupee, Wifi, Battery, Layers, BookOpen, HelpCircle, CheckCircle, Award, Truck, Heart };
const OOS_OPTIONS = [
  { value: '', label: 'Out of Stock (default)' },
  { value: 'available_on_order', label: 'Available on Order' },
  { value: 'restocking_soon', label: 'Restocking Soon' },
];
const EMPTY_PRODUCT = { name:'', description:'', category:'Microcontrollers', sellingPrice:0, costPrice:0, marketPrice:'', stock:0, totalSold:0, images:[], adminNotes:'', tags:'', isActive:true, isPinned:false, outOfStockLabel:'' };
const EMPTY_QNA = { question:'', answer:'', category:'General', order:0, isVisible:true };

export default function AdminPage() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const savesBtnRef = useRef(null);

  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState({ key: null, dir: null });
  const [loadingData, setLoadingData] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState(null);

  // Sales
  const [sales, setSales] = useState([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotalCount, setSalesTotalCount] = useState(0);
  const [salesPeriod, setSalesPeriod] = useState('');
  const [salesSortBy, setSalesSortBy] = useState('createdAt');
  const [salesSortDir, setSalesSortDir] = useState('desc');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const SALES_LIMIT = 50;

  // Config / Settings
  const [config, setConfig] = useState(null);

  // QnA
  const [qnaItems, setQnaItems] = useState([]);
  const [qnaModal, setQnaModal] = useState(false);
  const [editingQna, setEditingQna] = useState(null);
  const [qnaForm, setQnaForm] = useState(EMPTY_QNA);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Export
  const [exportType, setExportType] = useState('products');
  const [exportPeriod, setExportPeriod] = useState('');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  // Confirm modal state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirm({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirm({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/login', { state: { role: 'admin' } });
  }, [user, loading, navigate]);

  // ── Fetch functions ──────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    try { const r = await api.get('/admin/analytics'); setAnalytics(r.data); } catch {}
  }, []);

  const fetchChartData = useCallback(async (p) => {
    setLoadingChart(true);
    try { const r = await api.get('/admin/chart-data', { params: { period: p } }); setChartData(r.data); }
    catch {} finally { setLoadingChart(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingData(true);
    try {
      const params = productSearch ? { search: productSearch } : {};
      const r = await api.get('/admin/products', { params });
      setProducts(r.data);
    } catch {} finally { setLoadingData(false); }
  }, [productSearch]);

  const fetchSales = useCallback(async () => {
    setLoadingData(true);
    try {
      const r = await api.get('/admin/sales', { params: {
        page: salesPage, limit: SALES_LIMIT,
        sortBy: salesSortBy, sortDir: salesSortDir,
        period: salesPeriod, dateFrom: salesDateFrom, dateTo: salesDateTo,
      }});
      setSales(r.data.sales);
      setSalesTotalPages(r.data.pages);
      setSalesTotalCount(r.data.total);
    } catch {} finally { setLoadingData(false); }
  }, [salesPage, salesSortBy, salesSortDir, salesPeriod, salesDateFrom, salesDateTo]);

  const fetchConfig = useCallback(async () => {
    try { const r = await api.get('/admin/config'); setConfig(r.data); } catch {}
  }, []);

  const fetchQna = useCallback(async () => {
    try { const r = await api.get('/admin/qna'); setQnaItems(r.data); } catch {}
  }, []);

  useEffect(() => { if (user && tab === 'dashboard') { fetchAnalytics(); fetchChartData(period); } }, [user, tab]);
  useEffect(() => { if (user && tab === 'products') fetchProducts(); }, [user, tab, fetchProducts]);
  useEffect(() => { if (user && tab === 'sales') fetchSales(); }, [user, tab, fetchSales]);
  useEffect(() => { if (user && tab === 'settings') fetchConfig(); }, [user, tab, fetchConfig]);
  useEffect(() => { if (user && tab === 'qna') fetchQna(); }, [user, tab, fetchQna]);
  useEffect(() => { if (user && tab === 'dashboard') fetchChartData(period); }, [period]);

  const periodData = analytics ? (analytics[period] || analytics['today']) : null;

  // ── Product column sort ──────────────────────────────────────
  const handleProductSort = (key) => {
    setProductSort(prev => {
      if (prev.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return { key: null, dir: null };
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (!productSort.key || !productSort.dir) return 0;
    let aVal = a[productSort.key]; let bVal = b[productSort.key];
    if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
    if (aVal < bVal) return productSort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return productSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }) => {
    if (productSort.key !== col) return <ChevronUp size={11} style={{ opacity: 0.2 }} />;
    return productSort.dir === 'asc'
      ? <ChevronUp size={11} style={{ color: 'var(--color-primary)' }} />
      : <ChevronDown size={11} style={{ color: 'var(--color-primary)' }} />;
  };

  // ── Product CRUD ─────────────────────────────────────────────
  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_PRODUCT); setImageInput(''); setTagInput(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : '', marketPrice: p.marketPrice || '', outOfStockLabel: p.outOfStockLabel || '' });
    setImageInput(''); setTagInput(''); setModalOpen(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const existing = form.tags ? form.tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    if (!existing.includes(t)) setForm(f => ({ ...f, tags: [...existing, t].join(', ') }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    const existing = form.tags ? form.tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    setForm(f => ({ ...f, tags: existing.filter(t => t !== tag).join(', ') }));
  };

  const handleSave = async () => {
    if (!form.name || !form.sellingPrice) { toast.error('Name and selling price required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        marketPrice: form.marketPrice ? Number(form.marketPrice) : null,
        sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice),
        stock: Number(form.stock), totalSold: Number(form.totalSold),
      };
      if (editingProduct) { await api.put(`/admin/products/${editingProduct._id}`, payload); toast.success('Updated!'); }
      else { await api.post('/admin/products', payload); toast.success('Created!'); }
      setModalOpen(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (p) => {
    openConfirm(
      `Permanently delete "${p.name}"?`,
      'This will remove the product and all its inventory data from the database forever. This cannot be undone.',
      async () => {
        try { await api.delete(`/admin/products/${p._id}/permanent`); toast.success('Permanently deleted'); fetchProducts(); closeConfirm(); }
        catch { toast.error('Failed'); closeConfirm(); }
      }
    );
  };

  const handleToggleVisibility = async (p) => {
    try {
      await api.put(`/admin/products/${p._id}`, { ...p, isActive: !p.isActive, tags: p.tags, marketPrice: p.marketPrice || null });
      toast.success(p.isActive ? 'Hidden from customers' : 'Now visible to customers');
      fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleTogglePin = async (p) => {
    try {
      await api.put(`/admin/products/${p._id}`, { ...p, isPinned: !p.isPinned, tags: p.tags, marketPrice: p.marketPrice || null });
      toast.success(p.isPinned ? 'Unpinned' : 'Pinned!'); fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleCopyProductId = (p) => {
    if (!p.productId) return;
    navigator.clipboard.writeText(p.productId).then(() => {
      setCopiedProductId(p._id);
      toast.success(`Copied ID ${p.productId}`);
      setTimeout(() => setCopiedProductId(null), 1200);
    });
  };

  const handleDeleteSale = (id) => {
    openConfirm(
      'Delete sale record?',
      'Stock will be restored and totalSold decremented. This cannot be undone.',
      async () => {
        try { await api.delete(`/admin/sales/${id}`); toast.success('Deleted'); fetchSales(); fetchAnalytics(); closeConfirm(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); closeConfirm(); }
      }
    );
  };

  // ── Config ───────────────────────────────────────────────────
  const handleConfigSave = async () => {
    try { await api.put('/admin/config', config); toast.success('Settings saved!'); }
    catch { toast.error('Failed'); }
  };
  const updateSchedule = (idx, field, val) => setConfig(prev => { const s = [...prev.schedule]; s[idx] = {...s[idx],[field]:val}; return {...prev, schedule:s}; });
  const updateService = (idx, field, val) => setConfig(prev => { const s = [...prev.services]; s[idx] = {...s[idx],[field]:val}; return {...prev, services:s}; });
  const addService = () => setConfig(prev => ({ ...prev, services: [...prev.services, { id:`svc_${Date.now()}`, title:'New Service', description:'', price:'', turnaround:'', tags:[], icon:'Wrench', isVisible:true, order:prev.services.length }] }));
  const removeService = (idx) => setConfig(prev => ({ ...prev, services: prev.services.filter((_,i) => i !== idx) }));

  // Per-service tag input state
  const [svcTagInputs, setSvcTagInputs] = useState({});
  const addSvcTag = (idx) => {
    const val = (svcTagInputs[idx] || '').trim();
    if (!val) return;
    const existing = config.services[idx].tags || [];
    if (!existing.includes(val)) updateService(idx, 'tags', [...existing, val]);
    setSvcTagInputs(s => ({ ...s, [idx]: '' }));
  };
  const removeSvcTag = (idx, tag) => {
    const existing = config.services[idx].tags || [];
    updateService(idx, 'tags', existing.filter(t => t !== tag));
  };

  const updateHomeFeature = (idx, field, val) => setConfig(prev => { const f = [...(prev.homeFeatures||[])]; f[idx] = {...f[idx],[field]:val}; return {...prev, homeFeatures:f}; });
  const addHomeFeature = () => setConfig(prev => ({ ...prev, homeFeatures: [...(prev.homeFeatures||[]), { id:`feat_${Date.now()}`, icon:'Zap', title:'New Feature', description:'', isVisible:true, order:(prev.homeFeatures||[]).length }] }));
  const removeHomeFeature = (idx) => setConfig(prev => ({ ...prev, homeFeatures: (prev.homeFeatures||[]).filter((_,i) => i !== idx) }));

  const updateHomeStat = (idx, field, val) => setConfig(prev => { const s = [...(prev.homeStats||[])]; s[idx] = {...s[idx],[field]:val}; return {...prev, homeStats:s}; });

  // ── QnA ──────────────────────────────────────────────────────
  const openAddQna = () => { setEditingQna(null); setQnaForm(EMPTY_QNA); setQnaModal(true); };
  const openEditQna = (item) => { setEditingQna(item); setQnaForm({...item}); setQnaModal(true); };
  const handleSaveQna = async () => {
    if (!qnaForm.question || !qnaForm.answer) { toast.error('Question and answer required'); return; }
    try {
      if (editingQna) { await api.put(`/admin/qna/${editingQna._id}`, qnaForm); toast.success('Updated!'); }
      else { await api.post('/admin/qna', qnaForm); toast.success('Added!'); }
      setQnaModal(false); fetchQna();
    } catch { toast.error('Save failed'); }
  };
  const handleDeleteQna = (id) => {
    openConfirm('Delete Q&A?', 'This question will be removed from the public FAQ.', async () => {
      try { await api.delete(`/admin/qna/${id}`); toast.success('Deleted'); fetchQna(); closeConfirm(); }
      catch { toast.error('Failed'); closeConfirm(); }
    });
  };

  // ── Export ───────────────────────────────────────────────────
  const handleExport = (format) => {
    const params = new URLSearchParams({ type: exportType, format });
    if (exportType === 'sales') {
      if (exportPeriod) params.set('period', exportPeriod);
      if (exportDateFrom) params.set('dateFrom', exportDateFrom);
      if (exportDateTo) params.set('dateTo', exportDateTo);
    }
    const token = localStorage.getItem('labwala-token');
    fetch(`/api/admin/export?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${exportType}_export.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Downloading ${format.toUpperCase()}...`);
      })
      .catch(() => toast.error('Export failed'));
  };

  const navItems = [
    { id:'dashboard', icon:<BarChart2 size={15}/>, label:'Dashboard' },
    { id:'products',  icon:<Package size={15}/>,  label:'Products' },
    { id:'sales',     icon:<ShoppingBag size={15}/>, label:'Sales' },
    { id:'qna',       icon:<HelpCircle size={15}/>, label:'Q&A' },
    { id:'export',    icon:<Download size={15}/>,   label:'Export' },
    { id:'settings',  icon:<Settings size={15}/>,   label:'Settings' },
  ];

  const switchTab = (id) => { setTab(id); setSidebarOpen(false); };

  if (loading || !user) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-mono)', color:'var(--color-text-muted)', fontSize:13 }}>
      Authenticating...
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Delete"
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--color-primary)'}}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Lab<span style={{color:'var(--color-primary)'}}>Wala</span></span>
          <span className={styles.adminBadge}>ADMIN</span>
        </div>

        {navItems.map(item => (
          <button key={item.id}
            className={`${styles.sideNavItem} ${tab === item.id ? styles.sideNavActive : ''}`}
            onClick={() => switchTab(item.id)}>
            {item.icon} {item.label}
          </button>
        ))}

        <div className={styles.sidebarFooter}>
          <button className={styles.themeBtn} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
            {theme === 'dark' ? ' Light' : ' Dark'}
          </button>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={13}/> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(v => !v)}>
            <Menu size={18} />
          </button>
          <span className={styles.mobileTabTitle}>{navItems.find(n => n.id === tab)?.label || 'Admin'}</span>
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Dashboard</h1>
              <div className={styles.periodTabs}>
                {['today','week','month','allTime'].map(p => (
                  <button key={p}
                    className={`${styles.periodTab} ${period===p ? styles.periodTabActive : ''}`}
                    onClick={() => setPeriod(p)}>
                    {p === 'allTime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {analytics && periodData && (
              <>
                <div className={styles.statsGrid}>
                  {[
                    { label:'Revenue', val:`₹${(periodData.revenue||0).toFixed(0)}` },
                    { label:'Profit',  val:`₹${(periodData.profit||0).toFixed(0)}` },
                    { label:'Cost',    val:`₹${(periodData.cost||0).toFixed(0)}` },
                    { label:'Sales',   val: periodData.transactions||0 },
                  ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                      <div className={styles.statLabel}>{s.label}</div>
                      <div className={styles.statValue}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.bottomGrid}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}><BarChart2 size={13}/>
                      {period==='today' ? 'Hourly' : period==='week' ? 'Last 7 Days' : period==='month' ? 'This Month' : 'Last 12 Months'}
                    </div>
                    {loadingChart ? (
                      <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--color-text-muted)',fontFamily:'var(--font-mono)',fontSize:12}}>Loading...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="date" tick={{fontSize:10,fill:'var(--color-text-muted)'}}/>
                          <YAxis tick={{fontSize:10,fill:'var(--color-text-muted)'}}/>
                          <Tooltip contentStyle={{background:'var(--color-bg-card)',border:'1px solid var(--color-border)',borderRadius:8,fontSize:12}}/>
                          <Legend wrapperStyle={{fontSize:11}}/>
                          <Bar dataKey="revenue" fill="var(--color-primary)" name="Revenue" radius={[3,3,0,0]}/>
                          <Bar dataKey="profit"  fill="var(--color-success)" name="Profit"  radius={[3,3,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className={styles.sidePanel}>
                    <div className={styles.sidePanelCard}>
                      <div className={styles.sidePanelTitle}><BarChart2 size={12}/> Top Products</div>
                      {(analytics.topProducts||[]).map((p,i) => (
                        <div key={p._id} className={styles.topProductRow}>
                          <span className={styles.topProductRank}>#{i+1}</span>
                          <span className={styles.topProductName}>{p.name}</span>
                          <span className={styles.topProductSold}>{p.totalSold}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.inventoryCard}>
                      <div className={styles.sidePanelTitle}><Package size={12}/> Inventory</div>
                      <div className={styles.inventoryStats}>
                        <div className={styles.invStat}><span className={styles.invStatNum}>{analytics.inventory?.totalProducts}</span><span className={styles.invStatLabel}>Total</span></div>
                        <div className={styles.invStat}><span className={styles.invStatNum} style={{color:'var(--color-danger)'}}>{analytics.inventory?.outOfStock}</span><span className={styles.invStatLabel}>Out</span></div>
                        <div className={styles.invStat}><span className={styles.invStatNum} style={{color:'var(--color-warning)'}}>{analytics.inventory?.lowStock?.length}</span><span className={styles.invStatLabel}>Low</span></div>
                      </div>
                      {(analytics.inventory?.lowStock||[]).slice(0,4).map((item,i) => (
                        <div key={i} className={styles.lowStockRow}>
                          <span className={styles.lowStockName}>{item.name}</span>
                          <span className={styles.lowStockQty}>{item.stock} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Products</h1>
              <div className={styles.actionBtns}>
                <div className={styles.searchBox}>
                  <Search size={12}/>
                  <input placeholder="Search..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className={styles.searchInput}/>
                  {productSearch && <button onClick={() => setProductSearch('')} className={styles.searchClearBtn}><X size={11}/></button>}
                </div>
                <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13}/> Add</button>
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('name')}>Product <SortIcon col="name"/></button></th>
                    <th>ID</th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('category')}>Cat <SortIcon col="category"/></button></th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('sellingPrice')}>Sell ₹ <SortIcon col="sellingPrice"/></button></th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('costPrice')}>Cost ₹ <SortIcon col="costPrice"/></button></th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('stock')}>Stock <SortIcon col="stock"/></button></th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('totalSold')}>Sold <SortIcon col="totalSold"/></button></th>
                    <th><button className={styles.sortBtn} onClick={() => handleProductSort('isActive')}>Status <SortIcon col="isActive"/></button></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--color-text-muted)',fontFamily:'var(--font-mono)',fontSize:12}}>Loading...</td></tr>
                  ) : sortedProducts.map(p => (
                    <tr key={p._id} className={!p.isActive ? styles.inactiveRow : ''}>
                      <td>
                        <div className={styles.productCell}>
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className={styles.productImg}/> : <div className={styles.productImgPlaceholder}>📦</div>}
                          <div>
                            <div className={styles.productCellName}>{p.isPinned && '📌 '}{p.name}</div>
                            <div className={styles.productCategory}>{p.adminNotes ? '✦ ' : ''}{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.mono} style={{fontSize:11}}>
                        {p.productId ? (
                          <button
                            onClick={() => handleCopyProductId(p)}
                            title="Copy product ID"
                            style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',color:'inherit',font:'inherit',padding:0}}
                          >
                            {copiedProductId === p._id ? <Check size={11}/> : <Copy size={11}/>} {p.productId}
                          </button>
                        ) : '—'}
                      </td>
                      <td className={styles.mono} style={{fontSize:11}}>{p.category}</td>
                      <td className={styles.mono}>₹{p.sellingPrice}</td>
                      <td className={styles.mono}>₹{p.costPrice}</td>
                      <td className={styles.mono}>{p.stock}</td>
                      <td className={styles.mono}>{p.totalSold}</td>
                      <td>{p.isActive ? <span className="badge badge-success" style={{fontSize:10}}>Active</span> : <span className={styles.inactiveBadge}>Hidden</span>}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.tableBtn} onClick={() => handleTogglePin(p)} title={p.isPinned?'Unpin':'Pin'}>{p.isPinned ? <PinOff size={11}/> : <Pin size={11}/>}</button>
                          <button className={styles.tableBtn} onClick={() => openEdit(p)} title="Edit"><Edit2 size={11}/></button>
                          <button
                            className={`${styles.tableBtn} ${p.isActive ? '' : styles.tableBtnMuted}`}
                            onClick={() => handleToggleVisibility(p)}
                            title={p.isActive ? 'Hide from customers' : 'Show to customers'}
                          >
                            {p.isActive ? <Eye size={11}/> : <EyeOff size={11}/>}
                          </button>
                          <button className={`${styles.tableBtn} ${styles.tableBtnDanger}`} onClick={() => handleDelete(p)} title="Permanently delete"><Trash2 size={11}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Sales {salesTotalCount > 0 && <span className={styles.salesCount}>{salesTotalCount}</span>}</h1>
            </div>
            <div className={styles.salesFilters}>
              <div className={styles.salesFilterGroup}>
                <label className={styles.filterLabel}>Period</label>
                <select value={salesPeriod} onChange={e => {setSalesPeriod(e.target.value);setSalesPage(1);}} className={styles.filterSelect}>
                  <option value="">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option>
                </select>
              </div>
              <div className={styles.salesFilterGroup}>
                <label className={styles.filterLabel}>From</label>
                <input type="date" value={salesDateFrom} onChange={e => {setSalesDateFrom(e.target.value);setSalesPeriod('');setSalesPage(1);}} className={styles.filterInput}/>
              </div>
              <div className={styles.salesFilterGroup}>
                <label className={styles.filterLabel}>To</label>
                <input type="date" value={salesDateTo} onChange={e => {setSalesDateTo(e.target.value);setSalesPeriod('');setSalesPage(1);}} className={styles.filterInput}/>
              </div>
              <div className={styles.salesFilterGroup}>
                <label className={styles.filterLabel}>Sort by</label>
                <select value={salesSortBy} onChange={e => setSalesSortBy(e.target.value)} className={styles.filterSelect}>
                  <option value="createdAt">Date</option><option value="totalAmount">Revenue</option><option value="totalProfit">Profit</option>
                </select>
              </div>
              <div className={styles.salesFilterGroup}>
                <label className={styles.filterLabel}>Order</label>
                <select value={salesSortDir} onChange={e => setSalesSortDir(e.target.value)} className={styles.filterSelect}>
                  <option value="desc">Highest / Newest</option><option value="asc">Lowest / Oldest</option>
                </select>
              </div>
              {(salesPeriod||salesDateFrom||salesDateTo) && (
                <button className="btn btn-secondary btn-sm" onClick={() => {setSalesPeriod('');setSalesDateFrom('');setSalesDateTo('');setSalesPage(1);}}>
                  <X size={11}/> Clear
                </button>
              )}
            </div>

            {loadingData ? (
              <div style={{textAlign:'center',padding:60,color:'var(--color-text-muted)',fontFamily:'var(--font-mono)',fontSize:12}}>Loading...</div>
            ) : (
              <>
                {sales.map(sale => (
                  <div key={sale._id} className={styles.saleRecord}>
                    <div className={styles.saleHeader}>
                      <div>
                        <div className={styles.saleDate}>{new Date(sale.createdAt).toLocaleString('en-IN')}</div>
                        {sale.note && <div className={styles.saleNote}>{sale.note}</div>}
                      </div>
                      <div className={styles.saleTotals}>
                        <div className={styles.saleFinancials}>
                          <span className={styles.saleFinRow}><span className={styles.saleFinLabel}>Selling</span><span className={styles.saleRevenue}>₹{sale.totalAmount?.toFixed(0)}</span></span>
                          {sale.amountPaid != null && sale.amountPaid !== sale.totalAmount && (
                            <span className={styles.saleFinRow}>
                              <span className={styles.saleFinLabel}>Paid</span>
                              <span className={styles.saleAmountPaid}>₹{sale.amountPaid?.toFixed(0)}</span>
                            </span>
                          )}
                          {sale.paymentDiff != null && sale.paymentDiff !== 0 && (
                            <span className={styles.saleFinRow}>
                              <span className={styles.saleFinLabel}>{sale.paymentDiff > 0 ? 'Extra' : 'Discount'}</span>
                              <span className={sale.paymentDiff > 0 ? styles.saleExtra : styles.saleDiscount}>
                                {sale.paymentDiff > 0 ? '+' : ''}₹{sale.paymentDiff?.toFixed(0)}
                              </span>
                            </span>
                          )}
                          <span className={styles.saleFinRow}><span className={styles.saleFinLabel}>Cost</span><span className={styles.saleCost}>₹{sale.totalCost?.toFixed(0)}</span></span>
                          <span className={styles.saleFinRow}><span className={styles.saleFinLabel}>Profit</span><span className={styles.saleProfit}>+₹{sale.totalProfit?.toFixed(0)}</span></span>
                        </div>
                        <button className={`${styles.tableBtn} ${styles.tableBtnDanger}`} onClick={() => handleDeleteSale(sale._id)}><Trash2 size={11}/></button>
                      </div>
                    </div>
                    <div className={styles.saleItems}>
                      {sale.items?.map((item,i) => (
                        <div key={i} className={styles.saleItem}>
                          <span className={styles.saleItemName}>{item.productName}</span>
                          <span className={styles.saleItemQty}>×{Math.abs(item.quantity)}</span>
                          <span className={styles.saleItemPrice}>₹{Math.abs(item.subtotal)?.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {salesTotalPages > 1 && (
                  <div className={styles.salesPagination}>
                    <button className="btn btn-secondary btn-sm" disabled={salesPage===1} onClick={() => setSalesPage(p=>p-1)}>← Prev</button>
                    <span className={styles.salesPageInfo}>Page {salesPage} of {salesTotalPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={salesPage===salesTotalPages} onClick={() => setSalesPage(p=>p+1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Q&A ── */}
        {tab === 'qna' && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Q&A / FAQ</h1>
              <button className="btn btn-primary btn-sm" onClick={openAddQna}><Plus size={13}/> Add Q&A</button>
            </div>
            {qnaItems.length === 0 ? (
              <div className="empty-state" style={{paddingTop:60}}>
                <HelpCircle size={36}/><p style={{marginTop:12,fontFamily:'var(--font-mono)',fontSize:13}}>No Q&A yet</p>
              </div>
            ) : (
              <div className={styles.qnaList}>
                {qnaItems.map(item => (
                  <div key={item._id} className={`${styles.qnaItem} ${!item.isVisible ? styles.qnaHidden : ''}`}>
                    <div className={styles.qnaItemHeader}>
                      <div>
                        <div className={styles.qnaQuestion}>{item.question}</div>
                        <div className={styles.qnaMeta}>
                          <span className={styles.qnaCategory}>{item.category}</span>
                          {!item.isVisible && <span className={styles.qnaHiddenBadge}>Hidden</span>}
                        </div>
                      </div>
                      <div className={styles.tableActions}>
                        <button className={styles.tableBtn} onClick={() => openEditQna(item)}><Edit2 size={11}/></button>
                        <button className={`${styles.tableBtn} ${styles.tableBtnDanger}`} onClick={() => handleDeleteQna(item._id)}><Trash2 size={11}/></button>
                      </div>
                    </div>
                    <div className={styles.qnaAnswer}>{item.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EXPORT ── */}
        {tab === 'export' && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Export Data</h1>
            </div>
            <div className={styles.exportBox}>
              <div className={styles.exportSection}>
                <h3 className={styles.exportSectionTitle}>What to export</h3>
                <div className={styles.exportTypeGrid}>
                  {[{val:'products',label:'Products',desc:'All products, prices, stock, cost'},{val:'sales',label:'Sales',desc:'Transaction records with profit'}].map(opt => (
                    <div key={opt.val} className={`${styles.exportTypeCard} ${exportType===opt.val ? styles.exportTypeCardActive : ''}`} onClick={() => setExportType(opt.val)}>
                      <div className={styles.exportTypeLabel}>{opt.label}</div>
                      <div className={styles.exportTypeDesc}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {exportType === 'sales' && (
                <div className={styles.exportSection}>
                  <h3 className={styles.exportSectionTitle}>Date range (optional)</h3>
                  <div className={styles.exportDateRow}>
                    <div className={styles.exportDateGroup}>
                      <label className={styles.exportLabel}>Quick period</label>
                      <select value={exportPeriod} onChange={e => {setExportPeriod(e.target.value);setExportDateFrom('');setExportDateTo('');}} className={styles.filterSelect}>
                        <option value="">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option>
                      </select>
                    </div>
                    <div className={styles.exportDateGroup}>
                      <label className={styles.exportLabel}>From</label>
                      <input type="date" value={exportDateFrom} onChange={e => {setExportDateFrom(e.target.value);setExportPeriod('');}} className={styles.filterInput}/>
                    </div>
                    <div className={styles.exportDateGroup}>
                      <label className={styles.exportLabel}>To</label>
                      <input type="date" value={exportDateTo} onChange={e => {setExportDateTo(e.target.value);setExportPeriod('');}} className={styles.filterInput}/>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.exportSection}>
                <h3 className={styles.exportSectionTitle}>Download</h3>
                <div className={styles.exportBtns}>
                  <button className="btn btn-primary" onClick={() => handleExport('csv')}><Download size={15}/> Download CSV</button>
                  <button className="btn btn-secondary" onClick={() => handleExport('json')}><Download size={15}/> Download JSON</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && config && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Settings</h1>
            </div>
            {/* Floating save button */}
            <button className={styles.floatingSaveBtn} onClick={handleConfigSave}>
              <Save size={14}/> Save All
            </button>

            {/* Shop Info */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}><Zap size={13}/> Shop Info</h3>
              <div className={styles.settingsGrid}>
                {[
                  { label:'Location (e.g. BH5 Room C-892)', key:'location' },
                  { label:'WhatsApp Number', key:'whatsappNumber' },
                  { label:'Telegram Group Link', key:'telegramLink' },
                  { label:'Tagline', key:'tagline' },
                ].map(f => (
                  <div key={f.key} className={styles.settingsField}>
                    <label className={styles.settingsLabel}>{f.label}</label>
                    <input value={config[f.key] || ''} onChange={e => setConfig(c => ({...c,[f.key]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Hours */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}><Clock size={13}/> Shop Hours</h3>
              <div className={styles.scheduleGrid}>
                {config.schedule?.map((day,i) => (
                  <div key={day.day} className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>{day.day.slice(0,3)}</span>
                    <label className={styles.scheduleToggle}>
                      <input type="checkbox" checked={day.isOpen} onChange={e => updateSchedule(i,'isOpen',e.target.checked)}/>
                      <span>{day.isOpen ? 'Open' : 'Closed'}</span>
                    </label>
                    {day.isOpen && (
                      <>
                        <input type="time" value={day.openTime} onChange={e => updateSchedule(i,'openTime',e.target.value)} className={styles.timeInput}/>
                        <span className={styles.timeSep}>to</span>
                        <input type="time" value={day.closeTime} onChange={e => updateSchedule(i,'closeTime',e.target.value)} className={styles.timeInput}/>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Homepage Stats */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionTitle}>📊 Homepage Stats</h3>
              <div className={styles.homeStatsGrid}>
                {(config.homeStats||[]).map((stat,i) => (
                  <div key={i} className={styles.homeStatRow}>
                    <input value={stat.num} onChange={e => updateHomeStat(i,'num',e.target.value)} placeholder="50+" className={styles.homeStatNum}/>
                    <input value={stat.label} onChange={e => updateHomeStat(i,'label',e.target.value)} placeholder="Products" className={styles.homeStatLabel}/>
                    <label className={styles.scheduleToggle}>
                      <input type="checkbox" checked={stat.isVisible} onChange={e => updateHomeStat(i,'isVisible',e.target.checked)}/>
                      <span>Show</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Homepage Feature Cards */}
            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionHeader}>
                <h3 className={styles.sectionTitle}>🏠 Homepage Feature Cards</h3>
                <button className="btn btn-sm btn-secondary" onClick={addHomeFeature}><Plus size={12}/> Add</button>
              </div>
              {(config.homeFeatures||[]).map((feat,i) => (
                <div key={feat.id||i} className={styles.serviceRow}>
                  <div className={styles.serviceRowHeader}>
                    <div className={styles.serviceRowLeft}>
                      <button className={styles.serviceVisBtn} onClick={() => updateHomeFeature(i,'isVisible',!feat.isVisible)}>
                        {feat.isVisible ? <Eye size={12}/> : <EyeOff size={12}/>}
                      </button>
                      <input value={feat.title} onChange={e => updateHomeFeature(i,'title',e.target.value)} className={styles.serviceTitleInput}/>
                    </div>
                    <button className={`${styles.tableBtn} ${styles.tableBtnDanger}`} onClick={() => removeHomeFeature(i)}><Trash2 size={11}/></button>
                  </div>
                  <div className={styles.serviceRowFields}>
                    <textarea value={feat.description} onChange={e => updateHomeFeature(i,'description',e.target.value)} rows={2} placeholder="Description"/>
                    <div className={styles.serviceRowMeta}>
                      <select value={feat.icon} onChange={e => updateHomeFeature(i,'icon',e.target.value)}>
                        {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Services */}
            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionHeader}>
                <h3 className={styles.sectionTitle}><Wrench size={13}/> Services Page Cards</h3>
                <button className="btn btn-sm btn-secondary" onClick={addService}><Plus size={12}/> Add</button>
              </div>
              {config.services?.map((svc,i) => (
                <div key={svc.id||i} className={styles.serviceRow}>
                  <div className={styles.serviceRowHeader}>
                    <div className={styles.serviceRowLeft}>
                      <button className={styles.serviceVisBtn} onClick={() => updateService(i,'isVisible',!svc.isVisible)}>
                        {svc.isVisible ? <Eye size={12}/> : <EyeOff size={12}/>}
                      </button>
                      <input value={svc.title} onChange={e => updateService(i,'title',e.target.value)} className={styles.serviceTitleInput}/>
                    </div>
                    <button className={`${styles.tableBtn} ${styles.tableBtnDanger}`} onClick={() => removeService(i)}><Trash2 size={11}/></button>
                  </div>
                  <div className={styles.serviceRowFields}>
                    <textarea value={svc.description} onChange={e => updateService(i,'description',e.target.value)} rows={2} placeholder="Description"/>
                    <div className={styles.serviceRowMeta}>
                      <input value={svc.price} onChange={e => updateService(i,'price',e.target.value)} placeholder="Price"/>
                      <input value={svc.turnaround} onChange={e => updateService(i,'turnaround',e.target.value)} placeholder="Turnaround"/>
                      <select value={svc.icon} onChange={e => updateService(i,'icon',e.target.value)}>
                        {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                    {/* Tags pill editor */}
                    <div className={styles.svcTagsSection}>
                      <div className={styles.svcTagPills}>
                        {(svc.tags || []).map(tag => (
                          <span key={tag} className={styles.svcTagPill}>
                            {tag}
                            <button type="button" onClick={() => removeSvcTag(i, tag)} className={styles.svcTagPillRemove}><X size={9}/></button>
                          </span>
                        ))}
                      </div>
                      <div className={styles.svcTagInputRow}>
                        <input
                          value={svcTagInputs[i] || ''}
                          onChange={e => setSvcTagInputs(s => ({ ...s, [i]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSvcTag(i); }}}
                          placeholder="Add tag…"
                          className={styles.svcTagInput}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addSvcTag(i)}>Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PRODUCT MODAL ── */}
      {modalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</span>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}><X size={15}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/>
                </div>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Category</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Selling Price (₹) *</label>
                  <input type="number" value={form.sellingPrice} onChange={e => setForm(f=>({...f,sellingPrice:e.target.value}))}/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Cost Price (₹)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f=>({...f,costPrice:e.target.value}))}/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Market/Store Price (₹) <span style={{fontSize:10,color:'var(--color-text-muted)'}}>optional</span></label>
                  <input type="number" value={form.marketPrice} onChange={e => setForm(f=>({...f,marketPrice:e.target.value}))} placeholder="Leave blank to hide"/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Stock Qty</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))}/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Total Sold</label>
                  <input type="number" value={form.totalSold} onChange={e => setForm(f=>({...f,totalSold:e.target.value}))}/>
                </div>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Out-of-Stock Label</label>
                  <select value={form.outOfStockLabel} onChange={e => setForm(f=>({...f,outOfStockLabel:e.target.value}))}>
                    {OOS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Tags with pill UI */}
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Tags</label>
                  <div className={styles.tagPills}>
                    {(form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : []).map(tag => (
                      <span key={tag} className={styles.tagPill}>
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className={styles.tagPillRemove}><X size={10}/></button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagInputRow}>
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }}}
                      placeholder="Type tag and press Enter..."
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
                  </div>
                </div>

                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel} style={{color:'var(--color-primary)'}}>✦ Admin/Seller Notes</label>
                  <textarea rows={3} className={styles.notesInput} value={form.adminNotes} onChange={e => setForm(f=>({...f,adminNotes:e.target.value}))} placeholder="Tips, personal recommendations..."/>
                </div>

                {/* Images */}
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Images (URLs)</label>
                  <div style={{display:'flex',gap:8,marginBottom:8}}>
                    <input value={imageInput} onChange={e => setImageInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();if(imageInput.trim()){setForm(f=>({...f,images:[...f.images,imageInput.trim()]}));setImageInput('');}}}} placeholder="https://..." style={{flex:1}}/>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {if(imageInput.trim()){setForm(f=>({...f,images:[...f.images,imageInput.trim()]}));setImageInput('');}}}>Add</button>
                  </div>
                  {form.images?.map((img,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <img src={img} alt="" style={{width:36,height:36,objectFit:'cover',borderRadius:6,border:'1px solid var(--color-border)'}} onError={e=>e.target.style.display='none'}/>
                      <span style={{flex:1,fontSize:11,color:'var(--color-text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img}</span>
                      <button type="button" className={styles.tableBtn} onClick={() => setForm(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))}><X size={11}/></button>
                    </div>
                  ))}
                </div>

                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f=>({...f,isPinned:e.target.checked}))} style={{width:'auto'}}/>
                    📌 Pin this product
                  </label>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f=>({...f,isActive:e.target.checked}))} style={{width:'auto'}}/>
                    Active (visible to customers)
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={13}/> {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QnA MODAL ── */}
      {qnaModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} style={{maxWidth:520}}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{editingQna ? 'Edit Q&A' : 'Add Q&A'}</span>
              <button className={styles.modalClose} onClick={() => setQnaModal(false)}><X size={15}/></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Question *</label>
                  <input value={qnaForm.question} onChange={e => setQnaForm(f=>({...f,question:e.target.value}))} placeholder="What payment methods do you accept?"/>
                </div>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Answer *</label>
                  <textarea rows={4} value={qnaForm.answer} onChange={e => setQnaForm(f=>({...f,answer:e.target.value}))}/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Category</label>
                  <input value={qnaForm.category} onChange={e => setQnaForm(f=>({...f,category:e.target.value}))} placeholder="General"/>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Order (lower = first)</label>
                  <input type="number" value={qnaForm.order} onChange={e => setQnaForm(f=>({...f,order:Number(e.target.value)}))}/>
                </div>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={qnaForm.isVisible} onChange={e => setQnaForm(f=>({...f,isVisible:e.target.checked}))} style={{width:'auto'}}/>
                    Visible on public FAQ page
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-secondary btn-sm" onClick={() => setQnaModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQna}><Save size={13}/> {editingQna ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
