# Babbl API — image de production.
# ffmpeg : décoder ce qu'envoient les navigateurs (WebM/Opus sur Chrome,
# MP4/AAC sur iPhone). libsndfile : lecture WAV par soundfile.
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg libsndfile1 \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NUMBA_CACHE_DIR=/tmp/numba \
    BABBL_WARMUP=1 \
    PORT=5001

WORKDIR /app
COPY requirements.lock .
RUN pip install --no-cache-dir -r requirements.lock

COPY . .
RUN useradd --create-home babbl && mkdir -p /app/tmp && chown -R babbl /app
USER babbl

EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD python -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','5001')+'/api/health',timeout=4)"
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
