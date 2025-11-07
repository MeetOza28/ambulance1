import React, { useState } from 'react';
import '../styles/Login.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please enter both email and password.',
        confirmButtonColor: '#f39c12',
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token
        if (rememberMe) localStorage.setItem('token', data.token);
        else sessionStorage.setItem('token', data.token);

        Swal.fire({
          icon: 'success',
          title: 'Login Successful 🎉',
          text: `Welcome back, ${data.user.name}! Redirecting...`,
          showConfirmButton: false,
          timer: 2000,
        });

        setTimeout(() => navigate('/'), 2000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message || 'Invalid email or password',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Try again later.',
        confirmButtonColor: '#d33',
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Side - Welcome Section */}
        <div className="card-left">
          <div className="decorative-blur blur-1"></div>
          <div className="decorative-blur blur-2"></div>

          <div className="card-left-content">
            {/* Welcome Section */}
            <div className="welcome-section">
              <h1>Welcome Back to SurakshaPath</h1>
              <p>Transform urban traffic management with intelligent systems and real-time monitoring</p>
            </div>

            {/* Illustration Section */}
            <div className="illustration-section">
              <svg className="traffic-illustration" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                {/* Traffic Light Post */}
                <rect x="185" y="220" width="30" height="180" fill="#1e293b" rx="5"/>
                
                {/* Traffic Light Box */}
                <rect x="160" y="120" width="80" height="140" fill="#334155" rx="10"/>
                <rect x="165" y="125" width="70" height="130" fill="#1e293b" rx="8"/>
                
                {/* Traffic Lights */}
                <circle cx="200" cy="155" r="20" fill="#ef4444" opacity="0.3"/>
                <circle cx="200" cy="195" r="20" fill="#f59e0b" opacity="0.3"/>
                <circle cx="200" cy="235" r="20" fill="#10b981" opacity="1">
                  <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                {/* Road */}
                <rect x="0" y="350" width="400" height="50" fill="#334155"/>
                
                {/* Road Lines */}
                <rect x="20" y="370" width="60" height="10" fill="#e2e8f0" rx="5">
                  <animate attributeName="x" from="-60" to="400" dur="2s" repeatCount="indefinite"/>
                </rect>
                <rect x="120" y="370" width="60" height="10" fill="#e2e8f0" rx="5">
                  <animate attributeName="x" from="40" to="500" dur="2s" repeatCount="indefinite"/>
                </rect>
                
                {/* Car */}
                <g className="car">
                  <rect x="280" y="320" width="80" height="30" fill="#3b82f6" rx="5"/>
                  <rect x="290" y="310" width="60" height="15" fill="#60a5fa" rx="3"/>
                  <circle cx="295" cy="350" r="8" fill="#1e293b"/>
                  <circle cx="345" cy="350" r="8" fill="#1e293b"/>
                </g>
                
                {/* Ambulance */}
                <g className="ambulance">
                  <rect x="80" y="315" width="90" height="35" fill="#ef4444" rx="5"/>
                  <rect x="90" y="305" width="70" height="15" fill="#dc2626" rx="3"/>
                  <circle cx="95" cy="350" r="10" fill="#1e293b"/>
                  <circle cx="155" cy="350" r="10" fill="#1e293b"/>
                  
                  {/* Red Cross */}
                  <rect x="118" y="318" width="8" height="20" fill="white"/>
                  <rect x="112" y="324" width="20" height="8" fill="white"/>
                  
                  {/* Siren Effect */}
                  <circle cx="125" cy="295" r="5" fill="#ef4444">
                    <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite"/>
                  </circle>
                </g>
              </svg>
            </div>

            {/* Features Section */}
            <div className="features-section">
              <div className="feature-badge">
                <span className="badge-icon">🚦</span>
                <span className="badge-text">Real-time Control</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">📊</span>
                <span className="badge-text">Live Analytics</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">🚨</span>
                <span className="badge-text">Emergency Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="card-right">
          <div className="login-form-container">
            <div className="brand-section">
              <h1 className="brand-name">SurakshaPath</h1>
              <p className="brand-subtitle">Traffic Management System</p>
            </div>

            <h2 className="signin-title">Sign in</h2>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-field">
                <span className="field-icon">👤</span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field password-field">
                <span className="field-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="toggle-password" onClick={togglePassword}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <a href="/forgot-password" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="login-btn">
                LOGIN
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{" "}
                <a href="/Signup" className="signup-link">Sign Up here</a>
              </p>
            </div>

            <div className="social-divider">
              Or Sign in with social platform
            </div>

            <div className="social-buttons">
              <button className="google-signin-btn">
                <img 
                  src="https://www.svgrepo.com/show/355037/google.svg" 
                  alt="Google logo" 
                  className="google-icon"
                />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;