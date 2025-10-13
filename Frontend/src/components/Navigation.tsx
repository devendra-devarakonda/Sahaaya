import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Heart, 
  Users, 
  Building2, 
  Shield, 
  Menu, 
  X,
  Home,
  FileText,
  Search,
  BarChart3,
  User,
  Bell,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  userRole: 'individual' | 'ngo' | null;
  setUserRole: (role: 'individual' | 'ngo' | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  userProfile?: any;
}

export function Navigation({ 
  currentPage, 
  setCurrentPage, 
  userRole, 
  setUserRole, 
  isAuthenticated, 
  setIsAuthenticated, 
  userProfile 
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  const handleLogout = async () => {
    try {
      // Import and use shared Supabase client
      const { supabase } = await import('../utils/supabase/client');
      
      await supabase.auth.signOut();
      
      // Clear local state
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentPage('home');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentPage('home');
      setMobileMenuOpen(false);
    }
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const roleColors = {
    individual: 'bg-green-100 text-green-800',
    ngo: 'bg-blue-100 text-blue-800'
  };

  return (
    <nav 
      className="fixed top-0 left-0 w-full border-b backdrop-blur-md z-50" 
      style={{ 
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(249, 254, 250, 0.9))',
        borderColor: 'rgba(224, 231, 226, 0.6)',
        boxShadow: '0 4px 12px rgba(65, 105, 94, 0.08), 0 2px 4px rgba(65, 105, 94, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid'
      }}
    >
      <div className="px-5">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0 ml-14">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center transform transition-all duration-200 hover:scale-110" 
              style={{ 
                background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                boxShadow: '0 4px 8px rgba(65, 105, 94, 0.3), 0 2px 4px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span 
              className="text-xl font-medium" 
              style={{ 
                color: '#033b4a',
                textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
              }}
            >
              Sahaaya
            </span>
          </div>

          {/* Desktop Navigation & Auth Section */}
          <div className="hidden md:flex items-center space-x-6 mr-4">
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant={currentPage === 'home' ? 'default' : 'ghost'}
                onClick={() => handleNavigation('home')}
                className="flex items-center space-x-1"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>

              {isAuthenticated && (
                <>
                  <Button 
                    variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => handleNavigation('dashboard')}
                    className="flex items-center space-x-1"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>

                  <Button 
                    variant={currentPage === 'communities' ? 'default' : 'ghost'}
                    onClick={() => handleNavigation('communities')}
                    className="flex items-center space-x-1"
                  >
                    <Users className="h-4 w-4" />
                    <span>Communities</span>
                  </Button>

                  {/* NGO User Navigation */}
                  {userRole === 'ngo' && (
                    <Button 
                      variant={currentPage === 'create-campaign' ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('create-campaign')}
                      className="flex items-center space-x-1"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Campaigns</span>
                    </Button>
                  )}

                  <Button 
                    variant={currentPage === 'notifications' ? 'default' : 'ghost'}
                    onClick={() => handleNavigation('notifications')}
                    className="flex items-center space-x-1"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Button>
                </>
              )}
            </div>

            {/* Auth/Role Section */}
            <div className="flex items-center space-x-3">
              {!isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage('login')}
                    className="flex items-center space-x-1"
                  >
                    <span>Sign In</span>
                  </Button>
                  <Button 
                    onClick={() => setCurrentPage('role-selection')}
                    className="flex items-center space-x-1"
                    style={{ backgroundColor: '#41695e' }}
                  >
                    <span>Sign Up</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* User Profile Dropdown with Role */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-gray-50">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" 
                             style={{ backgroundColor: '#41695e' }}>
                          {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col items-start">
                          <span className="text-sm font-medium" style={{ color: '#033b4a' }}>
                            {userProfile?.name || 'User'}
                          </span>
                          {userRole && (
                            <Badge className={`${roleColors[userRole]} border-0 text-xs px-2 py-0.5`}>
                              {userRole === 'individual' ? 'Individual' : 'NGO'}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <div className="font-medium" style={{ color: '#033b4a' }}>
                          {userProfile?.name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">{userProfile?.email}</div>
                      </div>
                      
                      <DropdownMenuItem onClick={() => setCurrentPage('dashboard')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => setCurrentPage('communities')}>
                        <Users className="h-4 w-4 mr-2" />
                        Communities
                      </DropdownMenuItem>
                      
                      {/* Role-specific dropdown items */}
                      {userRole === 'ngo' && (
                        <DropdownMenuItem onClick={() => setCurrentPage('create-campaign')}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Manage Campaigns
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => setCurrentPage('notifications')}>
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </DropdownMenuItem>
                      
                      <div className="border-t">
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed top-16 left-0 right-0 bottom-0 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Sliding Panel */}
            <div 
              className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              style={{ 
                background: '#ffffff',
                boxShadow: '-4px 0 20px rgba(65, 105, 94, 0.15)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e0e7e2' }}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center" 
                    style={{ 
                      background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                      boxShadow: '0 4px 8px rgba(65, 105, 94, 0.3)'
                    }}
                  >
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-medium" style={{ color: '#033b4a' }}>
                    Sahaaya
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Content */}
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 bg-white">
                  <div className="space-y-2">
                    <Button 
                      variant={currentPage === 'home' ? 'default' : 'ghost'}
                      onClick={() => handleNavigation('home')}
                      className="w-full justify-start"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>

                    {isAuthenticated && (
                      <>
                        <Button 
                          variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                          onClick={() => handleNavigation('dashboard')}
                          className="w-full justify-start"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>

                        <Button 
                          variant={currentPage === 'communities' ? 'default' : 'ghost'}
                          onClick={() => handleNavigation('communities')}
                          className="w-full justify-start"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Communities
                        </Button>

                        {/* Individual User Mobile Navigation */}
                        {userRole === 'individual' && (
                          <>
                            <Button 
                              variant={currentPage === 'request-help' ? 'default' : 'ghost'}
                              onClick={() => handleNavigation('request-help')}
                              className="w-full justify-start"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Request Help
                            </Button>
                            
                            <Button 
                              variant={currentPage === 'matching' ? 'default' : 'ghost'}
                              onClick={() => handleNavigation('matching')}
                              className="w-full justify-start"
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Offer Help
                            </Button>
                          </>
                        )}

                        {/* NGO User Mobile Navigation */}
                        {userRole === 'ngo' && (
                          <>
                            <Button 
                              variant={currentPage === 'create-campaign' ? 'default' : 'ghost'}
                              onClick={() => handleNavigation('create-campaign')}
                              className="w-full justify-start"
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Campaigns
                            </Button>
                            
                            <Button 
                              variant={currentPage === 'matching' ? 'default' : 'ghost'}
                              onClick={() => handleNavigation('matching')}
                              className="w-full justify-start"
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Browse Requests
                            </Button>
                          </>
                        )}

                        <Button 
                          variant={currentPage === 'notifications' ? 'default' : 'ghost'}
                          onClick={() => handleNavigation('notifications')}
                          className="w-full justify-start"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Notifications
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Mobile Auth/Profile Section - Bottom */}
                <div className="border-t p-4 bg-white" style={{ borderColor: '#e0e7e2' }}>
                  {!isAuthenticated ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleNavigation('login')}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => handleNavigation('role-selection')}
                        className="w-full justify-start"
                        style={{ backgroundColor: '#41695e' }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Sign Up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="px-2 py-2 rounded-lg" style={{ backgroundColor: '#f9fefa' }}>
                        <div className="font-medium" style={{ color: '#033b4a' }}>
                          {userProfile?.name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">{userProfile?.email}</div>
                        {userRole && (
                          <Badge className={`${roleColors[userRole]} border-0 mt-2 text-xs`}>
                            {userRole === 'individual' ? 'Individual User' : 'NGO'}
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}