import React, { useState, useEffect } from 'react';

export default function ProductsTab({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Product Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState('Rice');
  const [newUnit, setNewUnit] = useState('1 Kg');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('25');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:5001/api/supermarket/products?category=${selectedCategory}&search=${searchQuery}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        if (data.categories) setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const handleToggleAvailability = async (productId, currentVal) => {
    try {
      const res = await fetch(`http://localhost:5001/api/supermarket/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: !currentVal })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, availability: !currentVal } : p));
      }
    } catch (e) {
      alert('Error updating availability');
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/supermarket/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProductName,
          category: newCategory,
          unit: newUnit,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock),
          image_url: newImageUrl
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create product');
      }

      // Clear form and reload catalog
      setNewProductName('');
      setNewPrice('');
      setNewImageUrl('');
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search catalog..."
            style={{ maxWidth: '350px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1.25rem', whiteSpace: 'nowrap' }}
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add New Product
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--accent-green)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Stock Qty</th>
              <th>Availability Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No products found in catalog. Click "Add New Product" to add items.</td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛒</div>
                    )}
                  </td>
                  <td><strong>{p.name}</strong></td>
                  <td><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{p.category}</span></td>
                  <td>{p.unit}</td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹{p.price}</td>
                  <td>{p.stock_quantity} units</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={p.availability}
                        onChange={() => handleToggleAvailability(p.id, p.availability)}
                      />
                      <span className="slider"></span>
                    </label>
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: p.availability ? '#34d399' : '#f87171' }}>
                      {p.availability ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="login-modal-overlay">
          <div className="login-modal" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Supermarket Product</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            {addError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Ponni Rice"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {["Rice", "Pulses", "Vegetables", "Fruits", "Cooking Items", "Dairy", "Beverages", "Personal Care", "Household", "Snacks & Bakery", "General"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit / Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g. 5 Kg or 1 Liter"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 350"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="e.g. 25"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Profile Picture / Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <button type="submit" className="btn-primary" disabled={addLoading}>
                {addLoading ? 'Creating Product...' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
