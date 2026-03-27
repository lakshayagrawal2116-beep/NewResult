import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import './AdminLogin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg">
        <div className="admin-login-orb orb-1" />
        <div className="admin-login-orb orb-2" />
        <div className="admin-login-orb orb-3" />
      </div>

      <form className="admin-login-card" onSubmit={handleLogin}>
        <div className="admin-login-icon">
          <Shield size={40} />
        </div>
        <h1 className="admin-login-title">Admin Portal</h1>
        <p className="admin-login-subtitle">Sign in to manage student results</p>

        {error && (
          <div className="admin-login-error">
            <span>{error}</span>
          </div>
        )}

        <div className="admin-input-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin username"
            required
            autoFocus
          />
        </div>

        <div className="admin-input-group">
          <label>Password</label>
          <div className="admin-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="admin-login-btn" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
