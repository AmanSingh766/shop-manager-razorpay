import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { orderAPI } from '../services/api';
import 'primeicons/primeicons.css';

const STATUS_CONFIG = {
  AWAITING_PAYMENT: { color: '#f59e0b', bg: '#fef3c7', icon: 'pi-clock', label: 'Awaiting Payment' },
  PAYMENT_FAILED:   { color: '#ef4444', bg: '#fee2e2', icon: 'pi-times-circle', label: 'Payment Failed' },
  CONFIRMED:        { color: '#3b82f6', bg: '#dbeafe', icon: 'pi-check-circle', label: 'Confirmed' },
  OUT_OF_STOCK:     { color: '#f97316', bg: '#ffedd5', icon: 'pi-exclamation-triangle', label: 'Out of Stock' },
  REFUNDED:         { color: '#8b5cf6', bg: '#ede9fe', icon: 'pi-refresh', label: 'Refunded' },
  SHIPPED:          { color: '#06b6d4', bg: '#cffafe', icon: 'pi-send', label: 'Shipped' },
  DELIVERED:        { color: '#10b981', bg: '#d1fae5', icon: 'pi-check', label: 'Delivered' },
  CANCELLED:        { color: '#6b7280', bg: '#f3f4f6', icon: 'pi-ban', label: 'Cancelled' },
};

