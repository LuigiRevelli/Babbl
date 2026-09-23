"""
Client LLM — rédige le résumé chaleureux et les gestes à poser.
(Nom de fichier historique ; le modèle est Claude Sonnet via l'API Anthropic.)

Le LLM ne reçoit PAS les descripteurs acoustiques bruts et n'a PAS le droit de :
  - produire des pourcentages ou des probabilités,
  - nommer une maladie ou un symptôme médical,
  - fixer un niveau d'alerte,
  - affirmer entendre une cause dans le son.
Il rédige à partir des hypothèses contextuelles (Couche 2) et de
l'observation sonore en texte (Couche 1). Sa sortie passe par
`sanitize_llm_output()` ; en cas de doute, le résumé déterministe
`fallback_guidance()` prend le relais. Voir SYMPTOMS.md.
"""

from __future__ import annotations

import json
import os
import re

import requests

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

PROMPT_VERSION = "2026.09.21-2"   # incrémenter à chaque changement de SYSTEM_PROMPT ou des cribles
MAX_ACTIONS = 3
LLM_TIMEOUT_S = float(os.environ.get("LLM_TIMEOUT_S", "8"))
ALLOWED_SIGNAL_SOURCES = ("context", "intensity")

# ─── Interdits ───────────────────────────────────────────────────────
# Deux cribles, parce que deux régimes :
#  - _FORBIDDEN_LLM : tout texte composé par le modèle. Large. Un seul motif
#    suffit à remplacer la sortie par la version déterministe.
#  - _FORBIDDEN_STATIC : tout texte fixe destiné au parent (taxonomie, messages
#    de réconfort, repli, i18n). Même liste sans les motifs qui appartiennent
#    légitimement aux textes fixes (« consultez » est le rôle des cartes de
#    sécurité ; les phrases de non-réassurance sont des négations explicites,
#    listées dans STATIC_ALLOWLIST).
# `\bdents?\b` est ancré : « évidents » n'est pas « dents ».
_MEDICAL = (
    r"\d+\s?%|pour ?cent|probabilit|\bsur (dix|cent|mille)\b|chances? sur \w+|\b(une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix) chances?\b|"
    r"diagnos|détect|detect|acoustiq|"
    r"coliq|reflux|\brgo\b|otite|dentaire|\bdents?\b|allergi|aplv|"
    r"méningite|meningite|sepsis|infection|neuro|autis|asphyx|"
    r"\ba (très |tres )?mal\b(?! dormi)|\bmal aux?\b|\bbobo|"
    r"encéphal|encephal|cérébr|cerebr|cerveau|\bEHI\b|\bHIE\b|hypox|"
    r"hypoglyc|dénutri|denutri|malnutri|sevrage|mort subite|\bMSN\b|\bSIDS\b|\bTSA\b|"
    r"coqueluch|bronchiolit|laryngit|asthm|pneumon|syndrome|"
    r"ictère|ictere|jaunisse|fièvre|fievre|maladie|douleur|souffr|"
    r"le son (montre|indique|révèle|revele|confirme|prouve)"
)
# Fausse réassurance : le mode d'échec le plus grave du produit.
_REASSURANCE = (
    r"\bnormal|\bhabituel|tout (va|est|ira) bien|va (très |tres )?bien|rassur|"
    r"rien d'(inquiétant|inquietant|alarmant|grave)|aucun souci|pas de souci|"
    r"en bonne santé|en bonne sante|en pleine forme|ne t'inquiète pas|ne t'inquiete pas|"
    r"pas d'inquiétude|pas d'inquietude"
)
# Le modèle ne recommande ni de consulter ni de ne pas consulter.
_TRIAGE = r"consult|médecin|medecin|pédiatre|pediatre|urgence|\ble 15\b|samu"

_FORBIDDEN_LLM = re.compile(f"({_MEDICAL}|{_REASSURANCE}|{_TRIAGE})", re.IGNORECASE)
_FORBIDDEN_STATIC = re.compile(f"({_MEDICAL}|{_REASSURANCE})", re.IGNORECASE)
_FORBIDDEN = _FORBIDDEN_LLM  # compat

# Textes fixes qui contiennent un motif de réassurance sous forme de NÉGATION
# explicite (« n'est jamais rassurant »). Ils sont autorisés tels quels, et
# uniquement tels quels — un seul caractère changé et le test échoue.
STATIC_ALLOWLIST_FRAGMENTS = (
    "n'est jamais rassurant",
    "ne détecte aucune maladie",
    "ne constitue pas un diagnostic",
    "n'est pas un dispositif médical",
)

