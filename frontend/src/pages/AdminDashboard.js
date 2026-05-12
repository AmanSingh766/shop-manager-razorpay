import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productAPI, orderAPI } from '../services/api';
import 'primeicons/primeicons.css';

const TABS = [
  { key: 'Products', icon: 'pi-box', label: 'Products' },
  { key: 'Orders',   icon: 'pi-list', label: 'Orders' },
];
const ORDER_STATUSES = ['AWAITING_PAYMENT','PAYMENT_FAILED','CONFIRMED','OUT_OF_STOCK','REFUNDED','SHIPPED','DELIVERED','CANCELLED'];

const ORDER_STATUS_CONFIG = {
  AWAITING_PAYMENT: { color: '#f59e0b', icon: 'pi-clock' },
  PAYMENT_FAILED:   { color: '#ef4444', icon: 'pi-times-circle' },
  CONFIRMED:        { color: '#3b82f6', icon: 'pi-check-circle' },
  OUT_OF_STOCK:     { color: '#f97316', icon: 'pi-exclamation-triangle' },
  REFUNDED:         { color: '#8b5cf6', icon: 'pi-refresh' },
  SHIPPED:          { color: '#06b6d4', icon: 'pi-send' },
  DELIVERED:        { color: '#10b981', icon: 'pi-check' },
  CANCELLED:        { color: '#6b7280', icon: 'pi-ban' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPriceId, setEditPriceId] = useState(null);
  const [editQtyId, setEditQtyId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name:'', description:'', price:'', quantity:'', category:'', imageUrl:'' });
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try { const res = await productAPI.getAllAdmin(); setProducts(res.data.data.content); }
    catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try { const res = await orderAPI.allOrders(); setOrders(res.data.data.content); }
    catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'Products') fetchProducts();
    else fetchOrders();
  }, [tab]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await productAPI.create({ ...newProduct, price: parseFloat(newProduct.price), quantity: parseInt(newProduct.quantity) });
      toast.success('Product created!');
      setShowAddForm(false);
      setNewProduct({ name:'', description:'', price:'', quantity:'', category:'', imageUrl:'' });
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
  };

  const handleUpdatePrice = async (id) => {
    try {
      await productAPI.updatePrice(id, { price: parseFloat(newPrice) });
      toast.success('Price updated!'); setEditPriceId(null); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleUpdateQty = async (id) => {
    try {
      await productAPI.updateQuantity(id, { quantity: parseInt(newQty) });
      toast.success('Quantity updated!'); setEditQtyId(null); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id) => {
    try { await productAPI.toggle(id); toast.success('Status updated!'); fetchProducts(); }
    catch { toast.error('Failed'); }
  };

  const handleStatusChange = async (orderId, status) => {
    try { await orderAPI.updateStatus(orderId, status); toast.success('Status updated!'); fetchOrders(); }
    catch { toast.error('Failed'); }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.enabled).length,
    disabled: products.filter(p => !p.enabled).length,
    lowStock: products.filter(p => p.quantity <= 5 && p.quantity > 0).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <i className="pi pi-cog" style={styles.titleIcon}></i>
          Admin Dashboard
        </h1>
      </div>

      {/* Stats cards */}
      {tab === 'Products' && (
        <div style={styles.statsGrid}>
          {[
            { label: 'Total Products', value: stats.total, icon: 'pi-box', color: '#3b82f6' },
            { label: 'Active',         value: stats.active, icon: 'pi-check-circle', color: '#10b981' },
            { label: 'Disabled',       value: stats.disabled, icon: 'pi-ban', color: '#6b7280' },
            { label: 'Low Stock',      value: stats.lowStock, icon: 'pi-exclamation-triangle', color: '#f59e0b' },
            { label: 'Out of Stock',   value: stats.outOfStock, icon: 'pi-times-circle', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <i className={`pi ${s.icon}`} style={{ ...styles.statIcon, color: s.color }}></i>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t.key}
            style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }}
            onClick={() => setTab(t.key)}>
            <i className={`pi ${t.icon}`} style={{ marginRight: 8 }}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === 'Products' && (
        <>
          <button style={styles.addProductBtn} onClick={() => setShowAddForm(v => !v)}>
            <i className={`pi ${showAddForm ? 'pi-times' : 'pi-plus'}`} style={{ marginRight: 8 }}></i>
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>

          {showAddForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>
                <i className="pi pi-plus-circle" style={{ marginRight: 8, color: '#10b981' }}></i>
                New Product
              </h3>
              <form onSubmit={handleAddProduct}>
                <div style={styles.formGrid}>
                  {[
                    { key:'name', label:'Product Name *', placeholder:'Enter name' },
                    { key:'category', label:'Category', placeholder:'Electronics, Sports...' },
                    { key:'price', label:'Price (₹) *', placeholder:'0.00' },
                    { key:'quantity', label:'Quantity *', placeholder:'0' },
                    { key:'imageUrl', label:'Image URL', placeholder:'https://...' },
                    { key:'description', label:'Description', placeholder:'Product description...' },
                  ].map(f => (
                    <div key={f.key} style={f.key === 'description' || f.key === 'imageUrl' ? { gridColumn: '1/-1' } : {}}>
                      <label style={styles.formLabel}>{f.label}</label>
                      <input style={styles.formInput} placeholder={f.placeholder}
                        value={newProduct[f.key]}
                        onChange={e => setNewProduct({ ...newProduct, [f.key]: e.target.value })}
                        required={['name','price','quantity'].includes(f.key)} />
                    </div>
                  ))}
                </div>
                <button type="submit" style={styles.submitBtn}>
                  <i className="pi pi-check" style={{ marginRight: 8 }}></i>Create Product
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div style={styles.loadingWrap}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#e94560' }}></i>
            </div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}><i className="pi pi-box" style={styles.thIcon}></i>Product</th>
                    <th style={styles.th}><i className="pi pi-tag" style={styles.thIcon}></i>Category</th>
                    <th style={styles.th}><i className="pi pi-indian-rupee" style={styles.thIcon}></i>Price</th>
                    <th style={styles.th}><i className="pi pi-warehouse" style={styles.thIcon}></i>Qty</th>
                    <th style={styles.th}><i className="pi pi-circle" style={styles.thIcon}></i>Status</th>
                    <th style={styles.th}><i className="pi pi-sliders-h" style={styles.thIcon}></i>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.productCell}>
                          <div style={styles.productDot}></div>
                          <span style={styles.productNameCell}>{p.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.categoryTag}>
                          <i className="pi pi-tag" style={{ marginRight: 4, fontSize: '0.65rem' }}></i>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {editPriceId === p.id ? (
                          <div style={styles.inlineEdit}>
                            <input style={styles.inlineInput} defaultValue={p.price}
                              onChange={e => setNewPrice(e.target.value)} autoFocus />
                            <button style={styles.saveBtn} onClick={() => handleUpdatePrice(p.id)}>
                              <i className="pi pi-check"></i>
                            </button>
                            <button style={styles.cancelBtn} onClick={() => setEditPriceId(null)}>
                              <i className="pi pi-times"></i>
                            </button>
                          </div>
                        ) : (
                          <span style={styles.editableCell} onClick={() => { setEditPriceId(p.id); setNewPrice(p.price); }}>
                            ₹{parseFloat(p.price).toFixed(2)}
                            <i className="pi pi-pencil" style={styles.editIcon}></i>
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {editQtyId === p.id ? (
                          <div style={styles.inlineEdit}>
                            <input style={styles.inlineInput} defaultValue={p.quantity}
                              onChange={e => setNewQty(e.target.value)} autoFocus />
                            <button style={styles.saveBtn} onClick={() => handleUpdateQty(p.id)}>
                              <i className="pi pi-check"></i>
                            </button>
                            <button style={styles.cancelBtn} onClick={() => setEditQtyId(null)}>
                              <i className="pi pi-times"></i>
                            </button>
                          </div>
                        ) : (
                          <span style={{
                            ...styles.editableCell,
                            ...(p.quantity === 0 ? { color: '#ef4444' } : p.quantity <= 5 ? { color: '#f59e0b' } : {})
                          }} onClick={() => { setEditQtyId(p.id); setNewQty(p.quantity); }}>
                            {p.quantity === 0
                              ? <><i className="pi pi-times-circle" style={{ marginRight: 4, color: '#ef4444' }}></i>0</>
                              : <><i className={`pi pi-${p.quantity <= 5 ? 'exclamation-triangle' : 'check'}`} style={{ marginRight: 4 }}></i>{p.quantity}</>
                            }
                            <i className="pi pi-pencil" style={styles.editIcon}></i>
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...(p.enabled ? styles.activeBadge : styles.inactiveBadge) }}>
                          <i className={`pi ${p.enabled ? 'pi-check-circle' : 'pi-ban'}`} style={{ marginRight: 4 }}></i>
                          {p.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={{ ...styles.toggleBtn, ...(p.enabled ? styles.disableBtn : styles.enableBtn) }}
                          onClick={() => handleToggle(p.id)}>
                          <i className={`pi ${p.enabled ? 'pi-eye-slash' : 'pi-eye'}`} style={{ marginRight: 5 }}></i>
                          {p.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div style={styles.emptyTable}>
                  <i className="pi pi-inbox" style={styles.emptyIcon}></i>
                  <p>No products yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {tab === 'Orders' && (
        loading ? (
          <div style={styles.loadingWrap}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#e94560' }}></i>
          </div>
        ) : (
          <div style={styles.tableCard}>
            {orders.map(order => {
              const sc = ORDER_STATUS_CONFIG[order.status] || { color: '#888', icon: 'pi-circle' };
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id} style={styles.orderRow}>
                  <div style={styles.orderRowHeader} onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                    <div style={styles.orderBasic}>
                      <span style={styles.orderId}>
                        <i className="pi pi-receipt" style={{ marginRight: 6, color: '#888' }}></i>
                        #{order.id}
                      </span>
                      <span style={styles.orderDate}>
                        <i className="pi pi-calendar" style={{ marginRight: 4, color: '#bbb', fontSize: '0.75rem' }}></i>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div style={styles.orderRight}>
                      <span style={{ ...styles.orderStatusBadge, color: sc.color, background: sc.color + '18' }}>
                        <i className={`pi ${sc.icon}`} style={{ marginRight: 4 }}></i>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span style={styles.orderAmount}>
                        <i className="pi pi-indian-rupee" style={{ fontSize: '0.8rem' }}></i>
                        {parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                      <span style={styles.orderItems}>
                        <i className="pi pi-box" style={{ marginRight: 4, color: '#bbb' }}></i>
                        {order.items?.length || 0} items
                      </span>
                      <div style={styles.statusSelect}>
                        <i className="pi pi-pencil" style={styles.selectIcon}></i>
                        <select style={styles.select} value={order.status}
                          onChange={e => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}>
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                        </select>
                      </div>
                      <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`} style={{ color: '#bbb' }}></i>
                    </div>
                  </div>

                  {isExpanded && order.items && (
                    <div style={styles.orderExpanded}>
                      <div style={styles.orderAddress}>
                        <i className="pi pi-map-marker" style={{ color: '#e94560', marginRight: 6 }}></i>
                        {order.shippingAddress}
                      </div>
                      {order.payment && (
                        <div style={styles.paymentInfo}>
                          <i className="pi pi-credit-card" style={{ color: '#3b82f6', marginRight: 8 }}></i>
                          <span style={styles.payInfoText}>
                            Razorpay: {order.payment.razorpayPaymentId || order.payment.razorpayOrderId || '—'}
                          </span>
                          <span style={{ ...styles.payStatus, color: order.payment.status === 'PAID' ? '#10b981' : order.payment.status === 'REFUNDED' ? '#8b5cf6' : '#ef4444' }}>
                            {order.payment.status}
                          </span>
                        </div>
                      )}
                      <div style={styles.itemsList}>
                        {order.items.map(item => (
                          <div key={item.id} style={styles.orderItemRow}>
                            <i className="pi pi-box" style={{ color: '#8b5cf6', marginRight: 8 }}></i>
                            <span style={{ flex: 1 }}>{item.productName}</span>
                            <span style={{ color: '#888' }}>×{item.quantity}</span>
                            <span style={styles.itemAmt}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {orders.length === 0 && (
              <div style={styles.emptyTable}>
                <i className="pi pi-inbox" style={styles.emptyIcon}></i>
                <p>No orders yet</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.8rem', color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' },
  titleIcon: { color: '#e94560', fontSize: '1.6rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  statIcon: { fontSize: '1.8rem', display: 'block', marginBottom: '8px' },
  statValue: { fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e' },
  statLabel: { fontSize: '0.8rem', color: '#888', marginTop: '4px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '1.5rem' },
  tab: { padding: '10px 24px', border: '2px solid #e0e0e0', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: '#666' },
  activeTab: { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  addProductBtn: { padding: '10px 22px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', fontSize: '0.9rem' },
  formCard: { background: '#fff', borderRadius: '16px', padding: '1.8rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formTitle: { margin: '0 0 1.2rem', color: '#1a1a2e', display: 'flex', alignItems: 'center' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' },
  formLabel: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '5px' },
  formInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { padding: '11px 28px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: '3rem' },
  tableCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8faff' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#666', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0' },
  thIcon: { marginRight: 5, color: '#e94560', fontSize: '0.75rem' },
  tr: { borderBottom: '1px solid #f9f9f9', transition: 'background 0.15s' },
  td: { padding: '13px 16px', verticalAlign: 'middle', fontSize: '0.9rem', color: '#333' },
  productCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  productDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#e94560', flexShrink: 0 },
  productNameCell: { fontWeight: 600, color: '#1a1a2e' },
  categoryTag: { background: '#f0e8ff', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' },
  editableCell: { cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1a1a2e', fontWeight: 600 },
  editIcon: { color: '#bbb', fontSize: '0.7rem' },
  inlineEdit: { display: 'flex', alignItems: 'center', gap: '4px' },
  inlineInput: { width: '80px', padding: '5px 8px', border: '1.5px solid #3b82f6', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  saveBtn: { padding: '5px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  cancelBtn: { padding: '5px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
  activeBadge: { background: '#d1fae5', color: '#065f46' },
  inactiveBadge: { background: '#f3f4f6', color: '#6b7280' },
  toggleBtn: { padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center' },
  disableBtn: { background: '#fee2e2', color: '#991b1b' },
  enableBtn: { background: '#d1fae5', color: '#065f46' },
  emptyTable: { textAlign: 'center', padding: '3rem', color: '#888' },
  emptyIcon: { fontSize: '2.5rem', color: '#ddd', display: 'block', marginBottom: '1rem' },
  // Orders styles
  orderRow: { borderBottom: '1px solid #f5f5f5' },
  orderRowHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' },
  orderBasic: { display: 'flex', alignItems: 'center', gap: '12px' },
  orderId: { fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', display: 'flex', alignItems: 'center' },
  orderDate: { color: '#aaa', fontSize: '0.82rem', display: 'flex', alignItems: 'center' },
  orderRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  orderStatusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' },
  orderAmount: { fontWeight: 800, color: '#e94560', display: 'flex', alignItems: 'center', gap: '2px' },
  orderItems: { color: '#888', fontSize: '0.82rem', display: 'flex', alignItems: 'center' },
  statusSelect: { position: 'relative', display: 'flex', alignItems: 'center' },
  selectIcon: { position: 'absolute', left: '8px', color: '#888', fontSize: '0.7rem', pointerEvents: 'none' },
  select: { padding: '6px 8px 6px 24px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', outline: 'none', background: '#f9f9f9', fontFamily: 'inherit' },
  orderExpanded: { padding: '0 20px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0' },
  orderAddress: { display: 'flex', alignItems: 'center', color: '#555', fontSize: '0.88rem', padding: '12px 0 8px' },
  paymentInfo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f0f7ff', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem' },
  payInfoText: { flex: 1, color: '#555', wordBreak: 'break-all' },
  payStatus: { fontWeight: 700 },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  orderItemRow: { display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: '8px', fontSize: '0.88rem', gap: '8px' },
  itemAmt: { fontWeight: 700, color: '#1a1a2e', minWidth: '80px', textAlign: 'right' },
};
