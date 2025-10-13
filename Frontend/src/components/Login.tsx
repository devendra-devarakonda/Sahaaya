import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface LoginProps {
  setCurrentPage: (page: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserProfile: (profile: any) => void;
}

export function Login({ setCurrentPage, setIsAuthenticated, setUserProfile }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        const role = data.user.user_metadata?.role as 'individual' | 'ngo' || 'individual';
        setUserProfile({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          phone: data.user.user_metadata?.phone,
          role: role,
          avatar_url: data.user.user_metadata?.avatar_url
        });
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      }
    } catch (error: any) {
      // Handle email not confirmed error
      if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
        setError('Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.');
      } else {
        setError(error.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Google login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#41695e' }}>
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl" style={{ color: '#033b4a' }}>Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Sahaaya account to continue helping your community</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle style={{ color: '#033b4a' }}>Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500"
                    onClick={() => {/* Handle forgot password */}}
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full h-12"
                style={{ backgroundColor: isFormValid ? '#41695e' : undefined }}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentPage('role-selection')}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Help Text for Rural Users */}
        <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5f0' }}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#41695e' }}>
                <Heart className="h-3 w-3 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm" style={{ color: '#033b4a' }}>Need Help?</h4>
                <p className="text-xs text-gray-600">
                  If you're having trouble signing in, you can call our support helpline at{' '}
                  <span className="font-medium">1800-SAHAAYA</span> for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => setCurrentPage('home')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}