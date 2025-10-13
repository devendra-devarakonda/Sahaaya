import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle,
  Info,
  Building2,
  Upload
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface RegisterProps {
  setCurrentPage: (page: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserProfile: (profile: any) => void;
  selectedRole?: 'individual' | 'ngo' | null;
}

export function Register({ setCurrentPage, setIsAuthenticated, setUserProfile, selectedRole }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    ngoName: '',
    registrationProof: null as File | null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Redirect to role selection if no role is selected
  if (!selectedRole) {
    setCurrentPage('role-selection');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const getFormProgress = () => {
    if (selectedRole === 'individual') {
      const fields = [formData.name, formData.email, formData.phone, formData.password, formData.confirmPassword];
      const filledFields = fields.filter(field => field.length > 0);
      return Math.round((filledFields.length / fields.length) * 100);
    } else {
      const fields = [formData.ngoName, formData.email, formData.phone, formData.password, formData.confirmPassword];
      const filledFields = fields.filter(field => field.length > 0);
      const fileProgress = formData.registrationProof ? 1 : 0;
      return Math.round(((filledFields.length + fileProgress) / (fields.length + 1)) * 100);
    }
  };

  const isFormValid = selectedRole === 'individual' 
    ? formData.name && formData.email && formData.phone && isPasswordValid && passwordsMatch
    : formData.ngoName && formData.email && formData.phone && isPasswordValid && passwordsMatch && formData.registrationProof;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Register user with Supabase
      const userData = selectedRole === 'individual' 
        ? {
            name: formData.name,
            phone: formData.phone,
            role: 'individual'
          }
        : {
            name: formData.ngoName,
            phone: formData.phone,
            role: 'ngo'
          };

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      if (data.user) {
        // Check if user needs email confirmation
        if (!data.session) {
          // Show success message for email confirmation
          setError('');
          setShowEmailConfirmation(true);
          return;
        }

        // Set user profile from the registration data
        setUserProfile({
          id: data.user.id,
          email: data.user.email,
          name: selectedRole === 'individual' ? formData.name : formData.ngoName,
          phone: formData.phone,
          role: selectedRole,
          avatar_url: data.user.user_metadata?.avatar_url
        });
        
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
      setError(error.message || 'Google registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        if (selectedRole === 'individual') {
          return formData.name && formData.email;
        } else {
          return formData.ngoName && formData.email;
        }
      case 2:
        const phonePasswordValid = formData.phone && formData.password && isPasswordValid;
        if (selectedRole === 'ngo') {
          return phonePasswordValid && formData.registrationProof;
        }
        return phonePasswordValid;
      case 3:
        return passwordsMatch;
      default:
        return false;
    }
  };

  // Email confirmation success screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#41695e' }}>
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl" style={{ color: '#033b4a' }}>Check Your Email</h1>
              <p className="text-gray-600">We've sent a confirmation link to <span className="font-medium">{formData.email}</span></p>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-3">
                <Mail className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg" style={{ color: '#033b4a' }}>Almost there!</h3>
                <p className="text-gray-600">
                  Click the confirmation link in your email to activate your Sahaaya account and start helping your community.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Next steps:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the "Confirm your account" link</li>
                  <li>• Return to Sahaaya and sign in</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setCurrentPage('login')}
                  className="flex-1"
                  style={{ backgroundColor: '#41695e' }}
                >
                  Go to Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage('home')}
                  className="flex-1"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help text */}
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5f0' }}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#41695e' }} />
                <div className="space-y-1">
                  <h4 className="text-sm" style={{ color: '#033b4a' }}>Need Help?</h4>
                  <p className="text-xs text-gray-600">
                    If you don't receive the email within a few minutes, check your spam folder or call our support helpline at{' '}
                    <span className="font-medium">1800-SAHAAYA</span> for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl" style={{ color: '#033b4a' }}>Join Sahaaya</h1>
            <p className="text-gray-600">
              {selectedRole === 'individual' 
                ? 'Create your individual account to start helping or receiving help from your community'
                : 'Register your NGO to create campaigns and manage community assistance programs'
              }
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5f0' }}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#033b4a' }}>Registration Progress</span>
                <span className="text-sm text-gray-600">{getFormProgress()}%</span>
              </div>
              <Progress value={getFormProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span className={currentStep >= 1 ? 'text-green-600' : ''}>Personal Info</span>
                <span className={currentStep >= 2 ? 'text-green-600' : ''}>Contact & Security</span>
                <span className={currentStep >= 3 ? 'text-green-600' : ''}>Confirmation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle style={{ color: '#033b4a' }}>Create Account</CardTitle>
            <p className="text-sm text-gray-600">Step {currentStep} of 3</p>
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

            {currentStep === 1 && (
              <>
                {/* Google Registration */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleRegister}
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
                  Register with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or register with email</span>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  {selectedRole === 'individual' ? (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="ngoName" className="text-sm">NGO Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="ngoName"
                          type="text"
                          placeholder="Enter your NGO name"
                          value={formData.ngoName}
                          onChange={(e) => handleInputChange('ngoName', e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  )}

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
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
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
                      placeholder="Create a secure password"
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
                  
                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center space-x-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>Uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>Lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>Number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NGO Registration Proof Upload */}
                {selectedRole === 'ngo' && (
                  <div className="space-y-2">
                    <Label htmlFor="registrationProof" className="text-sm">Registration Proof</Label>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="registrationProof"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData(prev => ({ ...prev, registrationProof: file }));
                          if (error) setError('');
                        }}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      Upload your NGO registration certificate (PDF, JPG, PNG - Max 5MB)
                    </p>
                    {formData.registrationProof && (
                      <div className="flex items-center space-x-2 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>File uploaded: {formData.registrationProof.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className={`flex items-center space-x-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="h-3 w-3" />
                      <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium" style={{ color: '#033b4a' }}>Account Summary:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Role:</span> {selectedRole === 'individual' ? 'Individual User' : 'NGO Organization'}</p>
                    <p><span className="font-medium">Name:</span> {selectedRole === 'individual' ? formData.name : formData.ngoName}</p>
                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                    <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                    {selectedRole === 'ngo' && formData.registrationProof && (
                      <p><span className="font-medium">Registration Proof:</span> {formData.registrationProof.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Previous
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex-1"
                  style={{ backgroundColor: isStepValid() ? '#41695e' : undefined }}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleEmailRegister}
                  disabled={!isFormValid || isLoading}
                  className="flex-1"
                  style={{ backgroundColor: isFormValid ? '#41695e' : undefined }}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Guide for Rural Users */}
        <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5f0' }}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#41695e' }} />
              <div className="space-y-2">
                <h4 className="text-sm" style={{ color: '#033b4a' }}>New to Online Registration?</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Fill each field one by one - don't rush</p>
                  <p>• Your password should be something only you know</p>
                  <p>• Keep your phone number handy for verification</p>
                  <p>• Call <span className="font-medium">1800-SAHAAYA</span> if you need help</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => setCurrentPage('login')}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-between text-center">
          <button
            onClick={() => setCurrentPage('role-selection')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Choose Different Role
          </button>
          <button
            onClick={() => setCurrentPage('home')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}