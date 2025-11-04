// Debug utility to check Supabase configuration
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const debugSupabase = () => {
  console.log('=== Supabase Debug Info ===');
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
  console.log('Is Configured:', isSupabaseConfigured);
  console.log('Supabase Client:', supabase ? 'Available' : 'Not Available');
  console.log('========================');
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  if (!supabase) {
    console.error('Supabase client not available');
    return false;
  }

  try {
    const { error } = await supabase.from('events').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
};
