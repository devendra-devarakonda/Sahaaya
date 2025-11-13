import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    phone?: string;
    role?: 'individual' | 'ngo';
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}
