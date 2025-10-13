import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Get the current domain for redirect URLs
const getRedirectUrl = () => {
  // In production, use the actual domain
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000'; // Fallback for SSR
};

// Create a single Supabase client instance to be shared across the app
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    // This ensures that redirect URLs use the current domain
    redirectTo: getRedirectUrl(),
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL fragments
    detectSessionInUrl: true
  }
});