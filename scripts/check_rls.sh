#!/usr/bin/env bash
# Vérifie de l'extérieur, SANS être connecté, que la clé publique de l'app ne
# lit aucune donnée de famille. N'affiche que des nombres, jamais de contenu.
#
#   SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... scripts/check_rls.sh
#
# Attendu : 0 ligne visible partout (ou un code 401/403). Tout autre nombre =
# des données lisibles par n'importe qui : lancer
# supabase/migrations/20260924_rls_least_privilege.sql immédiatement.
set -u
: "${SUPABASE_URL:?SUPABASE_URL manquant}" "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY manquant}"
fail=0
for t in profiles analyses context_logs badges baby_baselines; do
  hdr=$(curl -s -D - -o /dev/null -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Prefer: count=exact" -H "Range: 0-0" "$SUPABASE_URL/rest/v1/$t?select=*")
  code=$(printf '%s' "$hdr" | head -1 | awk '{print $2}')
  total=$(printf '%s' "$hdr" | tr -d '\r' | awk -F/ 'tolower($0) ~ /^content-range/ {print $2}')
  if [ "$code" = "401" ] || [ "$code" = "403" ] || [ "${total:-0}" = "0" ]; then
    printf 'ok    %-15s (code %s, lignes visibles : %s)\n' "$t" "$code" "${total:-0}"
  else
    printf 'FUITE %-15s (code %s, lignes visibles : %s)\n' "$t" "$code" "$total"; fail=1
  fi
done
exit $fail
