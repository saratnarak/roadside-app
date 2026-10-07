import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// The mobile app MUST ONLY use the anon key. 
// Never use the service role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
