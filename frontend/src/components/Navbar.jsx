import React from 'react';

export default function Navbar({ activeTab, onTabChange, supermarket, user, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">🏬</div>
        <div>
          <h1 className="brand-title">Supermarket Admin Portal</h1>
          <p className="brand-subtitle">{supermarket ? supermarket.name : 'Store Manager Dashboard'}</p>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => onTabChange('orders')}
        >
          📋 Incoming Orders
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => onTabChange('products')}
        >
          📦 Product Catalog & Stock
        </button>
      </nav>

      <div className="user-badge">
        <span className="store-name">👤 {user ? user.name : 'Staff'}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
