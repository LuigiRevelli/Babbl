/**
 * Babbl — Supabase data service.
 *
 * Replaces localStorage operations with Supabase queries.
 * Each function is a thin wrapper around the supabase client.
 * Callers should catch errors and fall back to localStorage.
 */

import { supabase } from './supabase';

// ─── Profiles ──────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  fields: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Analyses ──────────────────────────────────────────────

export async function saveAnalysis(
  userId: string,
  analysis: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      ...analysis,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAnalyses(userId: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── Context Logs ──────────────────────────────────────────

export async function saveContextLog(
  userId: string,
  logType: string,
  notes?: string,
) {
  const { data, error } = await supabase
    .from('context_logs')
    .insert({
      user_id: userId,
      log_type: logType,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchContextLogs(userId: string) {
  const { data, error } = await supabase
    .from('context_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── Badges ────────────────────────────────────────────────

export async function saveBadge(userId: string, badgeName: string) {
  const { error } = await supabase
    .from('badges')
    .upsert(
      { user_id: userId, badge_name: badgeName },
      { onConflict: 'user_id,badge_name' },
    );

  // Ignore duplicate — the upsert with onConflict handles it
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function fetchBadges(userId: string) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
