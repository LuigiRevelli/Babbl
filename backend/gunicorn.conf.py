"""Configuration gunicorn — le délai par défaut (30 s) tuait un worker pendant
que le résultat déterministe était prêt en 2 s. Les appels externes sont
bornés (LLM 8 s, voix 6-8 s), donc 30 s suffisent avec de la marge."""

import os

bind = "0.0.0.0:" + os.environ.get("PORT", "5001")
# Chaque processus charge librosa (~250 Mo) : 1 sur une petite instance (512 Mo).
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
# Charge l'app (et le préchauffage audio) une fois, avant de dupliquer les processus.
preload_app = True
threads = 4
timeout = 30
graceful_timeout = 10
keepalive = 5
# Pas de journal d'accès gunicorn : il écrirait l'adresse IP et le chemin réel.
# Chaque requête est journalisée par logs.py (JSON, request_id, sans donnée de la famille).
accesslog = None
