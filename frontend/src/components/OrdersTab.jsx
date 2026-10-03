import React, { useState } from 'react';

export default function OrdersTab({ orders, token, onOrderUpdate }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`http://localhost:5001/api/supermarket/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        onOrderUpdate();
      } else {
        alert(data.message || 'Could not update status');
      }
    } catch (e) {
      alert('Network error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus);

  const counts = {
    PLACED: orders.filter(o => o.status === 'PLACED').length,
    RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
    PACKING: orders.filter(o => o.status === 'PACKING').length,
    READY_FOR_PICKUP: orders.filter(o => o.status === 'READY_FOR_PICKUP').length,
    COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
  };

  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="orders-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>💰</div>
          <div>
            <div className="stat-val">₹{totalRevenue.toLocaleString()}</div>
            <div className="stat-lbl">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#60a5fa' }}>📥</div>
          <div>
            <div className="stat-val">{counts.PLACED}</div>
            <div className="stat-lbl">New Placed Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#c084fc' }}>📦</div>
          <div>
            <div className="stat-val">{counts.PACKING}</div>
            <div className="stat-lbl">Orders Packing</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f472b6' }}>🛍️</div>
          <div>
            <div className="stat-val">{counts.READY_FOR_PICKUP}</div>
            <div className="stat-lbl">Ready for Pickup</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#34d399' }}>✅</div>
          <div>
            <div className="stat-val">{counts.COMPLETED}</div>
            <div className="stat-lbl">Completed Orders</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['ALL', 'PLACED', 'RECEIVED', 'PACKING', 'READY_FOR_PICKUP', 'COMPLETED'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: filterStatus === st ? 'var(--accent-green)' : 'var(--bg-card)',
              color: filterStatus === st ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
          <p>No orders found matching the filter "{filterStatus}"</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order.id}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`status-badge status-${order.status}`}>{order.status}</span>
              </div>

              <div className="customer-info">
                <strong>Customer:</strong> {order.user_name} (@{order.user_username})<br />
                <strong>District:</strong> {order.supermarket_district}
              </div>

              <div className="order-items-list">
                {order.items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <span>{item.product_name} x {item.quantity} ({item.unit})</span>
                    <strong>₹{item.subtotal}</strong>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total (Pay at Store):</div>
                  <div className="total-amount">₹{order.total_amount}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    className="status-select"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="PACKING">PACKING</option>
                    <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
