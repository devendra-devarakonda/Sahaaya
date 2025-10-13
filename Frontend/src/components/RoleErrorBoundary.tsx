import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface RoleErrorBoundaryProps {
  children: React.ReactNode;
  userRole?: 'individual' | 'ngo' | null;
  setCurrentPage?: (page: string) => void;
}

interface RoleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RoleErrorBoundary extends React.Component<RoleErrorBoundaryProps, RoleErrorBoundaryState> {
  constructor(props: RoleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RoleErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RoleErrorBoundary caught an error:', error, errorInfo);
  }

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.setCurrentPage) {
      this.props.setCurrentPage('dashboard');
    }
  };

  render() {
    if (this.state.hasError) {
      const isRoleError = this.state.error?.message.includes('only available for') || 
                         this.state.error?.message.includes('not authenticated');
      
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-medium mb-2" style={{ color: '#033b4a' }}>
                {isRoleError ? 'Access Restricted' : 'Something went wrong'}
              </h2>
            </div>

            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            {isRoleError && this.props.userRole && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Your current role:</strong> {this.props.userRole === 'individual' ? 'Individual User' : 'NGO'}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              {this.props.setCurrentPage && (
                <Button 
                  onClick={this.handleGoBack}
                  className="w-full"
                  style={{ backgroundColor: '#41695e' }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}