import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Building2, Heart, FileText, Upload, Shield } from 'lucide-react';

interface RoleSelectionProps {
  setCurrentPage: (page: string) => void;
  setSelectedRole: (role: 'individual' | 'ngo') => void;
}

export function RoleSelection({ setCurrentPage, setSelectedRole }: RoleSelectionProps) {
  const handleRoleSelect = (role: 'individual' | 'ngo') => {
    setSelectedRole(role);
    setCurrentPage('register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#41695e' }}>
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl" style={{ color: '#033b4a' }}>Welcome to Sahaaya</h1>
            <p className="text-lg text-gray-600">Choose your account type to get started</p>
          </div>
        </div>

        {/* Role Selection - Two Large Buttons */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Individual User Button */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleRoleSelect('individual')}
          >
            <Card className="h-full shadow-xl border-0 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: '#e8f5f0' }}>
                  <Users className="h-12 w-12" style={{ color: '#41695e' }} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl" style={{ color: '#033b4a' }}>I am an Individual</h2>
                  <p className="text-lg text-gray-600">For people seeking help or wanting to help others</p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Request help from community</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Offer help to others</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Track requests and offers</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg group-hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: '#41695e' }}
                >
                  Choose Individual Account
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* NGO User Button */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleRoleSelect('ngo')}
          >
            <Card className="h-full shadow-xl border-0 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-white to-purple-50">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: '#e8f5f0' }}>
                  <Building2 className="h-12 w-12" style={{ color: '#41695e' }} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl" style={{ color: '#033b4a' }}>I am an NGO</h2>
                  <p className="text-lg text-gray-600">For registered NGOs and charitable organizations</p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Manage campaigns and programs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Advanced analytics dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6" style={{ color: '#41695e' }} />
                    <span className="text-gray-700">Connect donors with beneficiaries</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg group-hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: '#41695e' }}
                >
                  Choose NGO Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-0 shadow-sm max-w-2xl mx-auto" style={{ backgroundColor: '#e8f5f0' }}>
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <h4 style={{ color: '#033b4a' }}>Need Help Choosing?</h4>
              <p className="text-sm text-gray-600">
                Select <strong>Individual User</strong> if you're a person who wants to request help, offer assistance to others, or both - all from one account!
                <br />
                Select <strong>NGO Organization</strong> if you represent a registered non-profit organization.
              </p>
              <p className="text-xs text-gray-500">
                Call our support helpline at <span className="font-medium">1800-SAHAAYA</span> for assistance
              </p>
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