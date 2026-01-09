# Aula Sonora - Resumen Ejecutivo
## Sonántica - Espacios Sagrados de Escucha Compartida

**Documento completo:** [`streaming_collaborative_plan.md`](./streaming_collaborative_plan.md)

---

## 🎵 ¿Qué es un Aula Sonora?

### Etimología
- **Aula** (latín) = Sala, espacio de experiencia y aprendizaje
- **Sonora** (latín *sonorus*) = Que suena, que resuena, lleno de sonido

### Filosofía
> *"Ubi Sonus Vivit, Anima Audit"* (Donde el sonido vive, el alma escucha)

Un **Aula Sonora** es un **espacio sagrado dedicado exclusivamente al sonido**. No es una sala de conciertos ordinaria ni una "radio social" ruidosa, es un **templo acústico** donde:

- 🎨 **El artista es libre de expresarse** sin restricciones ni degradación
- 🎧 **Los oyentes se reúnen** para experimentar la interpretación en sincronía perfecta
- 🤝 **El respeto mutuo** y la intención del sonido son la base de la conexión
- 🎼 **La música es la protagonista**, el silencio tiene valor, la fidelidad es absoluta

---

## 🎯 Prioridades del Sistema

### 1. 🎵 Calidad de Audio Absoluta (NUNCA se sacrifica)
- **Lossless por defecto** - FLAC, ALAC, WAV sin degradación
- **Cero re-encoding** en todo el pipeline
- **Soporte HQ** - Hasta 24-bit/192kHz
- **Monitoreo en tiempo real** - Los oyentes ven bitrate, codec, sample rate

### 2. 💰 Optimización de Recursos (Ahorrar sin perder performance)
- **Shared Buffer Pool** - Múltiples oyentes = 1 solo fetch
- **Stream Deduplication** - Backend reutiliza streams activos
- **Priorización dinámica** - Tracks populares se mantienen en caché más tiempo
- **Caché inteligente con Redis** - Hit rate objetivo > 80%

### 3. 🤝 Conexión Respetuosa (Identificación, conexión, respeto)
- **Modo silencioso por defecto** - El chat es opcional
- **Sincronización perfecta** - < 500ms drift entre oyentes
- **Modo oculto (lurker)** - Escuchar sin ser visto
- **Transparencia total** - Estado de calidad y sincronización visible

---

## 🏗️ Arquitectura

### Backend (Stream Core - Go)
```
┌─────────────────────────────────────┐
│   Aula Sonora Manager               │
│   - WebSocket Server                │
│   - Redis Pub/Sub                   │
│   - Stream Deduplication            │
│   - Quality Monitoring              │
└─────────────────────────────────────┘
```

### Frontend (Package - TypeScript)
```
@sonantica/aula-sonora
├── stores/useAulaSonoraStore.ts
├── services/
│   ├── AulaSonoraService.ts
│   ├── WebSocketManager.ts
│   └── PlaybackSynchronizer.ts
└── hooks/
    ├── useAulaSonora.ts
    └── useAulaSync.ts
```

---

## ✨ Características Clave

### Para el Curator (Host)
- Crear Aula Sonora (pública o privada)
- Controlar la cola de reproducción
- Ver métricas de calidad en tiempo real
- Configurar permisos (control compartido o exclusivo)

### Para los Oyentes
- Unirse a Aulas públicas o por invitación
- Escuchar en **sincronía perfecta** (< 500ms)
- **Ver la calidad de audio** (bitrate, codec, sample rate)
- **Modo oculto** - Escuchar sin aparecer en la lista
- Chat opcional (silencio por defecto)

### Para el Artista
- **Cero degradación** - La interpretación se preserva tal como fue creada
- **Respeto absoluto** - No hay re-encoding, no hay compresión forzada
- **Libertad de expresión** - Formatos lossless soportados nativamente

---

## 📊 Beneficios Esperados

### Calidad de Audio
- ✅ **0% de re-encoding** en el pipeline
- ✅ **FLAC 24-bit/192kHz** sin degradación
- ✅ **Latencia < 500ms** de buffering
- ✅ **Gapless playback** < 50ms

### Optimización de Recursos
- ✅ **70% menos requests** duplicados (mismo track)
- ✅ **80%+ cache hit rate** para tracks populares
- ✅ **Memoria compartida** entre oyentes de la misma Aula

### Experiencia Colaborativa
- ✅ **Sincronización < 500ms** entre oyentes
- ✅ **100+ oyentes** por Aula Sonora
- ✅ **< 2 segundos** para unirse a un Aula
- ✅ **Transparencia total** - Calidad visible en tiempo real

---

## 🗓️ Plan de Implementación (5 Semanas)

### Fase 1: Auditoría y Optimización de Calidad (Semana 1)
**Prioridad:** 🔴 CRÍTICA

- [ ] Instrumentar pipeline con logging detallado
- [ ] Verificar **cero re-encoding** en todo el flujo
- [ ] Implementar chunk size dinámico (basado en bitrate)
- [ ] Caché de metadatos en Redis
- [ ] **UI de calidad de audio** (mostrar bitrate, codec, sample rate)
- [ ] Validación de integridad (checksums)

**Entregable:** Pipeline auditado con garantía de fidelidad absoluta

### Fase 2: Infraestructura de Aulas Sonoras (Semana 2-3)
**Prioridad:** 🟠 ALTA

#### Semana 2: Backend
- [ ] `AulaSonoraService` en Stream Core (Go)
- [ ] WebSocket endpoints (`/ws/aula/create`, `/ws/aula/join`)
- [ ] Redis schema para Aulas
- [ ] Pub/Sub para sincronización
- [ ] Stream deduplication

