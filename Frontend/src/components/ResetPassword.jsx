import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${id}/${token}`, { password });
      
      Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: res.data.message || 'Your password has been updated successfully.',
        confirmButtonColor: '#667eea',
        background: '#fff',
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: err.response?.data?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#667eea',
        background: '#fff',
      });
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h2 className="brand-name">SurakshaPath</h2>
          <p className="brand-subtitle">Traffic Management System</p>
        </div>

        <h3 className="form-title">Reset Your Password</h3>
        <p className="form-subtitle">
          Please enter your new password below to regain access to your account.
        </p>

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            Reset Password
          </button>
        </form>

        <div className="back-to-login">
          <a href="/login" className="back-link">← Back to Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
