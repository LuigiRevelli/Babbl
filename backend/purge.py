"""
Purge des données anciennes — durée de conservation (RGPD art. 5.1.e).

    BABBL_RETENTION_DAYS=730 python purge.py            # efface
    BABBL_RETENTION_DAYS=730 python purge.py --dry-run  # compte seulement

DÉSACTIVÉE tant que BABBL_RETENTION_DAYS n'est pas définie : la durée est une
décision juridique (legal/politique-confidentialite-BROUILLON.md, point 7),
pas un choix technique. À lancer une fois par jour (tâche planifiée Render,
cron). Seules les lignes datées (analyses, journal) sont concernées ; le
profil et le compte restent jusqu'à leur suppression par le parent.

Ne journalise que des nombres : jamais d'identifiant de compte.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from logs import log_event  # noqa: E402

# (table, colonne de date) — les tables datées qui portent l'histoire du bébé.
DATED_TABLES = (("analyses", "created_at"), ("context_logs", "created_at"))
MIN_DAYS = 30  # garde-fou : une faute de frappe (« 7 » au lieu de « 730 ») ne vide pas tout


def retention_days(env=os.environ) -> int | None:
    raw = (env.get("BABBL_RETENTION_DAYS") or "").strip()
    if not raw:
        return None
    days = int(raw)
    if days < MIN_DAYS:
        raise ValueError(f"BABBL_RETENTION_DAYS={days} : moins de {MIN_DAYS} jours, refusé")
    return days


def purge(sb, days: int, now: datetime | None = None, dry_run: bool = False) -> dict[str, int | str]:
    cutoff = ((now or datetime.now(timezone.utc)) - timedelta(days=days)).isoformat()
    report: dict[str, int | str] = {}
    for table, col in DATED_TABLES:
        try:
            if dry_run:
                resp = sb.table(table).select("id", count="exact").lt(col, cutoff).execute()
                report[table] = int(getattr(resp, "count", None) or len(resp.data or []))
            else:
                resp = sb.table(table).delete().lt(col, cutoff).execute()
                report[table] = len(resp.data or [])
        except Exception as e:
            report[table] = f"failed ({type(e).__name__})"
    return report


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    days = retention_days()
    if days is None:
        log_event("purge_skipped", step="retention_not_set")
        return 0
    from app import _get_supabase
    sb = _get_supabase()
    if sb is None:
        log_event("purge_failed", "error", step="database_unavailable")
        return 1
    report = purge(sb, days, dry_run=args.dry_run)
    failed = [t for t, v in report.items() if isinstance(v, str)]
    for table, value in report.items():
        log_event("purge", "warning" if isinstance(value, str) else "info", component=table,
                  count=value if isinstance(value, int) else None,
                  error_type=value if isinstance(value, str) else None, step="dry_run" if args.dry_run else "delete")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
