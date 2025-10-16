// // ForgotPassword.jsx
// import { useState } from 'react';
// import axios from 'axios';

// function ForgotPassword() {
//     const [email, setEmail] = useState('');
//     const [message, setMessage] = useState('');

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
//             setMessage(res.data.message);
//         } catch (err) {
//             setMessage(err.response.data.message);
//         }
//     };

//     return (
//         <div>
//             <h2>Forgot Password</h2>
//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//                 <button type="submit">Send Reset Link</button>
//             </form>
//             <p>{message}</p>
//         </div>
//     );
// }

// export default ForgotPassword;


import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';  // ✅ Import SweetAlert2
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      
      Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        text: res.data.message || 'Password reset link has been sent to your email.',
        confirmButtonColor: '#667eea',
        background: '#fff',
      });

      setEmail('');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.response?.data?.message || 'Something went wrong, please try again later.',
        confirmButtonColor: '#667eea',
        background: '#fff',
      });
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h2 className="brand-name">SurakshaPath</h2>
          <p className="brand-subtitle">Traffic Management System</p>
        </div>

        <h3 className="form-title">Forgot Your Password?</h3>
        <p className="form-subtitle">
          Enter your email address and we’ll send you instructions to reset your password.
        </p>

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            Send Reset Link
          </button>
        </form>

        <div className="back-to-login">
          <a href="/login" className="back-link">← Back to Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

