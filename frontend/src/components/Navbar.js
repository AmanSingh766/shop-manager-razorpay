import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <i className="pi pi-shopping-bag" style={styles.brandIcon}></i>
        <span>ShopManager</span>
      </Link>

      <div style={styles.links}>
        <Link to="/" style={{ ...styles.link, ...(isActive('/') ? styles.activeLink : {}) }}>
          <i className="pi pi-home" style={styles.linkIcon}></i>
          Products
        </Link>

        {user && !isAdmin && (
          <>
            <Link to="/cart" style={{ ...styles.link, ...(isActive('/cart') ? styles.activeLink : {}) }}>
              <i className="pi pi-shopping-cart" style={styles.linkIcon}></i>
              Cart
            </Link>
            <Link to="/orders" style={{ ...styles.link, ...(isActive('/orders') ? styles.activeLink : {}) }}>
              <i className="pi pi-history" style={styles.linkIcon}></i>
              My Orders
            </Link>
          </>
        )}

        {isAdmin && (
          <Link to="/admin" style={{ ...styles.link, ...(isActive('/admin') ? styles.activeLink : {}) }}>
            <i className="pi pi-cog" style={styles.linkIcon}></i>
            Admin Panel
          </Link>
        )}

        {user ? (
          <div style={styles.userArea}>
            <div style={styles.userChip}>
              <i className="pi pi-user" style={styles.userIcon}></i>
              <span style={styles.username}>{user.username}</span>
              {isAdmin && (
                <span style={styles.roleBadge}>
                  <i className="pi pi-shield" style={{ marginRight: 3, fontSize: '0.65rem' }}></i>
                  Admin
                </span>
              )}
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <i className="pi pi-sign-out" style={{ marginRight: 5 }}></i>
              Logout
            </button>
          </div>
        ) : (
          <div style={styles.userArea}>
            <Link to="/login" style={styles.loginBtn}>
              <i className="pi pi-sign-in" style={{ marginRight: 5 }}></i>
              Login
            </Link>
            <Link to="/register" style={styles.registerBtn}>
              <i className="pi pi-user-plus" style={{ marginRight: 5 }}></i>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 2rem', height: '64px', background: '#1a1a2e',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100,
  },
  brand: {
    color: '#e94560', fontWeight: 800, fontSize: '1.35rem',
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px',
  },
  brandIcon: { fontSize: '1.4rem' },
  links: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  link: {
    color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem',
    padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center',
    gap: '6px', transition: 'all 0.2s', fontWeight: 500,
  },
  activeLink: { color: '#fff', background: 'rgba(233,69,96,0.18)' },
  linkIcon: { fontSize: '0.9rem' },
  userArea: { display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)' },
  userChip: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.08)', borderRadius: '20px',
    padding: '6px 12px',
  },
  userIcon: { color: '#a8dadc', fontSize: '0.9rem' },
  username: { color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 },
  roleBadge: {
    background: '#e94560', color: '#fff', fontSize: '0.65rem',
    padding: '2px 6px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center',
  },
  logoutBtn: {
    background: 'rgba(233,69,96,0.15)', color: '#e94560', border: '1px solid rgba(233,69,96,0.3)',
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
    fontWeight: 600, display: 'flex', alignItems: 'center', transition: 'all 0.2s',
  },
  loginBtn: {
    color: '#9ca3af', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px',
    fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.2s',
  },
  registerBtn: {
    background: '#e94560', color: '#fff', textDecoration: 'none', padding: '7px 16px',
    borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center',
    transition: 'opacity 0.2s',
  },
};
