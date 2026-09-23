"""
Journaux structurés — une ligne JSON par événement, sur la sortie standard.

    {"ts": "...", "level": "info", "event": "request", "request_id": "3f2a…",
     "method": "POST", "route": "/api/analyze", "status": 200, "duration_ms": 512}

Règle : AUCUNE donnée de la famille dans les journaux. Pas de prénom, pas de
texte saisi, pas de résumé, pas d'identifiant de compte, pas d'adresse IP, pas
de chiffre acoustique. Seuls les champs de `ALLOWED_FIELDS` passent ; les
autres sont retirés et leur NOM (jamais leur valeur) est signalé dans
`dropped`, pour qu'un oubli se voie sans rien divulguer. Les valeurs texte
sont coupées à 80 caractères.

`request_id` : repris de l'en-tête X-Request-ID s'il est bien formé (pour
suivre une requête depuis l'hébergeur), sinon tiré au hasard. Renvoyé dans
l'en-tête de réponse X-Request-ID : un parent qui signale un souci peut le
donner sans rien dire d'autre.
"""

from __future__ import annotations

import json
import re
import sys
import time
import uuid
from datetime import datetime, timezone

ALLOWED_FIELDS = frozenset({
    # requête
    "method", "route", "status", "duration_ms",
    # analyse (catégories, jamais de contenu)
    "auth", "gate", "guidance_source", "age_known", "hypotheses_count",
    "tts_ok", "tts_failed", "persisted", "voice_requested",
    # intégrations et erreurs : le TYPE d'erreur seulement (un message peut recopier du contexte)
    "component", "error_type", "step", "seconds", "count", "cards",
})

_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
_MAX_STR = 80


def _clean(value):
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return str(value)[:_MAX_STR]


def _current_request_id() -> str | None:
    try:
        from flask import g, has_request_context
        if has_request_context():
            return getattr(g, "request_id", None)
    except Exception:
        pass
    return None


def log_event(event: str, level: str = "info", stream=None, **fields) -> dict:
    """Écrit une ligne JSON et la renvoie (pratique pour les tests)."""
    record: dict = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "level": level,
        "event": event,
    }
    rid = _current_request_id()
    if rid:
        record["request_id"] = rid
    dropped = []
    for key, value in fields.items():
        if key in ALLOWED_FIELDS:
            record[key] = _clean(value)
        else:
            dropped.append(key)
    if dropped:
        record["dropped"] = sorted(dropped)
    out = stream or sys.stdout
    try:
        out.write(json.dumps(record, ensure_ascii=False) + "\n")
        out.flush()
    except Exception:
        pass
    return record


def install(app) -> None:
    """Branche request_id et la ligne « request » sur chaque appel Flask."""
    from flask import g, request

    @app.before_request
    def _start():
        incoming = request.headers.get("X-Request-ID", "")
        g.request_id = incoming if _REQUEST_ID_RE.match(incoming) else uuid.uuid4().hex[:16]
        g.request_t0 = time.perf_counter()

    @app.after_request
    def _finish(response):
        rid = getattr(g, "request_id", None)
        if rid:
            response.headers["X-Request-ID"] = rid
        t0 = getattr(g, "request_t0", None)
        # La règle (« /api/analyses/<analysis_id>/soothed »), jamais le chemin réel.
        rule = request.url_rule.rule if request.url_rule is not None else "unmatched"
        if rule != "/api/health":  # les sondes de l'hébergeur noieraient le reste
            log_event(
                "request",
                level="warning" if response.status_code >= 500 else "info",
                method=request.method,
                route=rule,
                status=response.status_code,
                duration_ms=round((time.perf_counter() - t0) * 1000) if t0 else None,
            )
        return response
