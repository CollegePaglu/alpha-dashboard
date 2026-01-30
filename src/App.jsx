import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import SnacksCatalog from './pages/SnacksCatalog';
import { LayoutDashboard, User, CheckSquare, Wallet, Building2, LogOut, Zap } from 'lucide-react';
import clsx from 'clsx';

// API Configuration
const API_BASE = 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alphaToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Auth Provider
function AuthProvider({ children }) {
  const [alpha, setAlpha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('alphaToken');
    const storedAlpha = localStorage.getItem('alphaData');
    if (token && storedAlpha) {
      setAlpha(JSON.parse(storedAlpha));
    }
    setLoading(false);
  }, []);

  const login = (alphaData, tokens) => {
    localStorage.setItem('alphaToken', tokens.accessToken);
    localStorage.setItem('alphaRefreshToken', tokens.refreshToken);
    localStorage.setItem('alphaData', JSON.stringify(alphaData));
    setAlpha(alphaData);
  };

  const logout = () => {
    localStorage.removeItem('alphaToken');
    localStorage.removeItem('alphaRefreshToken');
    localStorage.removeItem('alphaData');
    setAlpha(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ alpha, login, logout, isAuthenticated: !!alpha }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Login Page
function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [phone, setPhone] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/send', { phone, collegeId });
      setDevOtp(res.data.otp || '');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      console.error('OTP Error:', err.response?.data);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', { phone, collegeId, otp });
      // Response structure is { success: true, data: { user, tokens } }
      const { user, tokens } = res.data.data || res.data;
      if (user && tokens) {
        login(user, tokens);
        navigate('/');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card glass">
        <div className="login-header">
          <h1>⚡ Alpha Dashboard</h1>
          <p>CollegePaglu Freelancer Portal</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 'credentials' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>College ID</label>
              <input
                type="text"
                placeholder="ALPHA001"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
              {devOtp && <small className="dev-otp">Dev OTP: {devOtp}</small>}
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep('credentials')}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ active }) {
  const { alpha, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    { id: 'assignments', icon: CheckSquare, label: 'Assignments', path: '/assignments' },
    { id: 'earnings', icon: Wallet, label: 'Earnings', path: '/earnings' },
    { id: 'bank', icon: Building2, label: 'Bank Details', path: '/bank' },
  ];

  return (
    <aside className="w-72 fixed inset-y-0 left-0 bg-base-100/30 backdrop-blur-xl border-r border-base-200 flex flex-col z-50">
      <div className="h-24 flex items-center px-8 border-b border-base-200/50">
        <h2 className="text-2xl font-display font-medium text-dark flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="text-dark">Alpha</span>
        </h2>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white/50 shadow-sm mb-6">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {alpha?.userName?.[0] || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-dark text-sm truncate">{alpha?.userName || 'Welcome'}</p>
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <p className="text-xs text-primary/60 uppercase tracking-widest font-medium">{alpha?.status || 'Active'}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 space-y-2 pb-6 no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={clsx(
                "w-full flex items-center px-5 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 group relative",
                isActive
                  ? "bg-base-white border border-base-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-dark"
                  : "text-primary/70 hover:bg-white/40 hover:text-primary border border-transparent"
              )}
            >
              <Icon className={clsx("w-5 h-5 mr-4 transition-colors", isActive ? "text-dark" : "text-primary/50 group-hover:text-primary/80")} />
              <span className={clsx(isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-base-200/50">
        <button
          className="w-full flex items-center px-5 py-3 text-red-700/80 hover:bg-red-50 rounded-xl transition-all duration-300 text-sm font-medium"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-3 opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}

// Dashboard Page
function DashboardPage() {
  const { alpha } = useAuth();

  return (
    <div className="page-container">
      <Sidebar active="dashboard" />
      <main className="main-content">
        <h1>Welcome, {alpha?.userName || 'Alpha'}! 👋</h1>
        <div className="stats-grid">
          <div className="stat-card glass earnings">
            <h3>💰 Total Earnings</h3>
            <div className="stat-value">₹{alpha?.earnings?.total || 0}</div>
            <div className="stat-detail">Lifetime earnings</div>
          </div>
          <div className="stat-card glass pending">
            <h3>⏳ Pending</h3>
            <div className="stat-value">₹{alpha?.earnings?.pending || 0}</div>
            <div className="stat-detail">Awaiting release</div>
          </div>
          <div className="stat-card glass withdrawn">
            <h3>✅ Withdrawn</h3>
            <div className="stat-value">₹{alpha?.earnings?.withdrawn || 0}</div>
            <div className="stat-detail">Successfully transferred</div>
          </div>
          <div className="stat-card glass completed">
            <h3>📝 Completed</h3>
            <div className="stat-value">{alpha?.completedAssignments || 0}</div>
            <div className="stat-detail">Assignments done</div>
          </div>
          <div className="stat-card glass rating">
            <h3>⭐ Rating</h3>
            <div className="stat-value">{alpha?.rating?.toFixed(1) || '0.0'}</div>
            <div className="stat-detail">From {alpha?.totalRatings || 0} reviews</div>
          </div>
          <div className="stat-card glass status">
            <h3>🔖 Status</h3>
            <div className="stat-value capitalize">{alpha?.status || 'unknown'}</div>
            <div className="stat-detail">{alpha?.isAvailable ? 'Available' : 'Unavailable'}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Profile Page
function ProfilePage() {
  const { alpha } = useAuth();

  return (
    <div className="page-container">
      <Sidebar active="profile" />
      <main className="main-content">
        <h1>My Profile</h1>
        <div className="profile-card glass">
          <div className="profile-header">
            <div className="profile-avatar">
              {alpha?.userAvatar ? (
                <img src={alpha.userAvatar} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">⚡</div>
              )}
            </div>
            <div className="profile-info">
              <h2>{alpha?.userName || 'Alpha User'}</h2>
              <p className="phone">{alpha?.phone}</p>
              <span className={`badge ${alpha?.status}`}>{alpha?.status}</span>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-row">
              <span className="label">College ID</span>
              <span className="value">{alpha?.collegeId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Skills</span>
              <span className="value">{alpha?.skills?.join(', ') || 'Not specified'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Bio</span>
              <span className="value">{alpha?.bio || 'No bio added'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Available</span>
              <span className="value">{alpha?.isAvailable ? 'Yes ✅' : 'No ❌'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Min Budget</span>
              <span className="value">₹{alpha?.minBudget || 0}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Assignments Page
// Assignments Page
function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get('/alphas/assignments');
        setAssignments(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
      setLoading(false);
    };
    fetchAssignments();
  }, []);

  // Start Work (assigned → in_progress)
  const handleStartWork = async (id) => {
    try {
      await api.post(`/alphas/assignments/${id}/accept`);
      setAssignments(assignments.map(a =>
        a._id === id ? { ...a, status: "in_progress" } : a
      ));
    } catch (err) {
      alert("Failed to start work");
    }
  };

  // Mark Completed (in_progress → completed)
  const handleComplete = async (id) => {
    try {
      await api.post(`/alphas/assignments/${id}/complete`);
      setAssignments(assignments.map(a =>
        a._id === id ? { ...a, status: "completed" } : a
      ));
    } catch (err) {
      alert("Failed to complete assignment");
    }
  };

  const getRequesterName = (requester) => {
    if (!requester) return 'Unknown';
    return requester.displayName ||
      (requester.firstName ? `${requester.firstName} ${requester.lastName || ''}`.trim() : 'Unknown');
  };

  return (
    <div className="page-container">
      <Sidebar active="assignments" />
      <main className="main-content">
        <h1>My Assignments</h1>

        {loading ? (
          <div className="loading">Loading assignments...</div>
        ) : (
          <div className="assignments-list">

            {assignments.length === 0 ? (
              <div className="empty-state glass">
                <p>📝 No assignments yet</p>
                <small>New assignments will appear here when assigned</small>
              </div>
            ) : assignments.map((assignment) => (

              <div key={assignment._id} className="assignment-card glass">

                <div className="assignment-header">
                  <h3>{assignment.title}</h3>
                  <span className={`badge ${assignment.status}`}>
                    {assignment.status.replace("_", " ")}
                  </span>
                </div>

                <div className="assignment-requester">
                  <span className="label">Requested by:</span>
                  <div className="requester-info">
                    <span className="value">{getRequesterName(assignment.requester)}</span>
                    {assignment.requester?.phone && (
                      <span className="phone-value">📞 {assignment.requester.phone}</span>
                    )}
                  </div>
                </div>

                <p className="assignment-desc">{assignment.description}</p>

                {/* Attachments Section */}
                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div className="assignment-attachments">
                    <span className="label">Attachments:</span>
                    <div className="attachment-list">
                      {assignment.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📄 View File {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="assignment-meta">
                  <span>💰 ₹{assignment.agreedPrice || assignment.budget?.min || 0}</span>
                  <span>📅 Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                  <span>📁 {assignment.type}</span>
                </div>

                {/* ACTION BUTTONS */}
                <div className="assignment-actions">

                  {assignment.status === "assigned" && (
                    <button
                      className="status-btn start"
                      onClick={() => handleStartWork(assignment._id)}
                    >
                      ▶ Start Work
                    </button>
                  )}

                  {assignment.status === "in_progress" && (
                    <button
                      className="status-btn complete"
                      onClick={() => handleComplete(assignment._id)}
                    >
                      ✅ Mark Completed
                    </button>
                  )}

                  {assignment.status === "completed" && (
                    <button className="status-btn done" disabled>
                      ✔ Completed
                    </button>
                  )}

                </div>

              </div>

            ))}
          </div>
        )}
      </main>
    </div>
  );
}


// Earnings Page
function EarningsPage() {
  const { alpha } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/alphas/earnings');
        setPayments(res.data.recentPayments || []);
      } catch (err) {
        console.error('Failed to fetch earnings:', err);
      }
      setLoading(false);
    };
    fetchEarnings();
  }, []);

  return (
    <div className="page-container">
      <Sidebar active="earnings" />
      <main className="main-content">
        <h1>Earnings & Payments</h1>

        <div className="earnings-summary glass">
          <div className="summary-item">
            <span className="label">Total Earnings</span>
            <span className="value">₹{alpha?.earnings?.total || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Pending</span>
            <span className="value pending">₹{alpha?.earnings?.pending || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Withdrawn</span>
            <span className="value success">₹{alpha?.earnings?.withdrawn || 0}</span>
          </div>
        </div>

        <h2>Payment History</h2>
        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : (
          <div className="table-container glass">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="4">No payment history</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>₹{payment.amount}</td>
                    <td>₹{payment.netAmount}</td>
                    <td><span className={`badge ${payment.status}`}>{payment.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// Bank Details Page
function BankPage() {
  const { alpha } = useAuth();
  const [formData, setFormData] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/alphas/bank-details', formData);
      alert('Bank details updated successfully!');
    } catch (err) {
      alert('Failed to update bank details');
    }
    setSaving(false);
  };

  return (
    <div className="page-container">
      <Sidebar active="bank" />
      <main className="main-content">
        <h1>Bank Details</h1>

        <div className="bank-info glass">
          <h3>Current Bank Details</h3>
          <div className="detail-row">
            <span className="label">Bank Name</span>
            <span className="value">{alpha?.bankDetails?.bankName || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Account Holder</span>
            <span className="value">{alpha?.bankDetails?.accountHolderName || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Verified</span>
            <span className="value">{alpha?.bankDetails?.isVerified ? '✅ Yes' : '❌ No'}</span>
          </div>
        </div>

        <div className="bank-form glass">
          <h3>Update Bank Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Enter account number"
                required
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                placeholder="ABCD0001234"
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="State Bank of India"
                required
              />
            </div>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                placeholder="As per bank records"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Bank Details'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
          <Route path="/bank" element={<ProtectedRoute><BankPage /></ProtectedRoute>} />
          <Route path="/snacks" element={<ProtectedRoute><SnacksCatalog /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
