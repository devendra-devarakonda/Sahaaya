import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { RoleSelection } from './components/RoleSelection';
import { Dashboard } from './components/Dashboard';
import { HelpRequestForm } from './components/HelpRequestForm';
import { CampaignCreationForm } from './components/CampaignCreationForm';
import { MatchingScreen } from './components/MatchingScreen';
import { TrackingTimeline } from './components/TrackingTimeline';
import { EmailVerification } from './components/EmailVerification';
import { Notifications } from './components/Notifications';
import { RoleErrorBoundary } from './components/RoleErrorBoundary';
import { CommunityList } from './components/Communities/CommunityList';
import { CommunityCreationForm } from './components/Communities/CommunityCreationForm';
import { CommunityDetails } from './components/Communities/CommunityDetails';
import { Toaster } from './components/ui/sonner';

import { supabase } from './utils/supabase/client';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState<'individual' | 'ngo' | null>(null);
  const [selectedRole, setSelectedRole] = useState<'individual' | 'ngo' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if this is an email verification URL
        const urlParams = new URLSearchParams(window.location.search);
        const isEmailVerification = urlParams.get('type') === 'signup' || 
                                   urlParams.get('type') === 'email_change' ||
                                   (urlParams.get('access_token') && urlParams.get('refresh_token'));
        
        if (isEmailVerification) {
          setCurrentPage('verify-email');
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const role = session.user.user_metadata?.role as 'individual' | 'ngo';
          
          // Validate role and default to 'individual' if invalid
          const validRole = (role === 'individual' || role === 'ngo') ? role : 'individual';
          
          console.log('Session check - User role:', validRole, 'User ID:', session.user.id);
          
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            role: validRole,
            avatar_url: session.user.user_metadata?.avatar_url
          });
          setIsAuthenticated(true);
          setUserRole(validRole);
          setCurrentPage('dashboard');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const role = session.user.user_metadata?.role as 'individual' | 'ngo';
          
          // Validate role and default to 'individual' if invalid
          const validRole = (role === 'individual' || role === 'ngo') ? role : 'individual';
          
          console.log('Auth state change - User signed in with role:', validRole, 'User ID:', session.user.id);
          
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            role: validRole,
            avatar_url: session.user.user_metadata?.avatar_url
          });
          setIsAuthenticated(true);
          setUserRole(validRole);
          setCurrentPage('dashboard');
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserProfile(null);
          setUserRole(null);
          setCurrentPage('home');
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const renderCurrentPage = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fefa' }}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading Sahaaya...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <LandingPage 
            setCurrentPage={setCurrentPage} 
            setUserRole={setUserRole}
            isAuthenticated={isAuthenticated}
            userRole={userRole}
          />
        );
      case 'login':
        return (
          <Login 
            setCurrentPage={setCurrentPage}
            setIsAuthenticated={setIsAuthenticated}
            setUserProfile={setUserProfile}
          />
        );
      case 'role-selection':
        return (
          <RoleSelection 
            setCurrentPage={setCurrentPage}
            setSelectedRole={setSelectedRole}
          />
        );
      case 'register':
        return (
          <Register 
            setCurrentPage={setCurrentPage}
            setIsAuthenticated={setIsAuthenticated}
            setUserProfile={setUserProfile}
            selectedRole={selectedRole}
          />
        );
      case 'verify-email':
        return (
          <EmailVerification 
            setCurrentPage={setCurrentPage}
            setIsAuthenticated={setIsAuthenticated}
            setUserProfile={setUserProfile}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            userRole={userRole} 
            setCurrentPage={setCurrentPage}
            userProfile={userProfile}
            setUserRole={setUserRole}
          />
        );
      case 'request-help':
        return <HelpRequestForm setCurrentPage={setCurrentPage} />;
      case 'create-campaign':
        return <CampaignCreationForm setCurrentPage={setCurrentPage} userProfile={userProfile} />;
      case 'matching':
        return <MatchingScreen userRole={userRole} setCurrentPage={setCurrentPage} setSelectedCommunityId={setSelectedCommunityId} />;
      case 'tracking':
        return <TrackingTimeline />;
      case 'notifications':
        return <Notifications userRole={userRole} setCurrentPage={setCurrentPage} />;
      case 'communities':
        return (
          <CommunityList 
            userRole={userRole} 
            setCurrentPage={setCurrentPage}
            userProfile={userProfile}
            selectedCommunityId={selectedCommunityId}
            setSelectedCommunityId={setSelectedCommunityId}
          />
        );
      case 'community-details':
        return (
          <CommunityDetails 
            communityId={selectedCommunityId || 'COMM-MUMBAI-MED-001'}
            setCurrentPage={setCurrentPage}
            userRole={userRole}
            userProfile={userProfile}
          />
        );
      case 'create-community':
      case 'request-community-creation':
        return (
          <CommunityCreationForm 
            setCurrentPage={setCurrentPage}
            userProfile={userProfile}
            userRole={userRole}
          />
        );
      default:
        return (
          <LandingPage 
            setCurrentPage={setCurrentPage} 
            setUserRole={setUserRole}
            isAuthenticated={isAuthenticated}
            userRole={userRole}
          />
        );
    }
  };

  return (
    <RoleErrorBoundary userRole={userRole} setCurrentPage={setCurrentPage}>
      <div className="min-h-screen" style={{ backgroundColor: '#f9fefa' }}>
        <Navigation 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          userRole={userRole}
          setUserRole={setUserRole}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
          userProfile={userProfile}
        />
        <div className="pt-16">
          {renderCurrentPage()}
        </div>
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </div>
    </RoleErrorBoundary>
  );
}