const PAYMENT_STATUS_CONFIG = {
  CREATED:      { color: '#f59e0b', icon: 'pi-clock', label: 'Pending' },
  PAID:         { color: '#10b981', icon: 'pi-check-circle', label: 'Paid' },
  FAILED:       { color: '#ef4444', icon: 'pi-times-circle', label: 'Failed' },
  REFUNDED:     { color: '#8b5cf6', icon: 'pi-refresh', label: 'Refunded' },
  REFUND_FAILED:{ color: '#dc2626', icon: 'pi-exclamation-circle', label: 'Refund Failed' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await orderAPI.myOrders(page);
        setOrders(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoading(false); }
    })();
  }, [page]);

  if (loading) return (
    <div style={styles.loadingPage}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#e94560' }}></i>
    </div>
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        <i className="pi pi-history" style={styles.titleIcon}></i>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div style={styles.empty}>
          <i className="pi pi-inbox" style={styles.emptyIcon}></i>
          <p>No orders yet</p>
        </div>
      ) : (
        orders.map(order => {
          const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.CONFIRMED;
          const pc = order.payment ? (PAYMENT_STATUS_CONFIG[order.payment.status] || {}) : null;
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader} onClick={() => setExpanded(isOpen ? null : order.id)}>
                <div style={styles.orderMeta}>
                  <div style={styles.orderIdRow}>
                    <i className="pi pi-receipt" style={{ color: '#888', marginRight: 6 }}></i>
                    <span style={styles.orderId}>Order #{order.id}</span>
                    <span style={styles.date}>
                      <i className="pi pi-calendar" style={{ marginRight: 4, color: '#aaa', fontSize: '0.75rem' }}></i>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div style={styles.rightSide}>
                  {pc && (
                    <span style={{ ...styles.badge, color: pc.color, background: pc.color + '18', marginRight: 8 }}>
                      <i className={`pi ${pc.icon}`} style={{ marginRight: 4 }}></i>{pc.label}
                    </span>
                  )}
                  <span style={{ ...styles.badge, color: sc.color, background: sc.bg }}>
                    <i className={`pi ${sc.icon}`} style={{ marginRight: 4 }}></i>{sc.label}
                  </span>
                  <span style={styles.total}>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                  <i className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`} style={{ color: '#aaa' }}></i>
                </div>
              </div>

              {isOpen && (
                <div style={styles.expandedBody}>
                  <div style={styles.infoRow}>
                    <i className="pi pi-map-marker" style={styles.infoIcon}></i>
                    <span style={styles.infoText}>{order.shippingAddress}</span>
                  </div>

                  {/* Payment details */}
                  {order.payment && (
                    <div style={styles.paymentBox}>
                      <div style={styles.paymentTitle}>
                        <i className="pi pi-credit-card" style={{ marginRight: 6, color: '#3b82f6' }}></i>
                        Payment Details
                      </div>
                      <div style={styles.paymentGrid}>
                        <span style={styles.payLabel}>Razorpay Order</span>
                        <span style={styles.payValue}>{order.payment.razorpayOrderId || '—'}</span>
                        <span style={styles.payLabel}>Payment ID</span>
                        <span style={styles.payValue}>{order.payment.razorpayPaymentId || '—'}</span>
                        <span style={styles.payLabel}>Amount</span>
                        <span style={styles.payValue}>₹{parseFloat(order.payment.amount).toFixed(2)}</span>
                        <span style={styles.payLabel}>Status</span>
                        <span style={{ ...styles.payValue, color: (PAYMENT_STATUS_CONFIG[order.payment.status] || {}).color }}>
                          {(PAYMENT_STATUS_CONFIG[order.payment.status] || {}).label || order.payment.status}
                        </span>
                        {order.payment.failureReason && (
                          <>
                            <span style={styles.payLabel}>Note</span>
                            <span style={{ ...styles.payValue, color: '#f97316' }}>{order.payment.failureReason}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Out-of-stock warning */}
                  {order.status === 'OUT_OF_STOCK' && (
                    <div style={styles.outOfStockBanner}>
                      <i className="pi pi-exclamation-triangle" style={{ color: '#f97316', marginRight: 8 }}></i>
                      <div>
                        <strong>Items went out of stock after your payment.</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>
                          {order.payment?.status === 'REFUNDED'
                            ? 'A full refund has been issued to your original payment method.'
                            : 'Refund processing. Please contact support if you need help.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order items */}
                  <div style={styles.itemsList}>
                    {order.items.map(item => (
                      <div key={item.id} style={styles.orderItem}>
                        <div style={styles.itemIconWrap}>
                          <i className="pi pi-box" style={{ color: '#8b5cf6' }}></i>
                        </div>
                        <span style={styles.itemName}>{item.productName}</span>
                        <span style={styles.itemQty}>
                          <i className="pi pi-times" style={{ fontSize: '0.65rem', margin: '0 3px' }}></i>
                          {item.quantity}
                        </span>
                        <span style={styles.itemUnit}>@ ₹{parseFloat(item.priceAtOrder).toFixed(2)}</span>
                        <span style={styles.itemSubtotal}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.orderTotal}>
                    <i className="pi pi-calculator" style={{ marginRight: 6, color: '#888' }}></i>
                    Total: <strong style={{ color: '#e94560', marginLeft: 6 }}>₹{parseFloat(order.totalAmount).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={{ ...styles.pageBtn, ...(page === 0 ? styles.pageBtnDisabled : {}) }}
            onClick={() => setPage(p => p - 1)} disabled={page === 0}>
            <i className="pi pi-chevron-left" style={{ marginRight: 4 }}></i>Prev
          </button>
          <span style={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
          <button style={{ ...styles.pageBtn, ...(page >= totalPages - 1 ? styles.pageBtnDisabled : {}) }}
            onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
            Next<i className="pi pi-chevron-right" style={{ marginLeft: 4 }}></i>
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' },
  loadingPage: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' },
  title: { fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  titleIcon: { color: '#e94560', fontSize: '1.6rem' },
  empty: { textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', color: '#888', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  emptyIcon: { fontSize: '3rem', color: '#ddd', display: 'block', marginBottom: '1rem' },
  card: { background: '#fff', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', cursor: 'pointer' },
  orderMeta: {},
  orderIdRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  orderId: { fontWeight: 700, color: '#1a1a2e', fontSize: '1rem' },
  date: { color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center' },
  rightSide: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center' },
  total: { fontWeight: 700, color: '#e94560', fontSize: '1rem' },
  expandedBody: { padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f5f5f5' },
  infoRow: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 0', color: '#555', fontSize: '0.9rem' },
  infoIcon: { color: '#e94560', marginTop: '2px', flexShrink: 0 },
  infoText: { flex: 1 },
  paymentBox: { background: '#f8faff', border: '1px solid #e8f0fe', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' },
  paymentTitle: { fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center' },
  paymentGrid: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', fontSize: '0.85rem' },
  payLabel: { color: '#888', fontWeight: 500 },
  payValue: { color: '#333', wordBreak: 'break-all' },
  outOfStockBanner: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#92400e' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  orderItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9f9f9', borderRadius: '10px' },
  itemIconWrap: { width: '32px', height: '32px', background: '#f0e8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemName: { flex: 1, fontWeight: 500, color: '#1a1a2e', fontSize: '0.9rem' },
  itemQty: { color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center' },
  itemUnit: { color: '#888', fontSize: '0.85rem' },
  itemSubtotal: { fontWeight: 700, color: '#1a1a2e', minWidth: '80px', textAlign: 'right' },
  orderTotal: { textAlign: 'right', color: '#555', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' },
  pageBtn: { padding: '8px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 500 },
  pageBtnDisabled: { background: '#ddd', color: '#999', cursor: 'not-allowed' },
  pageInfo: { color: '#666', fontSize: '0.9rem' },
};
