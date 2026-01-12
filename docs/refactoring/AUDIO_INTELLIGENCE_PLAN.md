# 🧪 Audio Intelligence & Fidelity Plan (Sonántica)

Este documento define la hoja de ruta para transformar a **Sonántica** en un "Intérprete del Sonido" mediante análisis matemático avanzado, auditoría de fidelidad y machine learning.

---

## 🏗️ Fase 1: Auditoría de Fidelidad ("The Critical Ear")
*Enfoque: Veracidad del archivo y salud de la señal.*

- [ ] **Análisis de Picos Inter-Sample (ISP)**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Implementar oversampling (4x) en el cálculo de picos para detectar clipping digital invisible.
- [ ] **Detección de "Falsos Lossless" (Upscale Audit)**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Refinar algoritmo FFT usando **Kurtosis Espectral** para detectar si un track de 24-bit es un 16-bit inflado o tiene compresión lossy previa.
- [ ] **Waveform Scrubber de Alta Resolución**
    - **Ubicación:** `packages/audio-analyzer`
    - **Tarea:** Generar JSON de waveform basado en RMS estratificado para representación fiel del rango dinámico en la UI.
- [ ] **Bit-Depth Forensic**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Análisis del *Floor Noise* para verificar la profundidad de bits real del archivo.

---

## 🎼 Fase 2: Musicología Computacional ("The Musicologist")
*Enfoque: Entender la estructura y el alma musical del audio.*

- [ ] **Tempo & Rhythm Extraction (BPM)**
    - **Ubicación:** `services/python-worker` (Librosa)
    - **Tarea:** Extracción de tempo mediante autocorrelante de envolvente de amplitud y detección de transientes.
- [ ] **Detección de Tonalidad (Key & Scale)**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Implementar perfiles de Chromagram (HPCP) para identificar la armonía de cada track.
- [ ] **Segmentación Estructural AI**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Detectar automáticamente Intro-Verso-Coro-Outro para visualización en la línea de tiempo.
- [ ] **Extracción de Mood (Arousal/Valence)**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Clasificación heurística inicial basada en brillo espectral y tempo.

---

## 🧠 Fase 3: Similitud Neuronal ("The Soul Finder")
*Enfoque: Recomendación basada en la esencia sonora, no solo en texto.*

- [ ] **Generación de Audio Embeddings**
    - **Ubicación:** `services/ai-plugins/brain`
    - **Tarea:** Extraer vectores de 512 dimensiones usando modelos **CLAP** o **VGGish**.
- [ ] **Búsqueda por Similitud Cosina**
    - **Ubicación:** `packages/recommendations`
    - **Tarea:** Migrar el cálculo de similitud de "tags" a vectores espaciales para encontrar tracks "que suenan como este".
- [ ] **Clustering de Librería**
    - **Ubicación:** `services/ai-plugins/brain`
    - **Tarea:** Agrupar la colección del usuario en "Islas Sonoras" para navegación visual (t-SNE / UMAP).
- [ ] **Persistencia de Vectores (Vector Store)**
    - **Ubicación:** `packages/media-library`
    - **Tarea:** Adaptar el esquema de base de datos para almacenar y consultar eficientemente los JSON de embeddings.

---

## 🚀 Fase 4: Integración UI & Optimización ("The Craftsman")
*Enfoque: Exponer la inteligencia al usuario sin sacrificar rendimiento.*

- [ ] **Technical Inspector Panel**
    - **Ubicación:** `apps/web`
    - **Tarea:** Vista detallada que rompe la "caja negra" y muestra los resultados de auditoría al usuario.
- [ ] **Windowed Analysis Implementation**
    - **Ubicación:** `services/python-worker`
    - **Tarea:** Optimizar el análisis mediante lectura por bloques (windows) para evitar carga masiva de archivos en RAM.
- [ ] **DSP Native Filters (WASM)**
    - **Ubicación:** `packages/dsp`
    - **Tarea:** Implementar filtros de corrección acústica basados en los resultados del análisis de respuesta en frecuencia.

---

## 📈 Estado de Implementación

| Sistema | Estado | Ref |
| :--- | :---: | :--- |
| Auditoría de Picos | 📋 | - |
| Detección Key/BPM | 📋 | - |
| Audio Vectors (ML) | 📋 | - |
| Multi-stream (Stems) | 📋 | Ver `AI_INTEGRATION_PLAN.md` |

---
*Hecho con cuidado por Antigravity para Sonántica.*
