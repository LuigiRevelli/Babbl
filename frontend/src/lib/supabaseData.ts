/**
 * Babbl — Supabase data service.
 *
 * Ce que le navigateur lit et écrit lui-même dans Supabase — rien d'autre.
 * Le reste (analyses, journal, badges) passe par le backend. Les règles RLS
 * de supabase/migrations/20260924_rls_least_privilege.sql n'autorisent
 * que ces accès : en ajouter un ici exige une règle là-bas.
 * Les appelants attrapent les erreurs et retombent sur le téléphone.
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

export async function fetchAnalyses(userId: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
