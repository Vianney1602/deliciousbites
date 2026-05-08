import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import Toast from '../components/Toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: 'Please fix the errors in the form', type: 'error' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password
      });

      // Show success toast
      setToast({ 
        message: '🎉 Account created successfully! Redirecting...', 
        type: 'success' 
      });

      // Auto-login after registration
      localStorage.setItem('token', response.data.token);
      login(response.data.token, response.data.user);

      // Redirect after short delay
      setTimeout(() => {
        const returnTo = sessionStorage.getItem('returnTo');
        if (returnTo) {
          sessionStorage.removeItem('returnTo');
          navigate(returnTo);
        } else {
          navigate('/home');
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      const suggestion = err.response?.data?.suggestion;
      
      // If user already exists, show helpful message
      if (suggestion) {
        setErrors({ submit: `${errorMessage}. ${suggestion}` });
        setToast({ message: suggestion, type: 'error' });
      } else {
        setErrors({ submit: errorMessage });
        setToast({ message: errorMessage, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async (response) => {
    try {
      console.log('=== Google Sign-In Response ===');
      console.log('✅ Google callback triggered');
      console.log('Credential received:', response.credential ? 'YES' : 'NO');
      
      setLoading(true);
      
      // Send token to backend for verification and JWT creation
      const res = await api.post('/auth/verify-google-token', {
        token: response.credential
      });

      if (res.data.token) {
        console.log('✅ Backend returned JWT token');
        login(res.data.token, res.data.user);
        setToast({ message: '🎉 Account created! Redirecting...', type: 'success' });
        setTimeout(() => {
          const returnTo = sessionStorage.getItem('returnTo');
          if (returnTo) {
            sessionStorage.removeItem('returnTo');
            navigate(returnTo);
          } else {
            navigate('/home');
          }
        }, 800);
      }
    } catch (error) {
      console.error('❌ Google signup error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Google signup failed. Please try again.';
      console.error('Error details:', { status: error.response?.status, data: error.response?.data });
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const initializeGoogle = async () => {
      try {
        console.log(`\n🔄 Google Sign-In Initialization (Attempt ${retryCount + 1}/${maxRetries})`);
        console.log('window.google available:', !!window.google);
        console.log('document.getElementById("googleSignInButtonRegister"):', !!document.getElementById('googleSignInButtonRegister'));
        
        // Check if Google API is loaded
        if (!window.google) {
          console.warn('⏳ Google API not yet loaded, retrying...');
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(initializeGoogle, 1000);
          } else {
            console.error('❌ Google API failed to load after 5 attempts');
            setGoogleError('Google Sign-In unavailable');
          }
          return;
        }

        // Fetch the correct Client ID from backend
        console.log('📡 Fetching Client ID from backend...');
        const response = await fetch('http://localhost:5000/api/auth/google-client-id');
        if (!response.ok) {
          throw new Error(`Failed to fetch Client ID: ${response.status}`);
        }
        const data = await response.json();
        const clientId = data.clientId;

        if (!clientId) {
          throw new Error('Client ID is empty');
        }

        console.log('✅ Client ID fetched:', clientId.substring(0, 20) + '...');

        // Initialize Google ID
        console.log('🔧 Initializing window.google.accounts.id...');
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,
          hosted_domain: 'https://localhost:5173',
          auto_select: false
        });
        console.log('✅ window.google.accounts.id initialized');

        // Render button in the container
        console.log('🎨 Rendering Google Sign-In button...');
        const buttonElement = document.getElementById('googleSignInButtonRegister');
        
        if (!buttonElement) {
          console.error('❌ Button container not found in DOM');
          setGoogleError('Button container missing');
          return;
        }

        // Clear previous content
        buttonElement.innerHTML = '';

        window.google.accounts.id.renderButton(
          buttonElement,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
            logo_alignment: 'left'
          }
        );

        console.log('✅ Google button rendered successfully!');
        setGoogleButtonReady(true);
        setGoogleError(null);

      } catch (error) {
        console.error('❌ Google initialization error:', error.message);
        setGoogleError(error.message);
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`⏳ Retrying in 1 second...`);
          setTimeout(initializeGoogle, 1000);
        }
      }
    };

    // Start initialization with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeGoogle, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AuthLayout
        title="Join Us Today!"
        subtitle="Create your account and start ordering"
        image="🧁"
      >
        <div className="w-full max-w-[420px] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <InputField
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
              icon="👤"
              required
            />

            <InputField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              icon="📧"
              required
            />

            <InputField
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={errors.phone}
              icon="📱"
              required
              placeholder="+1 (555) 123-4567"
            />

            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
              showStrength={true}
              required
            />

            <PasswordInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              required
            />

            {/* Terms & Conditions */}
            <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors({ ...errors, terms: '' });
                  }
                }}
                className="mt-1 w-4 h-4 rounded border-2 border-[#FFD6DF] text-[#F78CA2] focus:ring-[#F78CA2] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-[#4A2C2A]/70 group-hover:text-[#F78CA2] transition-colors font-['Poppins',sans-serif]">
                I agree to the{' '}
                <Link to="/terms" className="text-[#F78CA2] hover:text-[#FF6B81] underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#F78CA2] hover:text-[#FF6B81] underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500 font-['Poppins',sans-serif] flex items-center gap-1 ml-7 animate-fadeIn">
                <span>⚠️</span>
                {errors.terms}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-['Poppins',sans-serif] animate-fadeIn">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-4 rounded-2xl font-semibold font-['Poppins',sans-serif]
              bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
              text-white shadow-lg shadow-[#F78CA2]/30
              hover:shadow-xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              transition-all duration-300
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <span>→</span>
              </>
            )}
          </button>

          {/* Google Sign-In Button Container */}
          <div className="space-y-3">
            {/* Google SDK Button */}
            <div 
              id="googleSignInButtonRegister"
              className="w-full flex justify-center"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                minHeight: '48px',
                borderRadius: '12px',
                backgroundColor: '#fff',
                padding: '2px'
              }}
            ></div>

            {/* Fallback Manual Google Button (if SDK fails) */}
            {!googleButtonReady && !googleError && (
              <button
                type="button"
                className="w-full py-3 rounded-2xl font-semibold font-['Poppins',sans-serif] border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <span style={{ fontSize: '20px' }}>🔵</span>
                <span>Sign up with Google</span>
              </button>
            )}

            {/* Error Message */}
            {googleError && (
              <button
                type="button"
                className="w-full py-3 rounded-2xl font-semibold font-['Poppins',sans-serif] border-2 border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300"
              >
                ⚠️ Google Sign-In Unavailable
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#FFD6DF]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#4A2C2A]/50 font-['Poppins',sans-serif]">
                or
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-[#4A2C2A]/70 text-sm font-['Poppins',sans-serif] mb-2">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#F78CA2] hover:text-[#FF6B81] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
      </AuthLayout>
    </>
  );
};

export default RegisterPage;
