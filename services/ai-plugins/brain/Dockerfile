# Usar imagen base optimizada de PyTorch
FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime

# Evitar prompts de apt e instalar dependencias de sistema
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Variables de entorno por defecto
ENV API_ENV=production
ENV TORCH_HOME=/model_cache/torch
ENV HF_HOME=/model_cache/huggingface

# Exponer puerto para la API
EXPOSE 8080

# Comando para arrancar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
