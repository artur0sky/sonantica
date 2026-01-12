FROM python:3.12-alpine

WORKDIR /app

# Install system dependencies (ffmpeg and libsndfile required for audio processing)
RUN apk add --no-cache ffmpeg libsndfile libsndfile-dev build-base

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Security: Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser
CMD ["python", "worker.py"]
