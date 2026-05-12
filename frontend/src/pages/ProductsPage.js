import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

const CATEGORY_ICONS = {
  Electronics: 'pi-desktop', Footwear: 'pi-heart', Sports: 'pi-star',
  Home: 'pi-home', Stationery: 'pi-pencil', General: 'pi-box',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const { user, isAdmin } = useAuth();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll(page, 12, search);
      setProducts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddToCart = async (product) => {
    if (!user) { toast.error('Please login to add items'); return; }
    setAddingId(product.id);
    try {
      await cartAPI.addItem({ productId: product.id, quantity: 1 });
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally { setAddingId(null); }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>
          <i className="pi pi-star-fill" style={styles.heroIcon}></i>
          Discover Products
        </h1>
        <p style={styles.heroSub}>Quality items, great prices, fast delivery</p>
        <div style={styles.searchBox}>
          <i className="pi pi-search" style={styles.searchIcon}></i>
          <input style={styles.searchInput} placeholder="Search products, categories..."
            value={search} onChange={handleSearch} />
          {search && (
            <button style={styles.clearBtn} onClick={() => setSearch('')}>
              <i className="pi pi-times" style={{ fontSize: '0.75rem' }}></i>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingGrid}>
          {[...Array(8)].map((_, i) => <div key={i} style={styles.skeleton}></div>)}
        </div>
      ) : (
        <>
          {search && (
            <div style={styles.resultInfo}>
              <i className="pi pi-filter" style={{ marginRight: 6, color: '#888' }}></i>
              {products.length} result{products.length !== 1 ? 's' : ''} for &quot;{search}&quot;
            </div>
          )}

          <div style={styles.grid}>
            {products.map(product => {
              const catIcon = CATEGORY_ICONS[product.category] || 'pi-box';
              const isOutOfStock = product.quantity === 0;
              const isAdding = addingId === product.id;

              return (
                <div key={product.id} style={styles.card}>
                  {/* Product image/icon area */}
                  <div style={styles.imageArea}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={styles.image} />
                    ) : (
                      <i className={`pi ${catIcon}`} style={styles.catIcon}></i>
                    )}
                    {isOutOfStock && (
                      <div style={styles.outOfStockBadge}>
                        <i className="pi pi-ban" style={{ marginRight: 4 }}></i>Out of Stock
                      </div>
                    )}
                    {product.quantity > 0 && product.quantity <= 5 && (
                      <div style={styles.lowStockBadge}>
                        <i className="pi pi-exclamation-triangle" style={{ marginRight: 4, fontSize: '0.7rem' }}></i>
                        Only {product.quantity} left!
                      </div>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.categoryRow}>
                      <span style={styles.categoryTag}>
                        <i className={`pi ${catIcon}`} style={{ marginRight: 4, fontSize: '0.7rem' }}></i>
                        {product.category || 'General'}
                      </span>
                    </div>

                    <h3 style={styles.productName}>{product.name}</h3>

                    {product.description && (
                      <p style={styles.description}>{product.description}</p>
                    )}

                    <div style={styles.priceRow}>
                      <div style={styles.priceWrap}>
                        <i className="pi pi-indian-rupee" style={styles.rupeeIcon}></i>
                        <span style={styles.price}>{parseFloat(product.price).toFixed(2)}</span>
                      </div>
                      <span style={{ ...styles.stockBadge, ...(isOutOfStock ? styles.noStock : styles.inStock) }}>
                        <i className={`pi ${isOutOfStock ? 'pi-times' : 'pi-check'}`} style={{ marginRight: 3, fontSize: '0.65rem' }}></i>
                        {isOutOfStock ? 'Out of stock' : `${product.quantity} in stock`}
                      </span>
                    </div>

                    {!isAdmin && (
                      <button
                        style={{ ...styles.addBtn, ...(isOutOfStock || isAdding ? styles.addBtnDisabled : {}) }}
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock || !!isAdding}
                      >
                        {isAdding
                          ? <><i className="pi pi-spin pi-spinner" style={{ marginRight: 6 }}></i>Adding...</>
                          : isOutOfStock
                            ? <><i className="pi pi-ban" style={{ marginRight: 6 }}></i>Out of Stock</>
                            : <><i className="pi pi-cart-plus" style={{ marginRight: 6 }}></i>Add to Cart</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div style={styles.empty}>
              <i className="pi pi-search" style={styles.emptyIcon}></i>
              <p style={styles.emptyText}>No products found</p>
              {search && <button style={styles.clearSearchBtn} onClick={() => setSearch('')}>Clear search</button>}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={{ ...styles.pageBtn, ...(page === 0 ? styles.pageBtnDisabled : {}) }}
                onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <i className="pi pi-chevron-left" style={{ marginRight: 4 }}></i>Prev
              </button>
              <div style={styles.pageNumbers}>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} style={{ ...styles.pageNum, ...(i === page ? styles.pageNumActive : {}) }}
                    onClick={() => setPage(i)}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button style={{ ...styles.pageBtn, ...(page >= totalPages - 1 ? styles.pageBtnDisabled : {}) }}
                onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                Next<i className="pi pi-chevron-right" style={{ marginLeft: 4 }}></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' },
  hero: { textAlign: 'center', padding: '2rem 1rem 2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', color: '#fff' },
  heroTitle: { margin: '0 0 8px', fontSize: '2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  heroIcon: { color: '#e94560', fontSize: '2rem' },
  heroSub: { color: '#9ca3af', margin: '0 0 1.5rem', fontSize: '1rem' },
  searchBox: { position: 'relative', maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', color: '#aaa', fontSize: '1rem', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '13px 42px 13px 42px', border: 'none', borderRadius: '12px', fontSize: '1rem', outline: 'none', background: 'rgba(255,255,255,0.95)', boxSizing: 'border-box', fontFamily: 'inherit' },
  clearBtn: { position: 'absolute', right: '14px', background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  resultInfo: { color: '#888', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' },
  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' },
  skeleton: { height: '320px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', borderRadius: '16px', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' },
  card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' },
  imageArea: { position: 'relative', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  catIcon: { fontSize: '3.5rem', color: '#8b5cf6', opacity: 0.7 },
  outOfStockBadge: { position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  lowStockBadge: { position: 'absolute', top: '10px', left: '10px', background: '#f59e0b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  cardBody: { padding: '1.1rem' },
  categoryRow: { marginBottom: '8px' },
  categoryTag: { background: '#f0e8ff', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' },
  productName: { margin: '0 0 6px', color: '#1a1a2e', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 },
  description: { color: '#888', fontSize: '0.82rem', margin: '0 0 12px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  priceWrap: { display: 'flex', alignItems: 'center', gap: '2px' },
  rupeeIcon: { color: '#e94560', fontSize: '0.85rem' },
  price: { fontWeight: 800, color: '#e94560', fontSize: '1.2rem' },
  stockBadge: { fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  inStock: { background: '#d1fae5', color: '#065f46' },
  noStock: { background: '#fee2e2', color: '#991b1b' },
  addBtn: { width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  addBtnDisabled: { background: '#d1d5db', color: '#9ca3af', cursor: 'not-allowed' },
  empty: { textAlign: 'center', padding: '4rem', color: '#888' },
  emptyIcon: { fontSize: '3rem', color: '#ddd', display: 'block', marginBottom: '1rem' },
  emptyText: { fontSize: '1rem', margin: '0 0 1rem' },
  clearSearchBtn: { padding: '8px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '2.5rem', flexWrap: 'wrap' },
  pageBtn: { padding: '8px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 600 },
  pageBtnDisabled: { background: '#e0e0e0', color: '#999', cursor: 'not-allowed' },
  pageNumbers: { display: 'flex', gap: '6px' },
  pageNum: { width: '36px', height: '36px', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', background: '#fff', color: '#555', fontWeight: 600, fontSize: '0.9rem' },
  pageNumActive: { background: '#e94560', color: '#fff', border: 'none' },
};
