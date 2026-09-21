"""
Sécurité et minimisation — les invariants qui ne dépendent pas du son.

  verify_user(sb, authorization)  → qui parle ? (jeton vérifié par Supabase, jamais décodé à la main)
  RateLimiter                     → pas d'appels payants illimités depuis Internet
  safe_remove / sweep_old_files   → aucun audio de nourrisson ne reste sur le disque
  is_safe_audio_name              → /api/audio ne sert que nos mp3, jamais un chemin

Doctrine (SYMPTOMS.md, ROADMAP-BACKEND.md) :
- Un jeton PRÉSENT mais INVALIDE → 401, aucune écriture.
- Un jeton présent mais IMPOSSIBLE À VÉRIFIER (Supabase indisponible) → réponse
  anonyme complète, cartes incluses, aucune écriture. Jamais un blocage.
- Pas de jeton → anonyme : analyse complète, rien de persisté.
"""

from __future__ import annotations

import os
import re
import threading
import time
from collections import deque
from dataclasses import dataclass

AUDIO_NAME_RE = re.compile(r"^[0-9a-f]{32}(_comfort)?\.mp3$")


# ─── Identité ────────────────────────────────────────────────────────

@dataclass(frozen=True)
class AuthResult:
    status: str            # "none" | "verified" | "invalid" | "unavailable"
    user_id: str | None = None

    @property
    def verified(self) -> bool:
        return self.status == "verified" and bool(self.user_id)


def verify_user(sb, authorization: str | None) -> AuthResult:
    """Vérifie le jeton auprès de Supabase (`auth.get_user`), qui contrôle la
    signature. Le décodage base64 « maison » est interdit : il acceptait un
    jeton forgé avec l'identifiant d'une autre famille."""
    if not authorization or not authorization.startswith("Bearer "):
        return AuthResult("none")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return AuthResult("invalid")
    if sb is None:
        return AuthResult("unavailable")
    try:
        resp = sb.auth.get_user(token)
        user = getattr(resp, "user", None)
        user_id = getattr(user, "id", None) if user is not None else None
        if not user_id:
            return AuthResult("invalid")
        return AuthResult("verified", str(user_id))
    except Exception as e:  # jeton forgé, expiré, ou Supabase en erreur
        msg = str(e).lower()
        transient = any(w in msg for w in ("timeout", "timed out", "connection", "unavailable", "503", "502"))
        return AuthResult("unavailable" if transient else "invalid")


# ─── Limite de débit (mémoire locale, par processus) ─────────────────

class RateLimiter:
    """Fenêtre glissante par clé (adresse IP). Suffisant pour un seul
    processus ; un déploiement multi-workers partagera la limite plus tard."""

    def __init__(self, limit: int, window_s: float):
        self.limit = int(limit)
        self.window_s = float(window_s)
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()

    def allow(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and now - q[0] > self.window_s:
                q.popleft()
            if len(q) >= self.limit:
                return False
            q.append(now)
            return True


def client_ip(request) -> str:
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "unknown"


# ─── Fichiers ────────────────────────────────────────────────────────

def safe_remove(path: str | None) -> None:
    if not path:
        return
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    except OSError as e:
        print(f"[files] remove failed for {os.path.basename(path)}: {type(e).__name__}")


def sweep_old_files(directory: str, max_age_s: float, suffixes: tuple[str, ...] = (".mp3",)) -> int:
    """Supprime les fichiers plus vieux que max_age_s. Retourne le nombre effacé."""
    removed = 0
    try:
        now = time.time()
        for name in os.listdir(directory):
            if not name.endswith(suffixes):
                continue
            path = os.path.join(directory, name)
            try:
                if now - os.path.getmtime(path) > max_age_s:
                    os.remove(path)
                    removed += 1
            except OSError:
                continue
    except OSError:
        pass
    return removed


def is_safe_audio_name(name: str) -> bool:
    return bool(AUDIO_NAME_RE.match(name or ""))
