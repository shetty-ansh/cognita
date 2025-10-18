import { useState } from 'react';
import './Auth.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = () => {
    console.log('Auth submitted:', { email, password, isSignUp });
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1"></div>
      <div className="auth-blob auth-blob-2"></div>
      
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-brand">Cognita</h1>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="auth-toggle"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>

          <h2 className="auth-title">
            {isSignUp ? 'Sign up' : 'Log in'}
          </h2>

          {!isSignUp && (
            <button className="social-btn">
              <div className="social-icon">
                <span>G</span>
              </div>
              <span className="social-text">Login with Google</span>
            </button>
          )}

          <div className="input-group">
            <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <input
              type="email"
              placeholder="e-mail address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            {!isSignUp && (
              <button type="button" className="forgot-btn">
                I forgot
              </button>
            )}
          </div>


          <div className="submit-row">

            <p className="auth-text">
            {isSignUp 
              ? 'Happy to have you onboard!' 
              : 'Never stop growing!'}
          </p>

            <button onClick={handleSubmit} className="submit-btn">
              <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>

        {/* <div className="promo-card">
          <div className="promo-content">
            <div>
              <h3 className="promo-title">New in</h3>
              <p className="promo-subtitle">C.Lab Joints</p>
            </div>
            <button className="promo-btn">
              Discover
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Auth;