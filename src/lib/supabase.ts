import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
  console.log("EXPO_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Found" : "Missing");
  console.log("EXPO_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Found" : "Missing");
}

// Provide fallback values to prevent createClient from throwing on empty strings during build/launch
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : "https://placeholder.supabase.co";
const validKey = supabaseAnonKey || "placeholder";

export const supabase = createClient<Database>(validUrl, validKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
