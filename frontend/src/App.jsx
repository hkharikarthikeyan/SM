import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sm_token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_user')) || null; } catch { return null; }
  });
  const [supermarket, setSupermarket] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_supermarket')) || null; } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = (newToken, newUser, newSupermarket) => {
    setToken(newToken);
    setUser(newUser);
    setSupermarket(newSupermarket);
    localStorage.setItem('sm_token', newToken);
    localStorage.setItem('sm_user', JSON.stringify(newUser));
    localStorage.setItem('sm_supermarket', JSON.stringify(newSupermarket));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setSupermarket(null);
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    localStorage.removeItem('sm_supermarket');
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/supermarket/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Error fetching supermarket orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh orders every 10 seconds for real-time dashboard updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  if (!token) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        supermarket={supermarket}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === 'orders' ? (
          <OrdersTab
            orders={orders}
            token={token}
            onOrderUpdate={fetchOrders}
          />
        ) : (
          <ProductsTab token={token} />
        )}
      </main>
    </div>
  );
}
