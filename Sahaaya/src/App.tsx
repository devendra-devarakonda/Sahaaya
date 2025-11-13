import { useState, useEffect, useRef } from 'react';
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
import { CommunityList } from './components/Communities/CommunityList';
import { CommunityCreationForm } from './components/Communities/CommunityCreationForm';
import { CommunityDetails } from './components/Communities/CommunityDetails';
import { AllRequests } from './components/AllRequests';
import { AllContributions } from './components/AllContributions';
import { Toaster } from './components/ui/sonner';

import { supabase } from './utils/auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState<'individual' | 'ngo' | null>(null);
  const [selectedRole, setSelectedRole] = useState<'individual' | 'ngo' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  
  // Use ref to track initialization - doesn't get captured in closure
  const hasInitializedRef = useRef(false);
  const justLoggedInRef = useRef(false);

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
          hasInitializedRef.current = true;
          return;
        }

        // Try to get the current session
        let { data: { session }, error } = await supabase.auth.getSession();
        
        // If session is invalid or expired, try to refresh it
        if (!session || error) {
          console.log('⚠️ Session invalid or expired, attempting to refresh...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshedSession && !refreshError) {
            console.log('✅ Session refreshed successfully');
            session = refreshedSession;
          } else {
            console.log('❌ Session refresh failed - user needs to log in again');
            // Clear any stale session data
            await supabase.auth.signOut();
          }
        }
        
        if (session && session.user) {
          const role = session.user.user_metadata?.role as 'individual' | 'ngo';
          
          console.log('🔍 Session check - Raw role from Supabase:', role);
          console.log('🔍 User metadata:', session.user.user_metadata);
          
          const validRole = (role === 'individual' || role === 'ngo') ? role : null;
          
          if (!validRole) {
            console.error('❌ User role is NOT set in Supabase!');
          }
          
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            role: validRole,
            avatar_url: session.user.user_metadata?.avatar_url
          });
          setIsAuthenticated(true);
          setUserRole(validRole as any);
          
          // Only navigate to dashboard on initial load if user is not already on a page
          if (currentPage === 'home' || currentPage === 'login' || currentPage === 'register') {
            setCurrentPage('dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, 'hasInitialized:', hasInitializedRef.current);
        
        // Only handle actual sign-in events from login form, not token refreshes or initial load
        if (event === 'SIGNED_IN' && session) {
          // Only redirect if this is a fresh login (not initial page load)
          if (hasInitializedRef.current && justLoggedInRef.current) {
            const role = session.user.user_metadata?.role as 'individual' | 'ngo';
            
            console.log('🔍 Auth state change - Raw role:', role);
            
            const validRole = (role === 'individual' || role === 'ngo') ? role : null;
            
            if (!validRole) {
              console.error('❌ User signed in but role is NOT set!');
            }
            
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
            setUserRole(validRole as any);
            setCurrentPage('dashboard');
            
            // Reset the flag
            justLoggedInRef.current = false;
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update user profile on token refresh but DON'T change the page
          console.log('🔄 Token refreshed - staying on current page');
          const role = session.user.user_metadata?.role as 'individual' | 'ngo';
          const validRole = (role === 'individual' || role === 'ngo') ? role : null;
          
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            role: validRole,
            avatar_url: session.user.user_metadata?.avatar_url
          });
          setIsAuthenticated(true);
          setUserRole(validRole as any);
          // DON'T navigate to dashboard - stay on current page
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserProfile(null);
          setUserRole(null);
          setCurrentPage('home');
          justLoggedInRef.current = false;
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      setCurrentPage('login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      setCurrentPage('login');
    }
  };

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
            justLoggedInRef={justLoggedInRef}
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
      case 'all-requests':
        return <AllRequests setCurrentPage={setCurrentPage} userProfile={userProfile} />;
      case 'all-contributions':
        return <AllContributions setCurrentPage={setCurrentPage} userProfile={userProfile} />;
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
  );
}