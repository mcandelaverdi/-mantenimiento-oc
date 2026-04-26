'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

const DEMO_USERS = [
  { label: 'Gerente', usuario: 'gerente', password: 'gerente123' },
  { label: 'Encargado Valles', usuario: 'encargado1', password: 'encargado123' },
  { label: 'Encargado Prince', usuario: 'encargado2', password: 'encargado123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u) => {
    setUsuario(u.usuario);
    setPassword(u.password);
    setError('');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Bienvenido</h1>
        <p className="login-subtitle">Sistema de Órdenes de Compra</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: 8, textAlign: 'center' }}>Usuarios por defecto</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_USERS.map(u => (
              <button
                key={u.usuario}
                type="button"
                onClick={() => fillDemo(u)}
                style={{ background: '#f5f6fa', border: '1px solid #e0e0e0', borderRadius: 5, padding: '6px 10px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', color: '#444' }}
              >
                <strong>{u.label}</strong> — {u.usuario} / {u.password}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
