import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

interface EmailVerificationProps {
  setCurrentPage: (page: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserProfile: (profile: any) => void;
}

export function EmailVerification({ setCurrentPage, setIsAuthenticated, setUserProfile }: EmailVerificationProps) {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');

        console.log('Email verification parameters:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, hasTokenHash: !!tokenHash });

        if (type === 'signup' || type === 'email_change') {
          if (tokenHash && type) {
            // Use the verifyOtp method for email verification
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as any
            });

            if (error) {
              console.error('Email verification error:', error);
              if (error.message.includes('expired') || error.message.includes('invalid')) {
                setVerificationStatus('expired');
                setErrorMessage('The verification link has expired or is invalid. Please request a new one.');
              } else {
                setVerificationStatus('error');
                setErrorMessage(error.message || 'Email verification failed. Please try again.');
              }
              return;
            }

            if (data.user) {
              console.log('Email verification successful:', data.user);
              setVerificationStatus('success');
              
              // Set user profile and authenticate
              setUserProfile({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                phone: data.user.user_metadata?.phone,
                avatar_url: data.user.user_metadata?.avatar_url
              });
              setIsAuthenticated(true);

              // Redirect to dashboard after 2 seconds
              setTimeout(() => {
                setCurrentPage('dashboard');
              }, 2000);
            }
          } else if (accessToken && refreshToken) {
            // Handle OAuth or magic link flow
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('Session setup error:', error);
              setVerificationStatus('error');
              setErrorMessage(error.message || 'Failed to set up session. Please try logging in again.');
              return;
            }

            if (data.user) {
              console.log('Session setup successful:', data.user);
              setVerificationStatus('success');
              
              setUserProfile({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                phone: data.user.user_metadata?.phone,
                avatar_url: data.user.user_metadata?.avatar_url
              });
              setIsAuthenticated(true);

              setTimeout(() => {
                setCurrentPage('dashboard');
              }, 2000);
            }
          } else {
            setVerificationStatus('error');
            setErrorMessage('Invalid verification link. Missing required parameters.');
          }
        } else {
          setVerificationStatus('error');
          setErrorMessage('Invalid verification type. Please check your email link.');
        }
      } catch (error) {
        console.error('Unexpected verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred during verification. Please try again.');
      }
    };

    handleEmailVerification();
  }, [setCurrentPage, setIsAuthenticated, setUserProfile]);

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });

      if (error) {
        console.error('Resend verification error:', error);
        setErrorMessage(error.message || 'Failed to resend verification email.');
      } else {
        setErrorMessage('');
        // Show success message by temporarily changing status
        const originalStatus = verificationStatus;
        setVerificationStatus('success');
        setTimeout(() => {
          setVerificationStatus(originalStatus);
        }, 3000);
      }
    } catch (error) {
      console.error('Unexpected resend error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderVerificationContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl" style={{ color: '#033b4a' }}>Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl" style={{ color: '#033b4a' }}>Email Verified Successfully!</h2>
            <p className="text-gray-600">Your email has been verified. You're being redirected to your dashboard...</p>
            <div className="w-8 h-1 bg-gradient-to-r from-[#41695e] to-[#033b4a] rounded-full mx-auto animate-pulse"></div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg bg-orange-500">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl" style={{ color: '#033b4a' }}>Verification Link Expired</h2>
              <p className="text-gray-600">{errorMessage}</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: '#033b4a' }}>
                  Enter your email to receive a new verification link:
                </label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#41695e] focus:border-transparent"
                />
              </div>
              
              <Button
                onClick={handleResendVerification}
                disabled={isResending || !resendEmail.trim()}
                className="w-full"
                style={{ backgroundColor: '#41695e' }}
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send New Verification Email'
                )}
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg bg-red-500">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl" style={{ color: '#033b4a' }}>Verification Failed</h2>
              <p className="text-gray-600">{errorMessage}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setCurrentPage('login')}
                variant="outline"
                className="border-[#41695e] text-[#41695e] hover:bg-[#41695e] hover:text-white"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => setCurrentPage('register')}
                style={{ backgroundColor: '#41695e' }}
              >
                Try Registration Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
      <Card className="w-full max-w-md p-8 shadow-lg">
        {renderVerificationContent()}
      </Card>
    </div>
  );
}