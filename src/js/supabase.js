import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://yjlsfkhtulxmpdpihgpz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dD214xfDzy9kooOJ-w5VPw_qE0kfx_2';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get current user ID (uses authenticated user ID if available)
export async function getUserId() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
        // Use authenticated user's ID
        return user.id;
    }
    
    // Fallback: use a simple user identifier stored in localStorage for guest users
    // Note: Guest users won't be able to save data to Supabase without authentication
    let userId = localStorage.getItem('lingodash_user_id');
    
    if (!userId) {
        // Generate a unique user ID if doesn't exist
        userId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lingodash_user_id', userId);
    }
    
    return userId;
}

// Check if user is authenticated
export async function isAuthenticated() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && user !== null;
}
