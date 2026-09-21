"""
Test d'honnêteté : TOUTE phrase fixe destinée au parent passe le crible.

Couvre le backend (taxonomie, messages de réconfort, repli déterministe) et
le frontend (i18n.ts, taxonomy.ts, constants.ts) en lisant les chaînes
littérales des fichiers TypeScript. Sans réseau.

Lancer :  cd backend && .venv/bin/python tests/test_honesty.py
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import comfort_messages  # noqa: E402
import taxonomy  # noqa: E402
from mistral_client import fallback_guidance, violates_static  # noqa: E402
from triage_rules import context_hypotheses, intensity_observation  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONT = os.path.join(ROOT, "frontend", "src", "lib")


def _backend_strings():
    out = []
    for key, meta in taxonomy.CONTEXT_HYPOTHESES.items():
        out.append((f"taxonomy.CONTEXT_HYPOTHESES[{key}].fr", meta["fr"]))
        out.append((f"taxonomy.CONTEXT_HYPOTHESES[{key}].basis", meta["basis"]))
    for level, tpl in taxonomy.INTENSITY_OBSERVATIONS.items():
        out.append((f"taxonomy.INTENSITY_OBSERVATIONS[{level}]", tpl.format(seconds=10)))
    # Les cartes de sécurité sont testées à part (mots médicaux autorisés, rien d'autre).
    for name in ("SAFETY_FOOTER", "HYPOTHESIS_DISCLAIMER", "INTENSITY_DISCLAIMER", "NO_CRY_REMINDER", "NO_CRY_HINT", "TOO_SHORT_HINT"):
        out.append((f"taxonomy.{name}", getattr(taxonomy, name)))
    for bucket, msgs in comfort_messages.MESSAGES.items():
        for key, text in msgs.items():
            out.append((f"comfort_messages[{bucket}][{key}]", text))
            out.append((f"comfort_messages[{bucket}][{key}] (mère)", comfort_messages.generate_comfort_message(key, 4, "mother")))
    # repli déterministe sur plusieurs contextes
    inten = intensity_observation({"duration_seconds": 9.0, "silence_ratio": 0.3, "pitch_mean_hz": 450.0})
    for ctx in ({}, {"lastFeedingTime": "2000-01-01T00:00:00Z"}, {"lastDiaperTime": "2000-01-01T00:00:00Z", "babyAgeMonths": 1}):
        fb = fallback_guidance(context_hypotheses(ctx, 2), inten, "Léa")
        out.append((f"fallback.summary {ctx}", fb["parent_summary"]))
        for a in fb["recommended_actions"]:
            out.append((f"fallback.action {ctx}", a["action"] + " " + a["reasoning"]))
    return out


_TS_STRING = re.compile(r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")""")


def _frontend_strings(filename: str, min_len: int = 12):
    path = os.path.join(FRONT, filename)
    src = open(path, encoding="utf-8").read()
    # ignorer les commentaires
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"//[^\n]*", "", src)
    out = []
    for m in _TS_STRING.finditer(src):
        text = (m.group(1) if m.group(1) is not None else m.group(2)).replace("\\'", "'")
        if len(text) >= min_len and re.search(r"[a-zA-Zéèàùç]", text):
            out.append((f"{filename}:{src[:m.start()].count(chr(10)) + 1}", text))
    return out


def _check(strings, label):
    bad = [(where, text, hit) for where, text in strings for hit in [violates_static(text)] if hit]
    assert not bad, f"{label}: {len(bad)} phrase(s) interdite(s)\n" + "\n".join(f"  {w}: «{h}» dans: {t[:90]}" for w, t, h in bad)


def test_backend_strings_are_clean():
    _check(_backend_strings(), "backend")


def test_safety_cards_medical_words_only():
    """Fièvre et jaunisse y sont légitimes ; chiffre, « détect » et réassurance, non."""
    for key, meta in taxonomy.SAFETY_CARDS.items():
        for field in ("title", "body"):
            hit = violates_static(meta[field], allow_medical=True)
            assert hit is None, f"SAFETY_CARDS[{key}].{field}: «{hit}»"


def _safety_card_texts():
    return {meta[f] for meta in taxonomy.SAFETY_CARDS.values() for f in ("title", "body")}


def test_frontend_taxonomy_is_clean():
    """Le miroir frontend : mêmes règles, et les textes des cartes de sécurité
    y sont exactement ceux du backend (mots médicaux autorisés là, et là seulement)."""
    cards = _safety_card_texts()
    strings = _frontend_strings("taxonomy.ts")
    for where, text in strings:
        hit = violates_static(text, allow_medical=(text in cards))
        assert hit is None, f"{where}: «{hit}» dans: {text[:90]}"
    front = {t for _, t in _frontend_strings("taxonomy.ts", min_len=3)}
    missing = [t[:60] for t in cards if t not in front]
    assert not missing, f"taxonomy.ts n'est plus synchronisé avec taxonomy.py : {missing}"


def test_frontend_i18n_is_clean():
    _check(_frontend_strings("i18n.ts"), "i18n.ts")


def test_frontend_constants_are_clean():
    _check(_frontend_strings("constants.ts"), "constants.ts")


def test_allowlist_is_exact():
    assert violates_static("Un pleur faible n'est jamais rassurant en soi.") is None
    assert violates_static("Un pleur faible est rassurant.") == "rassur"
    assert violates_static("les signes sont évidents") is None          # « dents » ancré
    assert violates_static("une poussée de dents") is not None


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