# Les cartes de sécurité sont LE seul endroit où un mot médical est légitime
# (texte fixe HAS : fièvre, jaunisse). Même là : ni chiffre de confiance, ni
# « détect », ni réassurance.
_FORBIDDEN_SAFETY_CARD = re.compile(f"(\\d+\\s?%|pour ?cent|probabilit|diagnos|détect|detect|acoustiq|{_REASSURANCE})", re.IGNORECASE)


def violates_static(text: str, allow_medical: bool = False) -> str | None:
    """Motif interdit trouvé dans un texte fixe, ou None. Les négations listées
    dans STATIC_ALLOWLIST_FRAGMENTS sont retirées avant le crible.
    `allow_medical=True` est réservé aux cartes de sécurité."""
    probe = text
    for frag in STATIC_ALLOWLIST_FRAGMENTS:
        probe = probe.replace(frag, "")
    sieve = _FORBIDDEN_SAFETY_CARD if allow_medical else _FORBIDDEN_STATIC
    m = sieve.search(probe)
    return m.group(0) if m else None


SYSTEM_PROMPT = """Tu es Babbl, une aide pour parents épuisés, à 3 h du matin.

Tu reçois :
1. Une observation sonore EN TEXTE (ce que le micro a mesuré sur quelques secondes).
2. Des hypothèses déduites de ce que le parent a saisi (dernière tétée, couche, âge).
3. Le contexte saisi par le parent.

Ce que la science autorise (et rien de plus) : un pleur ne dit pas sa cause.
Les hypothèses viennent du contexte, jamais du son. Tu ne devines pas.

INTERDIT, sans exception :
- Tout chiffre de confiance ou pourcentage.
- Tout nom de maladie ou de symptôme médical (colique, reflux, otite, dents,
  allergie, fièvre, douleur, infection, etc.). Les repères de sécurité sont
  affichés ailleurs, en texte fixe ; ce n'est pas ton rôle.
- Toute phrase qui affirme que le son indique, révèle ou confirme quelque chose.
- Tout niveau d'alerte, toute recommandation de consulter ou de ne pas consulter.
- Rassurer sur l'état de santé du bébé. Tu ne sais pas s'il va bien.

Ce que tu fais :
- Un résumé de 2 à 3 phrases, tutoiement, chaleureux, qui reprend l'hypothèse
  principale EN DISANT qu'elle vient de ce que le parent a saisi
  (ex. « D'après ta dernière tétée il y a 4 h, ... »).
- 1 à 3 gestes concrets à essayer, du plus simple au suivant, chacun avec une
  raison en une phrase.
- key_signals : uniquement ce qui a servi, avec source "context" ou "intensity".

Réponds UNIQUEMENT avec ce JSON, sans texte autour :
{
  "parent_summary": "2-3 phrases en français, tutoiement",
  "recommended_actions": [
    {"priority": 1, "action": "geste concret", "reasoning": "pourquoi, en une phrase"}
  ],
  "key_signals": [
    {"signal": "ce qui a été utilisé", "source": "context|intensity"}
  ]
}
"""


def _post_anthropic(system: str, user_msg: str) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 700,
        "system": system,
        "messages": [{"role": "user", "content": user_msg}],
        "temperature": 0.3,
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    r = requests.post(ANTHROPIC_URL, headers=headers, json=payload, timeout=LLM_TIMEOUT_S)
    r.raise_for_status()
    return r.json()["content"][0]["text"]


def _parse_json(content: str) -> dict:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start, end = content.find("{"), content.rfind("}")
        if start != -1 and end != -1:
            return json.loads(content[start:end + 1])
        raise


# ─── Sortie déterministe (repli) ─────────────────────────────────────

def fallback_guidance(hypotheses: list[dict], intensity: dict, baby_name: str | None = None) -> dict:
    """Résumé et gestes sans LLM. Toujours vrai, jamais personnalisé au-delà
    de ce que le parent a saisi."""
    name = baby_name.strip() if baby_name and baby_name.strip() else "ton bébé"
    top = hypotheses[0] if hypotheses else None

    if top:
        summary = (
            f"{top['why']} D'après ce que tu as saisi, « {top['label'].lower()} » est "
            f"l'hypothèse la plus simple à essayer en premier pour {name}. "
            f"{top['disclaimer']}"
        )
    else:
        summary = (
            f"Tu n'as rien saisi sur les dernières heures de {name}, donc Babbl ne "
            "peut pas proposer d'hypothèse. Le contact et ta voix apaisent souvent."
        )

    actions_by_key = {
        "hunger": ("Propose le sein ou le biberon.", "Les pleurs sont un signe tardif de faim : autant essayer tout de suite."),
        "discomfort": ("Vérifie la couche, la position et les vêtements.", "Un inconfort simple se règle en une minute."),
        "fatigue": ("Baisse la lumière et le bruit, puis berce-le.", "Un bébé éveillé depuis longtemps a du mal à s'endormir seul."),
        "need_for_comfort": ("Prends-le contre toi, peau contre peau, et parle-lui.", "Le contact et ta voix sont ce qui apaise le plus souvent."),
    }
    actions = []
    for i, h in enumerate(hypotheses[:MAX_ACTIONS]):
        action, why = actions_by_key.get(h["key"], actions_by_key["need_for_comfort"])
        actions.append({"priority": i + 1, "action": action, "reasoning": why})
    if not actions:
        a, w = actions_by_key["need_for_comfort"]
        actions.append({"priority": 1, "action": a, "reasoning": w})

    signals = [{"signal": h["why"], "source": "context"} for h in hypotheses[:MAX_ACTIONS]]
    signals.append({"signal": intensity["observation"], "source": "intensity"})

    return {
        "parent_summary": summary,
        "recommended_actions": actions,
        "key_signals": signals,
        "guidance_source": "deterministic",
    }


