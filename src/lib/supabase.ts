import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey?.length);

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables! Check Vercel environment variables.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
