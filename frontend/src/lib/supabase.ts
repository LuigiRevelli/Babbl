/**
 * Babbl — Supabase client.
 *
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are public values
 * (the anon key is designed to be exposed in client-side code).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://lttrlcemwprjmylixtee.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dHJsY2Vtd3Byam15bGl4dGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDgxODIsImV4cCI6MjA5MTc4NDE4Mn0.IYdsMhemhYWZF3jPk-qIkUSnfNHTlD1i9yVxuNTjbnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
