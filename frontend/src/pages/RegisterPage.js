import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.data);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.data
        ? Object.values(err.response.data.data).join(', ')
        : err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'username', label: 'Username', icon: 'pi-user', type: 'text', placeholder: 'Choose a username' },
    { key: 'email',    label: 'Email',    icon: 'pi-envelope', type: 'email', placeholder: 'Enter your email' },
    { key: 'password', label: 'Password', icon: 'pi-lock', type: showPwd ? 'text' : 'password', placeholder: 'Min. 6 characters' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <i className="pi pi-user-plus" style={styles.logo}></i>
        </div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join ShopManager today</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map(f => (
            <div key={f.key} style={styles.fieldGroup}>
              <label style={styles.label}>
                <i className={`pi ${f.icon}`} style={styles.labelIcon}></i>{f.label}
              </label>
              <div style={styles.inputWrap}>
                <i className={`pi ${f.icon}`} style={styles.inputIcon}></i>
                <input
                  style={{ ...styles.input, ...(f.key === 'password' ? { paddingRight: '40px' } : {}) }}
                  type={f.type} placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required
                />
                {f.key === 'password' && (
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPwd(p => !p)}>
                    <i className={`pi ${showPwd ? 'pi-eye-slash' : 'pi-eye'}`} style={{ color: '#aaa' }}></i>
                  </button>
                )}
              </div>
            </div>
          ))}

          <button style={{ ...styles.btn, ...(loading ? styles.btnLoading : {}) }} disabled={loading}>
            {loading
              ? <><i className="pi pi-spin pi-spinner" style={{ marginRight: 8 }}></i>Creating account...</>
              : <><i className="pi pi-user-plus" style={{ marginRight: 8 }}></i>Create Account</>
            }
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?&nbsp;
          <Link to="/login" style={styles.link}>
            <i className="pi pi-sign-in" style={{ marginRight: 4 }}></i>Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8, #e8edf5)', padding: '2rem' },
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
  input: { width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  eyeBtn: { position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  btn: { padding: '13px', background: 'linear-gradient(135deg, #e94560, #c0392b)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' },
  btnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  footer: { textAlign: 'center', color: '#888', fontSize: '0.9rem', marginTop: '1.2rem' },
  link: { color: '#e94560', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
};
