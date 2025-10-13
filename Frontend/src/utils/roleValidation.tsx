import { supabase } from './supabase/client';

export class RoleValidationError extends Error {
  constructor(userRole: string, requiredRole: string) {
    super(`This feature is only available for ${requiredRole} accounts. You are currently logged in as ${userRole}.`);
    this.name = 'RoleValidationError';
  }
}

export interface UserRole {
  role: 'individual' | 'ngo';
  id: string;
}

/**
 * Get the current user's role from their session
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    if (!session?.user) {
      console.log('No active session found');
      return null;
    }

    // Get role from user metadata, defaulting to 'individual' if not set
    const role = session.user.user_metadata?.role as 'individual' | 'ngo';
    
    // Validate that the role is one of the expected values
    if (role !== 'individual' && role !== 'ngo') {
      console.warn('Invalid role in user metadata:', role, 'defaulting to individual');
      return {
        role: 'individual',
        id: session.user.id
      };
    }
    
    console.log('Retrieved user role:', role, 'for user:', session.user.id);
    
    return {
      role,
      id: session.user.id
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Validate that the current user has the required role for an operation
 */
export async function validateUserRole(requiredRole: 'individual' | 'ngo'): Promise<UserRole> {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) {
    throw new Error('User not authenticated. Please log in to continue.');
  }
  
  if (userRole.role !== requiredRole) {
    throw new RoleValidationError(
      userRole.role === 'individual' ? 'Individual User' : 'NGO',
      requiredRole === 'individual' ? 'Individual User' : 'NGO'
    );
  }
  
  return userRole;
}

/**
 * Check if the current user has permission to access a feature
 */
export async function hasRolePermission(requiredRole: 'individual' | 'ngo'): Promise<boolean> {
  try {
    await validateUserRole(requiredRole);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user-friendly error message for role validation errors
 */
export function getRoleErrorMessage(error: Error, operation: string): string {
  if (error instanceof RoleValidationError) {
    return error.message;
  }
  
  if (error.message.includes('not authenticated')) {
    return 'Please log in to access this feature.';
  }
  
  return `Unable to ${operation}. Please try again or contact support if the issue persists.`;
}