# Plan Maestro: "El Intérprete Científico" (Sonántica Intelligence)

Este documento unifica la visión de análisis técnico de audio (DAW-like) y la comprensión semántica cultural (AI-driven) para crear el ecosistema de recomendaciones y descubrimiento definitivo de Sonántica.

**Identidad:** "El Artesano Sabio". No adivinamos qué te gusta; entendemos por qué te gusta.

3.  **Lógica de Consulta Multi-Modal (Brain - Search & Recs)**
    *   [x] Modificar `PostgresVectorRepository.get_similar_tracks` para aceptar `weights`.
    *   [x] Implementar consulta SQL con CTEs para combinar `embeddings_audio_spectral`, `lyrics`, `visual`, `stems`.
    *   [x] Aplicar formula de ponderación: `Score = (w1*Audio + w2*Stems + w3*Lyrics + w4*Visual) / Sum(wi)`.

## 🏗️ Fase 1: Cimientos Multi-Modales (Infrasctructura)
**Objetivo:** Preparar a "Brain" para pensar en múltiples dimensiones (Audio, Texto, Visual).

### Tareas Prioritarias
1.  **Esquema de Base de Datos (PostgreSQL + pgvector)**
    *   [x] Crear migración para tablas particionadas de embeddings (`007_multimodal_embeddings.sql`):
        *   `embeddings_audio_spectral` (Timbre, ritmo - vía Brain/Librosa)
        *   `embeddings_audio_stems` (Bajo, Batería ailados - vía Demucs)
        *   `embeddings_lyrics_semantic` (Significado, narrativa - vía Knowledge/LLM)
        *   `embeddings_visual_aesthetic` (Arte de tapa, paleta - vía CLIP/BLIP)
    *   [x] Definir índices HNSW para cada dimensión.

2.  **Registro y Orquestación de Plugins**
    *   [x] Implementar `PluginRegistry` en Go-Core y Brain.
    *   [x] Estandarizar contratos de API (`POST /jobs`, `GET /status`, `GET /health`).
    *   [x] **Brain como Hub:** Brain debe ser capaz de consultar a `demucs` y `knowledge` si están activos, no el frontend directamente.

3.  **Lógica de Consulta Multi-Modal (Brain - Search & Recs)**
    *   [x] Modificar `PostgresVectorRepository.get_similar_tracks` para aceptar `weights`.
    *   [x] Implementar consulta SQL con CTEs para combinar `embeddings_audio_spectral`, `lyrics`, `visual`, `stems`.
    *   [x] Aplicar formula de ponderación: `Score = (w1*Audio + w2*Stems + w3*Lyrics + w4*Visual) / Sum(wi)`.

## 🎧 Fase 2: El Oído Crítico (Análisis de Señal & Stems)
**Objetivo:** Tratar el audio como dataset de primera clase (basado en `DAW_ANALISIS_IDEAS.md`).

### Tareas Prioritarias
1.  **Integración Profunda con Demucs**
    *   [x] Pipeline Parcial: `Audio -> Demucs -> 4 Stems (WAV)`.
    * [x] Pipeline Restante: `4 Stems (WAV) -> Brain -> 4 Vectores`.
    * [x] **Caso de Uso:** "Buscar canciones con líneas de bajo similares".

2.  **Metadata Técnica Extendida**
    * [x] Infraestructura de análisis real-time en Frontend (`AudioAnalyzer`).
    * [x] Extraer y almacenar rango dinámico (DR), LUFS integrados y picos reales en el backend (Postgres).
    * [ ] Detectar "silencio digital" o cortes abruptos (Gapless prep).

3.  **Auditoría de Calidad**
    * [x] Clasificación automática: "Lossless Real" vs "Upscaled" (Auditoría espectral en worker).

### Sugerencias Innovadoras
* [x] Motor de Análisis Profesional: `AudioAnalyzer` implementado con soporte para Stereo Scope, Correlation y FFT.
* [x] **"Modo Estudio Científico":** Toggle en la UI para visualización analítica (Espectrogramas, medidores VU).

## 📖 Fase 3: El Lector Cultural (Semántica y Contexto)
**Objetivo:** Entender la música como lenguaje y cultura (basado en `AI_ANALISIS_IDEAS.md`).

