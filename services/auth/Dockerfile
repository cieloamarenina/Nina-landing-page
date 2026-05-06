FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY auth ./auth

RUN mkdir -p /data

# Note: running as root because Coolify bind-mounts /data with host permissions
# (root-owned). Container is isolated and only port 8000 is exposed via Traefik.
# If we ever switch to a Docker-managed volume we can re-enable a non-root user.

ENV SQLITE_PATH=/data/auth.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/auth/health').status==200 else 1)"

CMD ["uvicorn", "auth.main:app", "--host", "0.0.0.0", "--port", "8000"]
