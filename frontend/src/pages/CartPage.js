import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartAPI, orderAPI } from '../services/api';
import 'primeicons/primeicons.css';

const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID'; // will be overridden by backend response

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle'); // idle | creating | paying | verifying | done
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data.data);
    } catch { toast.error('Failed to load cart'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (itemId, qty) => {
    try {
      const res = await cartAPI.updateItem(itemId, { quantity: qty });
      setCart(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await cartAPI.removeItem(itemId);
      setCart(res.data.data);
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
  };

  const handlePayNow = async () => {
    if (!address.trim()) { toast.error('Please enter shipping address'); return; }

    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Could not load payment gateway. Check your connection.'); return; }

    setPlacing(true);
    setPaymentStep('creating');

    let rzpData;
    try {
      // Step 1: Create order in backend → get Razorpay order ID
      const res = await orderAPI.createOrder({ shippingAddress: address });
      rzpData = res.data.data;
      toast.success('Order created. Opening payment...');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setPlacing(false);
      setPaymentStep('idle');
      return;
    }

    setPaymentStep('paying');

    // Step 2: Open Razorpay checkout
    const options = {
      key: rzpData.keyId || RAZORPAY_KEY_ID,
      amount: Math.round(parseFloat(rzpData.amount) * 100),
      currency: rzpData.currency || 'INR',
      name: 'ShopManager',
      description: `Order #${rzpData.orderId}`,
      order_id: rzpData.razorpayOrderId,
      handler: async (response) => {
        // Step 3: Verify payment + process inventory on backend
        setPaymentStep('verifying');
        try {
          const verifyRes = await orderAPI.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          const orderData = verifyRes.data.data;
          setPaymentStep('done');
          setPlacing(false);
          if (orderData.status === 'CONFIRMED') {
            toast.success('Payment successful! Order confirmed 🎉');
            navigate('/orders');
          } else if (orderData.status === 'OUT_OF_STOCK') {
            const refundStatus = orderData.payment?.status;
            if (refundStatus === 'REFUNDED') {
              toast.error('Some items went out of stock. Your payment has been refunded.');
            } else {
              toast.error('Some items out of stock. Refund pending — contact support.');
            }
            navigate('/orders');
          } else {
            toast.error('Order status: ' + orderData.status);
            navigate('/orders');
          }
        } catch (err) {
          setPlacing(false);
          setPaymentStep('idle');
          toast.error(err.response?.data?.message || 'Payment verification failed');
        }
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#e94560' },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          setPaymentStep('idle');
          toast('Payment cancelled. Your order is saved — you can retry from My Orders.');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setPlacing(false);
      setPaymentStep('idle');
      toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'));
    });
    rzp.open();
  };

  const stepLabel = {
    idle: 'Pay Now',
    creating: 'Creating order...',
    paying: 'Opening payment...',
    verifying: 'Verifying payment...',
    done: 'Done!',
  }[paymentStep];

  if (loading) return (
    <div style={styles.loadingPage}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#e94560' }}></i>
      <p>Loading cart...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        <i className="pi pi-shopping-cart" style={styles.titleIcon}></i>
        Your Cart
      </h1>

      {(!cart || cart.items.length === 0) ? (
        <div style={styles.empty}>
          <i className="pi pi-shopping-bag" style={styles.emptyIcon}></i>
          <p style={styles.emptyText}>Your cart is empty</p>
          <button style={styles.shopBtn} onClick={() => navigate('/')}>
            <i className="pi pi-arrow-left" style={{ marginRight: 8 }}></i>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* Cart Items */}
          <div style={styles.itemsCol}>
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>
                <i className="pi pi-list" style={{ marginRight: 8, color: '#e94560' }}></i>
                Items ({cart.totalItems})
              </h2>
              {cart.items.map(item => (
                <div key={item.id} style={styles.item}>
                  <div style={styles.itemIcon}>
                    <i className="pi pi-box" style={{ fontSize: '1.5rem', color: '#8b5cf6' }}></i>
                  </div>
                  <div style={styles.itemInfo}>
                    <h3 style={styles.itemName}>{item.productName}</h3>
                    <p style={styles.itemPrice}>
                      <i className="pi pi-indian-rupee" style={{ fontSize: '0.75rem' }}></i>
                      {parseFloat(item.priceAtAddition).toFixed(2)} each
                    </p>
                  </div>
                  <div style={styles.qtyControl}>
                    <button style={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}>
                      <i className="pi pi-minus" style={{ fontSize: '0.7rem' }}></i>
                    </button>
                    <span style={styles.qty}>{item.quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => updateQty(item.id, item.quantity + 1)}>
                      <i className="pi pi-plus" style={{ fontSize: '0.7rem' }}></i>
                    </button>
                  </div>
                  <span style={styles.subtotal}>
                    ₹{parseFloat(item.subtotal).toFixed(2)}
                  </span>
                  <button style={styles.removeBtn} onClick={() => removeItem(item.id)} title="Remove">
                    <i className="pi pi-trash" style={{ color: '#ef4444' }}></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={styles.summaryCol}>
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>
                <i className="pi pi-receipt" style={{ marginRight: 8, color: '#e94560' }}></i>
                Order Summary
              </h2>
              <div style={styles.summaryRow}>
                <span><i className="pi pi-shopping-bag" style={{ marginRight: 6, color: '#888' }}></i>Items</span>
                <span>{cart.totalItems}</span>
              </div>
              <div style={styles.summaryRow}>
                <span><i className="pi pi-tag" style={{ marginRight: 6, color: '#888' }}></i>Subtotal</span>
                <span>₹{parseFloat(cart.totalAmount).toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span><i className="pi pi-truck" style={{ marginRight: 6, color: '#888' }}></i>Shipping</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={styles.divider} />
              <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.15rem' }}>
                <span>Total</span>
                <span style={{ color: '#e94560' }}>₹{parseFloat(cart.totalAmount).toFixed(2)}</span>
              </div>

              <div style={styles.addressSection}>
                <label style={styles.addressLabel}>
                  <i className="pi pi-map-marker" style={{ marginRight: 6, color: '#e94560' }}></i>
                  Shipping Address *
                </label>
                <textarea
                  style={styles.addressInput}
                  placeholder="Enter your full shipping address..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Payment info badge */}
              <div style={styles.securePayBadge}>
                <i className="pi pi-lock" style={{ color: '#10b981', marginRight: 6 }}></i>
                <span style={{ fontSize: '0.85rem', color: '#555' }}>
                  Secured by <strong>Razorpay</strong>
                </span>
              </div>

              <button style={{ ...styles.payBtn, ...(placing ? styles.payBtnDisabled : {}) }}
                onClick={handlePayNow} disabled={placing}>
                {placing ? (
                  <><i className="pi pi-spin pi-spinner" style={{ marginRight: 8 }}></i>{stepLabel}</>
                ) : (
                  <><i className="pi pi-credit-card" style={{ marginRight: 8 }}></i>Pay Now</>
                )}
              </button>

              <div style={styles.paymentIcons}>
                <span style={styles.payTag}><i className="pi pi-shield" style={{ marginRight: 4 }}></i>UPI</span>
                <span style={styles.payTag}><i className="pi pi-credit-card" style={{ marginRight: 4 }}></i>Card</span>
                <span style={styles.payTag}><i className="pi pi-building" style={{ marginRight: 4 }}></i>Netbanking</span>
                <span style={styles.payTag}><i className="pi pi-wallet" style={{ marginRight: 4 }}></i>Wallet</span>
              </div>
            </div>

            {/* How payment works */}
            <div style={{ ...styles.sectionCard, marginTop: '1rem' }}>
              <h3 style={{ ...styles.sectionTitle, fontSize: '0.95rem' }}>
                <i className="pi pi-info-circle" style={{ marginRight: 8, color: '#3b82f6' }}></i>
                How it works
              </h3>
              {[
                ['pi-check-circle', '#10b981', 'Order created & locked'],
                ['pi-credit-card', '#3b82f6', 'Razorpay payment gateway opens'],
                ['pi-box', '#8b5cf6', 'Inventory verified post-payment'],
                ['pi-send', '#e94560', 'Order confirmed & cart cleared'],
              ].map(([icon, color, text], i) => (
                <div key={i} style={styles.stepRow}>
                  <i className={`pi ${icon}`} style={{ color, marginRight: 10, fontSize: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: '#555' }}>{text}</span>
                </div>
              ))}
              <div style={styles.refundNote}>
                <i className="pi pi-refresh" style={{ color: '#f59e0b', marginRight: 6 }}></i>
                <span style={{ fontSize: '0.8rem', color: '#777' }}>
                  If items go out of stock after payment, a full refund is issued automatically.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' },
  loadingPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem', color: '#888' },
  title: { fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  titleIcon: { color: '#e94560', fontSize: '1.6rem' },
  empty: { textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  emptyIcon: { fontSize: '4rem', color: '#ddd', display: 'block', marginBottom: '1rem' },
  emptyText: { color: '#888', fontSize: '1.1rem', marginBottom: '1.5rem' },
  shopBtn: { padding: '12px 28px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' },
  itemsCol: {},
  summaryCol: {},
  sectionCard: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  sectionTitle: { fontSize: '1.1rem', color: '#1a1a2e', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center' },
  item: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '14px 0', borderBottom: '1px solid #f5f5f5' },
  itemIcon: { width: '44px', height: '44px', background: '#f5f0ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { margin: '0 0 4px', color: '#1a1a2e', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemPrice: { margin: 0, color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '2px' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  qtyBtn: { width: '28px', height: '28px', background: '#f0f4f8', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qty: { width: '28px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' },
  subtotal: { fontWeight: 700, color: '#1a1a2e', minWidth: '80px', textAlign: 'right', flexShrink: 0 },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '6px', flexShrink: 0 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', color: '#555' },
  divider: { height: '1px', background: '#f0f0f0', margin: '14px 0' },
  addressSection: { marginTop: '1.2rem' },
  addressLabel: { display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#444', marginBottom: '8px' },
  addressInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  securePayBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#f0fdf4', borderRadius: '8px', margin: '14px 0 10px' },
  payBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #e94560, #c0392b)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' },
  payBtnDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  paymentIcons: { display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' },
  payTag: { background: '#f5f5f5', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center' },
  stepRow: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
  refundNote: { display: 'flex', alignItems: 'flex-start', gap: '4px', background: '#fffbeb', borderRadius: '8px', padding: '8px 10px', marginTop: '10px' },
};
