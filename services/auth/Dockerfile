FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY auth ./auth

RUN mkdir -p /data && \
    useradd -u 1000 appuser && \
    chown -R appuser /app /data

USER appuser

ENV SQLITE_PATH=/data/auth.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD python -c "import urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen('http://localhost:8000/auth/health').status==200 else 1)"

CMD ["uvicorn", "auth.main:app", "--host", "0.0.0.0", "--port", "8000"]
