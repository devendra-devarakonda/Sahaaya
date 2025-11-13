/**
 * ========================================================================
 * SAHAAYA PLATFORM - CENTRALIZED SUPABASE CLIENT
 * ========================================================================
 * This file provides a centralized export of the Supabase client instance.
 * It re-exports the supabase client from auth.ts for consistency and
 * easier imports across the application.
 * 
 * Usage:
 * import { supabase } from './utils/supabaseClient';
 * 
 * This helps avoid confusion about where to import the supabase client from.
 * ========================================================================
 */

// Re-export the supabase client from auth.ts
export { supabase } from './auth';

/**
 * Note: The actual Supabase client is created in /utils/auth.ts
 * We re-export it here to provide a consistent import path across the application.
 * Both imports work:
 * - import { supabase } from './utils/auth';
 * - import { supabase } from './utils/supabaseClient';
 */
