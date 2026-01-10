import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://yjlsfkhtulxmpdpihgpz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dD214xfDzy9kooOJ-w5VPw_qE0kfx_2';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get current user ID (for multi-user support)
// For now, we'll use a simple user identifier stored in localStorage
export function getUserId() {
    let userId = localStorage.getItem('lingodash_user_id');
    
    if (!userId) {
        // Generate a unique user ID if doesn't exist
        userId = 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lingodash_user_id', userId);
    }
    
    return userId;
}