# ─── Nettoyage de la sortie LLM ──────────────────────────────────────

def _clean_text(value) -> str:
    return str(value).strip() if isinstance(value, (str, int, float)) else ""


def sanitize_llm_output(raw: dict, hypotheses: list[dict], intensity: dict, baby_name: str | None = None) -> dict:
    """Ne garde que les champs autorisés ; remplace tout texte qui enfreint
    les interdits par la version déterministe. Ne lève jamais."""
    fb = fallback_guidance(hypotheses, intensity, baby_name)
    if not isinstance(raw, dict):
        return fb

    summary = _clean_text(raw.get("parent_summary"))
    if not summary or _FORBIDDEN.search(summary):
        summary = fb["parent_summary"]

    actions = []
    for item in (raw.get("recommended_actions") or [])[:MAX_ACTIONS]:
        if not isinstance(item, dict):
            continue
        action = _clean_text(item.get("action"))
        reasoning = _clean_text(item.get("reasoning"))
        if not action or _FORBIDDEN.search(action) or _FORBIDDEN.search(reasoning):
            continue
        actions.append({"priority": len(actions) + 1, "action": action, "reasoning": reasoning})
    if not actions:
        actions = fb["recommended_actions"]

    signals = []
    for item in (raw.get("key_signals") or []):
        if not isinstance(item, dict):
            continue
        signal = _clean_text(item.get("signal"))
        source = _clean_text(item.get("source")).lower()
        if not signal or source not in ALLOWED_SIGNAL_SOURCES or _FORBIDDEN.search(signal):
            continue
        signals.append({"signal": signal, "source": source})
    if not signals:
        signals = fb["key_signals"]

    return {
        "parent_summary": summary,
        "recommended_actions": actions,
        "key_signals": signals,
        "guidance_source": "llm" if summary != fb["parent_summary"] else "deterministic",
    }


# ─── Point d'entrée ──────────────────────────────────────────────────

def write_parent_guidance(
    hypotheses: list[dict],
    intensity: dict,
    context: dict,
    baby_age_months: int | None,
    baby_name: str | None = None,
) -> dict:
    """Résumé + gestes, via le LLM si disponible, sinon déterministe.
    Le LLM ne voit ni descripteurs acoustiques ni score : uniquement du texte."""
    parent_visible_context = {
        k: v for k, v in context.items()
        if k in ("lastFeedingTime", "lastMealAt", "lastDiaperTime", "lastDiaperAt",
                 "babyAgeRange", "babyName", "posture", "awakeMinutes", "awakeSinceAt")
    }
    user_msg = (
        "Observation sonore (texte) :\n"
        f"{intensity['observation']}\n\n"
        "Hypothèses (depuis ce que le parent a saisi, dans l'ordre) :\n"
        f"{json.dumps(hypotheses, ensure_ascii=False, indent=1)}\n\n"
        "Contexte saisi par le parent :\n"
        f"{json.dumps(parent_visible_context, ensure_ascii=False, indent=1)}\n\n"
        f"Âge du bébé en mois : {baby_age_months if baby_age_months is not None else 'inconnu'}\n"
        f"Prénom : {baby_name or 'non renseigné'}\n\n"
        "Rédige le JSON."
    )
    try:
        raw = _parse_json(_post_anthropic(SYSTEM_PROMPT, user_msg))
    except Exception as e:  # réseau, clé, JSON — jamais bloquant
        print(f"[llm] guidance failed, deterministic fallback: {e}")
        return fallback_guidance(hypotheses, intensity, baby_name)
    return sanitize_llm_output(raw, hypotheses, intensity, baby_name)
