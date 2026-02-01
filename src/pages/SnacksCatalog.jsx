/**
 * SnacksCatalog - Alpha Dashboard
 * User-facing snacks browsing and ordering interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import '../pages/SnacksCatalog.css';

const SnacksCatalog = () => {
  const navigate = useNavigate();
  const [snacks, setSnacks] = useState([]);
  const [filteredSnacks, setFilteredSnacks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showCart, setShowCart] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [categories, setCategories] = useState([]);

  // Fetch snacks and vendors
  useEffect(() => {
    fetchSnacks();
    fetchVendors();
  }, []);

  // Filter snacks whenever filters change
  useEffect(() => {
    applyFilters();
  }, [snacks, searchTerm, selectedCategory, selectedVendor, priceRange, sortBy]);

  const fetchSnacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/lazypeeps/snacks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      const snacksList = data.data || [];
      setSnacks(snacksList);

      // Extract unique categories
      const uniqueCategories = [...new Set(snacksList.map((s) => s.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching snacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/vendors?isOpen=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const applyFilters = () => {
    let filtered = snacks.filter((snack) => {
      // Search filter
      if (
        searchTerm &&
        !snack.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && snack.category !== selectedCategory) {
        return false;
      }

      // Vendor filter
      if (selectedVendor !== 'all' && snack.vendorId !== selectedVendor) {
        return false;
      }

      // Price range filter
      if (snack.price < priceRange[0] || snack.price > priceRange[1]) {
        return false;
      }

      // Availability filter
      if (!snack.isAvailable) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredSnacks(filtered);
  };

  const addToCart = (snack) => {
    const existingItem = cart.find((item) => item._id === snack._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === snack._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...snack, quantity: 1 }]);
    }
  };

  const removeFromCart = (snackId) => {
    setCart(cart.filter((item) => item._id !== snackId));
  };

  const updateQuantity = (snackId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(snackId);
    } else {
      setCart(
        cart.map((item) =>
          item._id === snackId ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: calculateTotal(),
        vendorId: cart[0].vendorId,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/lazypeeps/snack-orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (response.ok) {
        alert('Order placed successfully!');
        setCart([]);
        setShowCart(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    }
  };

  const cartTotal = calculateTotal();
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="snacks-catalog">
      {/* Header */}
      <div className="catalog-header">
        <h1>🍕 LazyPeeps Snacks</h1>
        <div className="header-actions">
          <button
            className={`btn-cart ${showCart ? 'active' : ''}`}
            onClick={() => setShowCart(!showCart)}
          >
            🛒 Cart ({cartCount}) • ₹{cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      <div className="catalog-container">
        {/* Sidebar - Filters */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search snacks..."
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <div className="filter-options">
              <label>
                <input
                  type="radio"
                  value="all"
                  checked={selectedCategory === 'all'}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                All Categories
              </label>
              {categories.map((cat) => (
                <label key={cat}>
                  <input
                    type="radio"
                    value={cat}
                    checked={selectedCategory === cat}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Vendor Filter */}
          <div className="filter-group">
            <label>Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.businessName}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <label>Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</label>
            <input
              type="range"
              min="0"
              max="500"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], parseInt(e.target.value)])
              }
              className="filter-range"
            />
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="newest">🆕 Newest</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💸 Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="catalog-content">
          {/* Cart Drawer */}
          {showCart && (
            <div className="cart-drawer">
              <h2>Shopping Cart</h2>
              {cart.length === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item._id} className="cart-item">
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <p>₹{item.price.toFixed(2)} each</p>
                        </div>
                        <div className="item-quantity">
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="item-total">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => removeFromCart(item._id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Fee:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    className="btn-checkout"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          )}

          {/* Snacks Grid */}
          {loading ? (
            <div className="loading">Loading snacks...</div>
          ) : filteredSnacks.length === 0 ? (
            <div className="empty-state">
              <h3>No snacks found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="snacks-grid">
              {filteredSnacks.map((snack) => (
                <div key={snack._id} className="snack-card">
                  <div className="snack-image">
                    {snack.images?.[0] ? (
                      <img src={snack.images[0]} alt={snack.name} />
                    ) : (
                      <div className="placeholder">🍕</div>
                    )}
                  </div>
                  <div className="snack-content">
                    <h3>{snack.name}</h3>
                    <p className="vendor-name">
                      by{' '}
                      {vendors.find((v) => v._id === snack.vendorId)
                        ?.businessName || 'Unknown'}
                    </p>
                    <p className="description">{snack.description}</p>
                    <div className="snack-footer">
                      <div className="rating">
                        {'⭐'.repeat(Math.floor(snack.rating || 0))}{' '}
                        <span className="rating-text">
                          {snack.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="price-section">
                        <span className="price">₹{snack.price.toFixed(2)}</span>
                        {snack.originalPrice && (
                          <span className="original-price">
                            ₹{snack.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn-add-to-cart"
                      onClick={() => addToCart(snack)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SnacksCatalog;