#### Semana 3: Frontend
- [ ] Package `@sonantica/aula-sonora`
- [ ] `useAulaSonoraStore` (Zustand)
- [ ] `PlaybackSynchronizer` (< 500ms drift)
- [ ] WebSocket client
- [ ] UI básica de Aulas

**Entregable:** Sistema funcional de Aulas Sonoras con sincronización

### Fase 3: Features Colaborativas (Semana 4)
**Prioridad:** 🟡 MEDIA

- [ ] Sistema de priorización dinámica
- [ ] Modo oculto (lurker)
- [ ] Settings de streaming (configurables por usuario)
- [ ] Discover public Aulas
- [ ] Chat opcional (silencioso por defecto)

**Entregable:** Experiencia colaborativa completa

### Fase 4: Optimización de Recursos (Semana 4-5)
**Prioridad:** 🟠 ALTA

- [ ] Shared Buffer Pool (frontend)
- [ ] Backend stream deduplication
- [ ] Priorización de tracks populares
- [ ] Eviction policy inteligente

**Entregable:** Sistema optimizado con ahorro de recursos

### Fase 5: Testing y Validación (Semana 5)
**Prioridad:** 🔴 CRÍTICA

- [ ] Load testing (100+ oyentes por Aula)
- [ ] Latency testing (sincronización)
- [ ] Memory profiling (shared buffers)
- [ ] **Audio quality validation** (FLAC 24-bit/192kHz)
- [ ] UX testing

**Entregable:** Sistema validado y listo para producción

---

## 🎨 Alineación con la Identidad de Sonántica

### "The Wise Craftsman"
- ✅ **Respeto por el sonido** - Cero degradación, fidelidad absoluta
- ✅ **Autonomía del usuario** - Control total sobre privacidad y experiencia
- ✅ **Transparencia técnica** - UI muestra calidad y estado en tiempo real
- ✅ **Minimalismo intencional** - Silencio por defecto, chat opcional
- ✅ **Conocimiento compartido** - Open-source, arquitectura documentada

### Filosofía
> "No optimizamos para atraer atención, sino para preservar la intención del sonido."

Las **Aulas Sonoras** no son espacios ruidosos, son **templos acústicos** donde múltiples personas comparten la experiencia de escuchar, respetando el silencio, la intención del artista y la fidelidad del audio.

---

## 🔑 Decisiones de Diseño Clave

### 1. **Lossless por Defecto, Compresión Opcional**
El sistema **NUNCA** degrada la calidad automáticamente. Si el usuario quiere cambiar a un formato comprimido (MP3, AAC), debe ser una elección explícita y consciente.

### 2. **Curator, no Host**
El creador de un Aula Sonora es un **Curator** (curador), no un "host". Esto refleja el rol de **seleccionar y presentar** música con intención, como un curador de museo.

### 3. **Silencio como Default**
El chat es **opcional y desactivado por defecto**. La música es la protagonista, no la conversación.

### 4. **Transparencia Absoluta**
Los oyentes **siempre** ven:
- Calidad de audio actual (bitrate, codec, sample rate)
- Estado de sincronización (drift, latency)
- Número de oyentes (visibles + ocultos para priorización)

---

## ❓ Preguntas para Discusión

### 1. Control de la Cola
- **Opción A:** Solo el Curator controla la cola
- **Opción B:** Votación democrática entre oyentes
- **Opción C:** Configurable por Aula (Curator decide)

**Recomendación:** Opción C - Autonomía del usuario

### 2. Límites de Oyentes
- **MVP:** 100 oyentes por Aula
- **Futuro:** Aulas "premium" con más capacidad
- **Escalabilidad:** Horizontal scaling con Redis Cluster

### 3. Integración con Analytics
- Tracking de "listening together" sessions
- Recomendaciones basadas en Aulas populares
- Métricas de calidad de audio (degradación, buffering)

### 4. Monetización (Futuro)
- Aulas públicas ilimitadas (gratis)
- Aulas privadas con más capacidad (premium)
- Priorización de streams para usuarios premium

---

## 📚 Próximos Pasos Inmediatos

1. ✅ **Revisar y aprobar este plan**
2. 🔄 **Comenzar Fase 1** - Auditoría del pipeline de audio
3. 📝 **Crear issues en GitHub** para cada componente
4. 🏗️ **Definir contratos** (interfaces) entre packages
5. 🚀 **Implementar incrementalmente** respetando la arquitectura

---

## 🎯 Métricas de Éxito

### Calidad de Audio (Prioridad #1)
- [ ] 0% de re-encoding verificado en todo el pipeline
- [ ] FLAC 24-bit/192kHz reproducido sin degradación
- [ ] UI muestra calidad en tiempo real
- [ ] Latencia de buffering < 500ms

### Optimización de Recursos (Prioridad #2)
- [ ] 70% reducción en requests duplicados
- [ ] 80%+ cache hit rate para tracks populares
- [ ] Memoria compartida funcionando correctamente
- [ ] Costos de infraestructura reducidos

### Conexión Respetuosa (Prioridad #3)
- [ ] Sincronización < 500ms entre oyentes
- [ ] 100+ oyentes por Aula sin degradación
- [ ] Modo oculto funcional
- [ ] Chat opcional (silencio por defecto)

---

**Documento creado:** 2026-01-08  
**Versión:** 2.0  
**Concepto:** Aula Sonora (Espacio Sagrado de Escucha)  
**Filosofía:** *"Ubi Sonus Vivit, Anima Audit"*  
**Autor:** Antigravity Agent (Gemini) + Artur0sky

---

> **Aula Sonora** - Donde el artista es libre de expresarse, el oyente es libre de escuchar, y el sonido es libre de ser.
