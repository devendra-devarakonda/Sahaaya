import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Mail, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../utils/auth';
import { Alert, AlertDescription } from './ui/alert';

interface EmailVerificationProps {
  setCurrentPage: (page: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserProfile: (profile: any) => void;
}

export function EmailVerification({ setCurrentPage, setIsAuthenticated, setUserProfile }: EmailVerificationProps) {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the session from URL hash parameters
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to verify email. Please try again or contact support.');
          setVerifying(false);
          return;
        }

        if (session && session.user) {
          console.log('✅ Email verified successfully!', session.user);
          
          // Set user profile
          const role = session.user.user_metadata?.role as 'individual' | 'ngo';
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            role: role,
            avatar_url: session.user.user_metadata?.avatar_url
          });
          
          setIsAuthenticated(true);
          setVerifying(false);
          setVerified(true);
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            setCurrentPage('dashboard');
          }, 2000);
        } else {
          setError('No session found. The verification link may have expired.');
          setVerifying(false);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('An unexpected error occurred during verification.');
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [setCurrentPage, setIsAuthenticated, setUserProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
      <Card className="w-full max-w-md p-8 shadow-lg">
        {verified ? (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg animate-in zoom-in duration-300" 
                 style={{ backgroundColor: '#41695e' }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl" style={{ color: '#033b4a' }}>Email Verified Successfully!</h2>
            <p className="text-gray-600">Your account is now active. Redirecting to dashboard...</p>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#41695e] to-[#033b4a] rounded-full animate-pulse" 
                   style={{ width: '100%', transition: 'width 2s ease-in-out' }}></div>
            </div>
          </div>
        ) : verifying ? (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl" style={{ color: '#033b4a' }}>Verifying Your Email...</h2>
            <p className="text-gray-600">Please wait while we confirm your email address.</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#dc2626' }}>
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl" style={{ color: '#033b4a' }}>Verification Failed</h2>
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setCurrentPage('login')}
                style={{ backgroundColor: '#41695e' }}
                className="hover:opacity-90 transition-opacity"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => setCurrentPage('register')}
                variant="outline"
              >
                Register Again
              </Button>
              <Button
                onClick={() => setCurrentPage('home')}
                variant="outline"
              >
                Back to Home
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
