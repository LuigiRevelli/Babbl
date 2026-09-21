"""Configuration gunicorn — le délai par défaut (30 s) tuait un worker pendant
que le résultat déterministe était prêt en 2 s. Les appels externes sont
bornés (LLM 8 s, voix 6-8 s), donc 30 s suffisent avec de la marge."""

bind = "0.0.0.0:" + __import__("os").environ.get("PORT", "5001")
workers = 2
threads = 4
timeout = 30
graceful_timeout = 10
keepalive = 5
