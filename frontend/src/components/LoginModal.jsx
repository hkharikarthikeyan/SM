import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function LoginModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Form states - completely empty by default
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Dharmapuri');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'register'
      ? `${API_BASE_URL}/api/supermarket/auth/register`
      : `${API_BASE_URL}/api/supermarket/auth/login`;

    const payload = mode === 'register' ? {
      name,
      username,
      password,
      state,
      district,
      address,
      contact_number: contactNumber
    } : {
      username,
      password
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `${mode === 'register' ? 'Registration' : 'Login'} failed`);
      }

      onLoginSuccess(data.token, data.user, data.supermarket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal" style={{ maxWidth: mode === 'register' ? '480px' : '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2.75rem', marginBottom: '0.25rem' }}>🏬</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Supermarket Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {mode === 'register' ? 'Register New Supermarket & Staff Account' : 'Supermarket Staff Sign In'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-primary)',
          padding: '0.25rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: mode === 'login' ? 'var(--accent-green)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)'
            }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: mode === 'register' ? 'var(--accent-green)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)'
            }}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register Supermarket
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Supermarket Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supermarket Name"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <select
                    className="form-input"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  >
                    {["Dharmapuri", "Chennai", "Coimbatore", "Salem", "Madurai", "Erode", "Namakkal", "Krishnagiri", "Tiruchirappalli", "Tiruppur", "Vellore"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contact Number"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'register' ? 'Create Supermarket Account' : 'Sign In to Dashboard')}
          </button>
        </form>
      </div>
    </div>
  );
}
