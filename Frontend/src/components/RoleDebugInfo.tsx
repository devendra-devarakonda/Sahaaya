import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Building2, AlertCircle } from 'lucide-react';

interface RoleDebugInfoProps {
  userRole: 'individual' | 'ngo' | null;
  isAuthenticated: boolean;
  userProfile?: any;
}

export function RoleDebugInfo({ userRole, isAuthenticated, userProfile }: RoleDebugInfoProps) {
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 z-50" style={{ borderColor: '#41695e' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2" style={{ color: '#033b4a' }}>
          <AlertCircle className="h-4 w-4" />
          <span>Role Debug Info</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Authenticated:</span>
          <Badge className={isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">User Role:</span>
          <div className="flex items-center space-x-1">
            {userRole === 'individual' && <Users className="h-3 w-3" style={{ color: '#41695e' }} />}
            {userRole === 'ngo' && <Building2 className="h-3 w-3" style={{ color: '#41695e' }} />}
            <Badge className={
              userRole === 'individual' ? 'bg-green-100 text-green-800' :
              userRole === 'ngo' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }>
              {userRole || 'None'}
            </Badge>
          </div>
        </div>
        
        {userProfile && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">User:</span>
            <span className="text-sm font-medium" style={{ color: '#033b4a' }}>
              {userProfile.name || 'Unknown'}
            </span>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            {userRole === 'individual' && 'Showing: Request Help, Offer Help'}
            {userRole === 'ngo' && 'Showing: Create Campaign, Manage Campaigns'}
            {!userRole && 'Showing: General/Login UI'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}