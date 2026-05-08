import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/login?error=Authentication failed. Please try again.');
      return;
    }

    if (token) {
      try {
        // Save authentication details
        localStorage.setItem('token', token);
        localStorage.setItem('email', decodeURIComponent(email || ''));
        localStorage.setItem('userName', decodeURIComponent(name || ''));

        // Update auth context
        login(token, {
          email: decodeURIComponent(email || ''),
          name: decodeURIComponent(name || ''),
          role: 'user'
        });

        // Redirect to home
        setTimeout(() => {
          navigate('/home');
        }, 500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login?error=Failed to process authentication');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, login]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FFF5F7] to-[#FFE8ED]">
      <div className="text-center">
        <div className="mb-6">
          <svg className="animate-spin h-12 w-12 text-[#F78CA2] mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-2">
          Authenticating...
        </h2>
        <p className="text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
          Processing your Google login. Please wait.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
