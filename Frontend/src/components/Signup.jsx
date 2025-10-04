import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? checked : value
  //   }));
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (formData.password !== formData.confirmPassword) {
  //     setMessage("Passwords do not match!");
  //     return;
  //   }

  //   if (!formData.terms) {
  //     setMessage("You must accept the Terms & Conditions");
  //     return;
  //   }

  //   try {
  //     const res = await axios.post('http://localhost:5000/api/auth/register', formData);
  //     setMessage('Signup successful!');
  //     console.log(res.data); // JWT token & user info
  //   } catch (err) {
  //     setMessage(err.response?.data?.message || 'Signup failed!');
  //   }
  // };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);

      if (res.data.user) {
        setMessage('Signup successful!');

        // 1️⃣ Save token and user info in localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // 2️⃣ Redirect to login or dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/login'; // change to '/login' if you want login page
        }, 2000);
      }
    } catch (error) {
      // 3️⃣ Handle backend errors
      if (error.response && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .signup-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
          overflow: hidden;
        }

        .shape {
          position: absolute;
          opacity: 0.1;
          animation: float 15s infinite ease-in-out;
        }

        .shape1 {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape2 {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }

        .shape3 {
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 20px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        .signup-card {
          background: white;
          border-radius: 28px;
          width: 100%;
          max-width: 1100px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          z-index: 2;
          position: relative;
          display: grid;
          grid-template-columns: 420px 1fr;
          overflow: hidden;
        }

        .card-left {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 38px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          position: relative;
        }

        .hero-title {
          font-size: 30px;
          font-weight: 700;
          margin-bottom: 14px;
          text-align: center;
          line-height: 1.3;
        }

        .hero-subtitle {
          font-size: 14px;
          text-align: center;
          opacity: 0.95;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .mini-skyline {
          width: 100%;
          height: 140px;
          position: relative;
          margin-bottom: 28px;
        }

        .building {
          position: absolute;
          bottom: 0;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px 6px 0 0;
          backdrop-filter: blur(10px);
        }

        .building1 {
          left: 15%;
          width: 52px;
          height: 95px;
        }

        .building2 {
          left: 30%;
          width: 44px;
          height: 70px;
        }

        .building3 {
          left: 45%;
          width: 58px;
          height: 110px;
        }

        .building4 {
          right: 30%;
          width: 48px;
          height: 82px;
        }

        .building5 {
          right: 15%;
          width: 55px;
          height: 100px;
        }

        .window {
          position: absolute;
          width: 6px;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 1px;
        }

        .moving-car {
          position: absolute;
          bottom: 8px;
          width: 28px;
          height: 18px;
          background: #3498db;
          border-radius: 4px;
          animation: driveAcross 6s linear infinite;
        }

        @keyframes driveAcross {
          0% { left: -30px; }
          100% { left: calc(100% + 30px); }
        }

        .stats-mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
        }

        .stat-mini {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          padding: 18px 12px;
          text-align: center;
          transition: transform 0.3s;
        }

        .stat-mini:hover {
          transform: translateY(-3px);
        }

        .stat-icon {
          font-size: 26px;
          margin-bottom: 8px;
        }

        .stat-number {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 3px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }

        .card-right {
          padding: 38px 42px;
          display: flex;
          flex-direction: column;
        }

        .signup-header {
          text-align: center;
          margin-bottom: 18px;
        }

        .brand-name {
          font-size: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .brand-subtitle {
          color: #95a5a6;
          font-size: 12px;
        }

        .signup-title {
          font-size: 26px;
          color: #2c3e50;
          margin-bottom: 20px;
          font-weight: 700;
          text-align: center;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 10px;
          padding: 12px 14px;
          transition: all 0.3s ease;
        }

        .input-group:focus-within {
          background: #e9ecef;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .input-icon {
          font-size: 16px;
          margin-right: 10px;
          color: #7f8c8d;
        }

        .input-field {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #2c3e50;
        }

        .input-field::placeholder {
          color: #95a5a6;
          font-size: 14px;
        }

        select.input-field {
          cursor: pointer;
        }

        .toggle-password {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          margin-left: 8px;
          opacity: 0.6;
          transition: opacity 0.3s;
        }

        .toggle-password:hover {
          opacity: 1;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 2px;
        }

        .checkbox {
          width: 15px;
          height: 15px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .checkbox-label {
          font-size: 12px;
          color: #7f8c8d;
          cursor: pointer;
        }

        .link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.3s;
        }

        .link:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .signup-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .signup-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .signup-button:active {
          transform: translateY(0);
        }

        .divider {
          text-align: center;
          margin: 15px 0 13px;
          position: relative;
          color: #95a5a6;
          font-size: 11px;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #e0e0e0;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .divider span {
          background: white;
          padding: 0 8px;
          position: relative;
          z-index: 1;
        }

        .google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #2c3e50;
          cursor: pointer;
          transition: all 0.3s;
        }

        .google-button:hover {
          background: #f8f9fa;
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .google-icon {
          width: 18px;
          height: 18px;
        }

        .signin-link {
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 13px;
        }

        @media (max-width: 900px) {
          .signup-card {
            grid-template-columns: 1fr;
            max-width: 440px;
          }

          .card-left {
            padding: 24px 20px;
          }

          .hero-title {
            font-size: 22px;
          }

          .mini-skyline {
            height: 90px;
          }

          .card-right {
            padding: 28px 30px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="signup-container">
        <div className="floating-shapes">
          <div className="shape shape1"></div>
          <div className="shape shape2"></div>
          <div className="shape shape3"></div>
        </div>

        <div className="signup-card">
          <div className="card-left">
            <h1 className="hero-title">Join SurakshaPath Today</h1>
            <p className="hero-subtitle">
              Transform urban traffic management with intelligent systems and real-time monitoring
            </p>

            <div className="mini-skyline">
              <div className="building building1">
                <div className="window" style={{top: '14px', left: '12px'}}></div>
                <div className="window" style={{top: '14px', right: '12px'}}></div>
                <div className="window" style={{top: '30px', left: '12px'}}></div>
                <div className="window" style={{top: '30px', right: '12px'}}></div>
                <div className="window" style={{top: '46px', left: '12px'}}></div>
                <div className="window" style={{top: '46px', right: '12px'}}></div>
                <div className="window" style={{top: '62px', left: '12px'}}></div>
                <div className="window" style={{top: '62px', right: '12px'}}></div>
              </div>
              <div className="building building2">
                <div className="window" style={{top: '12px', left: '10px'}}></div>
                <div className="window" style={{top: '12px', right: '10px'}}></div>
                <div className="window" style={{top: '28px', left: '10px'}}></div>
                <div className="window" style={{top: '28px', right: '10px'}}></div>
                <div className="window" style={{top: '44px', left: '10px'}}></div>
                <div className="window" style={{top: '44px', right: '10px'}}></div>
              </div>
              <div className="building building3">
                <div className="window" style={{top: '16px', left: '12px'}}></div>
                <div className="window" style={{top: '16px', right: '12px'}}></div>
                <div className="window" style={{top: '36px', left: '12px'}}></div>
                <div className="window" style={{top: '36px', right: '12px'}}></div>
                <div className="window" style={{top: '56px', left: '12px'}}></div>
                <div className="window" style={{top: '56px', right: '12px'}}></div>
                <div className="window" style={{top: '76px', left: '12px'}}></div>
                <div className="window" style={{top: '76px', right: '12px'}}></div>
              </div>
              <div className="building building4">
                <div className="window" style={{top: '14px', left: '11px'}}></div>
                <div className="window" style={{top: '14px', right: '11px'}}></div>
                <div className="window" style={{top: '32px', left: '11px'}}></div>
                <div className="window" style={{top: '32px', right: '11px'}}></div>
                <div className="window" style={{top: '50px', left: '11px'}}></div>
                <div className="window" style={{top: '50px', right: '11px'}}></div>
              </div>
              <div className="building building5">
                <div className="window" style={{top: '16px', left: '12px'}}></div>
                <div className="window" style={{top: '16px', right: '12px'}}></div>
                <div className="window" style={{top: '36px', left: '12px'}}></div>
                <div className="window" style={{top: '36px', right: '12px'}}></div>
                <div className="window" style={{top: '56px', left: '12px'}}></div>
                <div className="window" style={{top: '56px', right: '12px'}}></div>
                <div className="window" style={{top: '76px', left: '12px'}}></div>
                <div className="window" style={{top: '76px', right: '12px'}}></div>
              </div>
              <div className="moving-car"></div>
            </div>

            <div className="stats-mini">
              <div className="stat-mini">
                <div className="stat-icon">🚦</div>
                <div className="stat-number">500+</div>
                <div className="stat-label">Signals</div>
              </div>
              <div className="stat-mini">
                <div className="stat-icon">👥</div>
                <div className="stat-number">50K+</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat-mini">
                <div className="stat-icon">🏙️</div>
                <div className="stat-number">25+</div>
                <div className="stat-label">Cities</div>
              </div>
            </div>
          </div>

          <div className="card-right">
            <div className="signup-header">
              <h1 className="brand-name">SurakshaPath</h1>
              <p className="brand-subtitle">Traffic Management System</p>
            </div>
            
            <h2 className="signup-title">Sign up</h2>
            
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className="input-field"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    className="input-field"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🏢</span>
                <select
                  name="department"
                  className="input-field"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Traffic Management">Traffic Management</option>
                  <option value="Emergency Services">Emergency Services</option>
                  <option value="Monitoring & Control">Monitoring & Control</option>
                  <option value="System Administration">System Administration</option>
                  <option value="IT Support">IT Support</option>
                </select>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className="input-field"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="input-field"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="terms"
                  id="terms"
                  className="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <label htmlFor="terms" className="checkbox-label">
                  I agree to the <span className="link">Terms & Conditions</span>
                </label>
              </div>

              <button type="submit" className="signup-button">
                SIGN UP
              </button>

              {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
            </form>
            
            <div className="divider">
              <span>Or Sign up with social platform</span>
            </div>
            
            <button className="google-button">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <div className="signin-link">
              Already have an account? <span className="link">Sign In here</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;