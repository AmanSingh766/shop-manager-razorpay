import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.data);
      toast.success('Welcome back!');
      navigate(res.data.data.role === 'ROLE_ADMIN' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <i className="pi pi-shopping-bag" style={styles.logo}></i>
        </div>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to your ShopManager account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <i className="pi pi-user" style={styles.labelIcon}></i>Username
            </label>
            <div style={styles.inputWrap}>
              <i className="pi pi-user" style={styles.inputIcon}></i>
              <input style={styles.input} placeholder="Enter username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <i className="pi pi-lock" style={styles.labelIcon}></i>Password
            </label>
            <div style={styles.inputWrap}>
              <i className="pi pi-lock" style={styles.inputIcon}></i>
              <input style={{ ...styles.input, paddingRight: '40px' }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPwd(p => !p)}>
                <i className={`pi ${showPwd ? 'pi-eye-slash' : 'pi-eye'}`} style={{ color: '#aaa' }}></i>
              </button>
            </div>
          </div>

          <button style={{ ...styles.btn, ...(loading ? styles.btnLoading : {}) }} disabled={loading}>
            {loading
              ? <><i className="pi pi-spin pi-spinner" style={{ marginRight: 8 }}></i>Signing in...</>
              : <><i className="pi pi-sign-in" style={{ marginRight: 8 }}></i>Sign In</>
            }
          </button>
        </form>

        <div style={styles.demoBox}>
          <div style={styles.demoTitle}>
            <i className="pi pi-info-circle" style={{ marginRight: 6, color: '#3b82f6' }}></i>
            Demo Credentials
          </div>
          <div style={styles.demoRow}>
            <i className="pi pi-shield" style={{ color: '#e94560', marginRight: 6 }}></i>
            <strong>Admin:</strong>&nbsp;admin / admin123
          </div>
          <div style={styles.demoRow}>
            <i className="pi pi-user" style={{ color: '#10b981', marginRight: 6 }}></i>
            <strong>User:</strong>&nbsp;user1 / user123
          </div>
        </div>

        <p style={styles.footer}>
          No account?&nbsp;
          <Link to="/register" style={styles.link}>
            <i className="pi pi-user-plus" style={{ marginRight: 4 }}></i>Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)', padding: '2rem' },
  card: { background: '#fff', padding: '2.5rem', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
  logoRow: { textAlign: 'center', marginBottom: '1rem' },
  logo: { fontSize: '2.5rem', color: '#e94560' },
  title: { textAlign: 'center', margin: '0 0 6px', color: '#1a1a2e', fontSize: '1.6rem', fontWeight: 800 },
  subtitle: { textAlign: 'center', color: '#888', fontSize: '0.9rem', margin: '0 0 1.8rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'flex', alignItems: 'center', gap: '5px' },
  labelIcon: { color: '#e94560', fontSize: '0.8rem' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: '#bbb', fontSize: '0.9rem', pointerEvents: 'none' },
  input: { width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  eyeBtn: { position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  btn: { padding: '13px', background: 'linear-gradient(135deg, #e94560, #c0392b)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' },
  btnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  demoBox: { background: '#f8faff', border: '1px solid #e8f0fe', borderRadius: '10px', padding: '12px 14px', margin: '1.2rem 0 0.8rem', fontSize: '0.85rem', color: '#555' },
  demoTitle: { fontWeight: 700, color: '#333', marginBottom: '8px', display: 'flex', alignItems: 'center' },
  demoRow: { display: 'flex', alignItems: 'center', marginBottom: '4px' },
  footer: { textAlign: 'center', color: '#888', fontSize: '0.9rem', marginTop: '1rem' },
  link: { color: '#e94560', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
};
