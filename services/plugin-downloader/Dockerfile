# Sonántica AI Plugin: The Workshop (Downloader)
# Philosophy: "The user decides, the software accompanies"

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Placeholder for SpotiFLAC / SpotiDownloader tools
# Given the user's links, we might need to build from source or use specific binaries.
# For now, we'll install common Python downloaders as a base.
RUN pip install --no-cache-dir spotdl

# Copy application code
COPY . .

# Create media download directory
RUN mkdir -p /media/Downloads && chmod 777 /media/Downloads

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