### Tareas Prioritarias
1.  **Knowledge Plugin (LLM/NLP)**
    *   [ ] Implementar extracción de "ADN Lírico": Vector de sentimiento (Nostalgia, Ira, Esperanza).
    *   [ ] **Continuidad Narrativa:** Analizar la secuencia de tracks de un álbum para detectar arcos narrativos.

2.  **Análisis Visual (Cover Art)**
    *   [ ] Implementar CLIP/BLIP (si hay recursos) o extracción de paleta de colores/formas básicas.
    *   [ ] Usar la estética para "Mood Matching" (ej. "Música oscura para portadas oscuras").

3.  **Grafo Cultural**
    *   [ ] Relacionar nodos no solo por sonido, sino por entidades nombradas (NER) en las letras (ciudades, fechas, personas).

3.  **Lógica de Consulta Multi-Modal (Brain - Search & Recs)**
    *   [x] Modificar `PostgresVectorRepository.get_similar_tracks` para aceptar `weights`.
    *   [x] Implementar consulta SQL con CTEs para combinar `embeddings_audio_spectral`, `lyrics`, `visual`, `stems`.
    *   [x] Aplicar formula de ponderación: `Score = (w1*Audio + w2*Stems + w3*Lyrics + w4*Visual) / Sum(wi)`.

## 🧠 Fase 4: La Síntesis (Motor de Recomendación)
**Objetivo:** Un algoritmo transparente y ponderado que el usuario controla.

### Tareas Prioritarias
1.  **Algoritmo de Similaridad Híbrida**
    *   Fórmula: `Score = (w1 * Audio) + (w2 * Stems) + (w3 * Lyrics) + (w4 * Visual)`
    *   Los `w` (pesos) son dinámicos por query.

2.  **Discovery Sidebar (Frontend)**
    *   [ ] **Input Reactivo:** Al cambiar de canción, Brain recibe el contexto completo.
    *   [ ] **Sliders de "Intención":**
        *   "Musicalidad" (Prioriza Audio/Stems)
        *   "Lírica" (Prioriza Significado)
        *   "Vibe" (Prioriza Visual/Estética)
    *   [ ] **Explicabilidad:** "Recomendado porque el bajo es similar y la temática es nostálgica".

3.  **Lógica de Consulta Multi-Modal (Brain - Search & Recs)**
    *   [x] Modificar `PostgresVectorRepository.get_similar_tracks` para aceptar `weights`.
    *   [x] Implementar consulta SQL con CTEs para combinar `embeddings_audio_spectral`, `lyrics`, `visual`, `stems`.
    *   [x] Aplicar formula de ponderación: `Score = (w1*Audio + w2*Stems + w3*Lyrics + w4*Visual) / Sum(wi)`.

## 🗑️ Descartes (Lo que NO haremos por ahora)

1.  **Filtrado Colaborativo (Social):** No nos interesa "lo que escuchan otros". Nos interesa la relación intrínseca entre las obras.
2.  **Cajas Negras de IA:** Todo embedding debe tener una metadata legible asociada (ej. Vector -> Tags autogenerados).
3.  **Análisis en tiempo real en Cliente:** Todo el procesamiento pesado se delega a los plugins (Python/Go). El cliente solo visualiza.
4.  **Términos de Marketing:** Evitar "IA Mágica". Usar "Análisis Espectral", "Conexión Semántica".

3.  **Lógica de Consulta Multi-Modal (Brain - Search & Recs)**
    *   [x] Modificar `PostgresVectorRepository.get_similar_tracks` para aceptar `weights`.
    *   [x] Implementar consulta SQL con CTEs para combinar `embeddings_audio_spectral`, `lyrics`, `visual`, `stems`.
    *   [x] Aplicar formula de ponderación: `Score = (w1*Audio + w2*Stems + w3*Lyrics + w4*Visual) / Sum(wi)`.

## 💡 Sugerencias Estratégicas

*   **Versionado Perceptual:** Si un usuario ecualiza una canción, guardar esa "versión" como una preferencia auditiva, no solo un preset global.
*   **Playlists Semánticas:** Generar playlists no por género, sino por narrativa (ej. "De la ruptura a la aceptación").
*   **Respeto al Silencio:** En las recomendaciones, considerar el "espacio negativo". No recomendar Death Metal después de una pieza ambiental suave a menos que el usuario busque contraste.
