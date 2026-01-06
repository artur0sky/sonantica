FROM python:3.12-alpine

WORKDIR /app

# Install system dependencies (ffmpeg required for audio processing)
RUN apk add --no-cache ffmpeg build-base

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

CMD ["python", "worker.py"]
