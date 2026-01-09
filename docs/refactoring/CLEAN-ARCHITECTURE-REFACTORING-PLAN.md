# 🏗️ Plan de Refactorización: Clean Architecture & SOLID
## Servicios Go y Python - Sonántica

> **Filosofía Sonántica**: "Respect the intention of the sound and the freedom of the listener"  
> **Principio de Refactorización**: El código debe ser tan claro y elegante como el audio que procesa.

---

## 📊 Estado Actual del Proyecto

### Archivos Identificados para Refactorización

| Archivo | Líneas | Prioridad | Problemas Principales |
|---------|--------|-----------|----------------------|
| `services/go-core/analytics/handlers/analytics.go` | 717 | 🔴 CRÍTICA | Violaciones SRP, lógica de negocio en handlers, código duplicado |
| `services/go-core/api/library.go` | 727 | 🔴 CRÍTICA | Handlers monolíticos, queries SQL embebidas, sin separación de capas |
| `services/python-worker/worker.py` | 799 | 🔴 CRÍTICA | Múltiples responsabilidades, lógica mezclada, sin modularización |
| `services/go-core/scanner/scanner.go` | 151 | 🟡 MEDIA | Aceptable pero mejorable, falta logging estructurado |
| `services/go-core/models/models.go` | 55 | 🟢 BAJA | Estructura correcta, solo necesita documentación |

---

## 🎯 Objetivos de la Refactorización

### 1. **Atomic Design** (Aplicado a Backend)
- **Atoms**: Funciones puras, utilidades, validadores
- **Molecules**: Servicios específicos, repositorios
- **Organisms**: Casos de uso, orquestadores
- **Templates**: Handlers HTTP, controladores
- **Pages**: Composición final de rutas y middleware

### 2. **Clean Architecture**
```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Handlers, Controllers, DTOs)        │
├─────────────────────────────────────────┤
│         Application Layer               │
│    (Use Cases, Business Logic)          │
├─────────────────────────────────────────┤
│          Domain Layer                   │
│    (Entities, Interfaces, Rules)        │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │
│  (DB, Cache, External Services)         │
└─────────────────────────────────────────┘
```

### 3. **SOLID Principles**
- **S**ingle Responsibility: Una clase/función = una razón para cambiar
- **O**pen/Closed: Abierto a extensión, cerrado a modificación
- **L**iskov Substitution: Interfaces intercambiables
- **I**nterface Segregation: Interfaces pequeñas y específicas
- **D**ependency Inversion: Depender de abstracciones, no de implementaciones

### 4. **DRY (Don't Repeat Yourself)**
- Eliminar código duplicado
- Crear utilidades reutilizables
- Centralizar configuración

---

## 📋 FASE 1: Go Analytics Service (analytics.go - 717 líneas)

### Estado: ✅ Completado

### Problemas Identificados

#### 🔴 Violaciones SOLID
1. **SRP**: `AnalyticsHandler` tiene múltiples responsabilidades:
   - Manejo de HTTP
   - Lógica de caché
   - Agregación de datos
   - Parsing de filtros
   - Gestión de sesiones

2. **DIP**: Dependencia directa de implementaciones concretas (`storage.AnalyticsStorage`, `cache`)

3. **OCP**: Difícil extender sin modificar código existente

#### 🟡 Code Smells
- Funciones de 100+ líneas (`GetDashboard`, `IngestEventBatch`)
- Lógica de negocio en handlers HTTP
- Queries SQL embebidas en handlers
- Manejo de errores inconsistente
- Logging sin contexto estructurado

### Plan de Refactorización

#### 1.1. Crear Estructura de Capas

```
services/go-core/analytics/
├── domain/
│   ├── entities/
│   │   ├── event.go           # Entidades de dominio
│   │   ├── session.go
│   │   └── metrics.go
│   ├── repositories/
│   │   ├── event_repository.go      # Interfaces
│   │   ├── session_repository.go
│   │   └── metrics_repository.go
│   └── services/
│       ├── event_service.go         # Lógica de negocio
│       └── aggregation_service.go
├── application/
│   ├── usecases/
│   │   ├── ingest_event.go          # Casos de uso
│   │   ├── get_dashboard.go
│   │   └── get_realtime_stats.go
│   └── dto/
│       ├── event_dto.go             # Data Transfer Objects
│       └── dashboard_dto.go
├── infrastructure/
│   ├── persistence/
│   │   ├── postgres/
│   │   │   ├── event_repository_impl.go
│   │   │   └── session_repository_impl.go
│   │   └── redis/
│   │       └── cache_repository_impl.go
│   └── logging/
│       └── structured_logger.go
└── presentation/
    ├── http/
    │   ├── handlers/
    │   │   ├── event_handler.go     # Handlers HTTP limpios
    │   │   ├── dashboard_handler.go
    │   │   └── realtime_handler.go
    │   ├── middleware/
    │   │   ├── error_handler.go
    │   │   └── request_logger.go
    │   └── validators/
    │       └── event_validator.go
    └── routes/
        └── analytics_routes.go
```

#### 1.2. Implementación por Pasos

##### ✅ Paso 1.1: Crear Domain Layer
**Archivos a crear:**
- `domain/entities/event.go`
- `domain/entities/session.go`
- `domain/repositories/event_repository.go` (interface)
- `domain/services/event_service.go`

**Tareas:**
- [x] Extraer entidades de dominio de `models/event.go`
- [x] Definir interfaces de repositorio
- [x] Crear servicios de dominio con lógica de negocio pura
- [x] Agregar validaciones de dominio

**Estimación:** 4 horas

##### ✅ Paso 1.2: Crear Application Layer
**Archivos a crear:**
- `application/usecases/ingest_event.go`
- `application/usecases/get_dashboard.go`
- `application/dto/event_dto.go`

**Tareas:**
- [x] Extraer casos de uso de handlers
- [x] Crear DTOs para request/response
- [x] Implementar mappers entre DTOs y entidades
- [x] Agregar validación de entrada

**Estimación:** 6 horas

##### ✅ Paso 1.3: Crear Infrastructure Layer
**Archivos a crear:**
- `infrastructure/persistence/postgres/event_repository_impl.go`
- `infrastructure/persistence/redis/cache_repository_impl.go`
- `infrastructure/logging/structured_logger.go`

**Tareas:**
- [x] Implementar repositorios concretos
- [x] Migrar queries SQL a repositorios
- [x] Crear logger estructurado con trazas
- [x] Implementar manejo de errores robusto

**Estimación:** 8 horas

##### ✅ Paso 1.4: Refactorizar Presentation Layer
**Archivos a modificar:**
- `presentation/http/handlers/event_handler.go` (nuevo)
- `presentation/http/handlers/dashboard_handler.go` (nuevo)

**Tareas:**
- [x] Reducir handlers a 20-30 líneas
- [x] Delegar lógica a casos de uso
- [x] Implementar middleware de error handling
- [x] Agregar validación de entrada
- [x] Implementar logging con trace IDs

**Estimación:** 6 horas

##### ✅ Paso 1.5: Testing & Documentación
**Tareas:**
- [x] Unit tests para domain services
- [x] Integration tests para use cases
- [x] Documentar interfaces y contratos
- [x] Crear ejemplos de uso

**Estimación:** 4 horas

**Total Fase 1:** ~28 horas

---

## 📋 FASE 2: Go Library API (library.go - 727 líneas)

### Estado: ✅ Completado

### Problemas Identificados

#### 🔴 Violaciones SOLID
1. **SRP**: Handlers manejan HTTP, caché, queries SQL y lógica de negocio
2. **DRY**: Código duplicado en `GetTracks`, `GetArtists`, `GetAlbums`
3. **OCP**: Lógica de sorting hardcodeada

#### 🟡 Code Smells
- Queries SQL embebidas (líneas 71-83, 148-161, etc.)
- Lógica de caché duplicada en cada handler
- Parsing de parámetros repetitivo
- Sin abstracción para paginación

### Plan de Refactorización

#### 2.1. Crear Estructura de Capas

```
services/go-core/library/
├── domain/
│   ├── entities/
│   │   ├── track.go
│   │   ├── artist.go
│   │   └── album.go
│   ├── repositories/
│   │   ├── track_repository.go
│   │   ├── artist_repository.go
│   │   └── album_repository.go
│   └── services/
│       ├── library_service.go
│       └── search_service.go
├── application/
│   ├── usecases/
│   │   ├── get_tracks.go
│   │   ├── get_artists.go
│   │   ├── get_albums.go
│   │   └── scan_library.go
│   └── dto/
│       ├── pagination_dto.go
│       └── library_dto.go
├── infrastructure/
│   ├── persistence/
│   │   ├── postgres/
│   │   │   ├── track_repository_impl.go
│   │   │   ├── artist_repository_impl.go
│   │   │   └── query_builder.go
│   │   └── redis/
│   │       └── library_cache.go
│   └── utils/
│       ├── pagination.go
│       └── sorting.go
└── presentation/
    ├── http/
    │   ├── handlers/
    │   │   ├── track_handler.go
    │   │   ├── artist_handler.go
    │   │   └── album_handler.go
    │   └── validators/
    │       └── query_validator.go
    └── routes/
        └── library_routes.go
```

#### 2.2. Implementación por Pasos

##### ✅ Paso 2.1: Crear Query Builder (DRY)
**Archivo:** `infrastructure/persistence/postgres/query_builder.go`

**Tareas:**
- [x] Crear builder fluido para queries
- [x] Implementar sorting dinámico
- [x] Implementar paginación reutilizable
- [x] Agregar validación de parámetros

**Estimación:** 4 horas

##### ✅ Paso 2.2: Crear Repositorios
**Archivos a crear:**
- `infrastructure/persistence/postgres/track_repository_impl.go`
- `infrastructure/persistence/postgres/artist_repository_impl.go`
- `infrastructure/persistence/postgres/album_repository_impl.go`

**Tareas:**
- [x] Migrar queries SQL a repositorios
- [x] Implementar métodos con query builder
- [x] Agregar manejo de errores
- [x] Implementar logging

**Estimación:** 6 horas

##### ✅ Paso 2.3: Crear Cache Layer (DRY)
**Archivo:** `infrastructure/persistence/redis/library_cache.go`

**Tareas:**
- [x] Crear abstracción genérica de caché
- [x] Implementar cache-aside pattern
- [x] Agregar invalidación de caché
- [x] Implementar TTL configurable

**Estimación:** 4 horas

##### ✅ Paso 2.4: Crear Use Cases
**Archivos a crear:**
- `application/usecases/get_tracks.go`
- `application/usecases/get_artists.go`
- `application/usecases/get_albums.go`

**Tareas:**
- [x] Extraer lógica de negocio de handlers
- [x] Implementar orquestación caché + DB
- [x] Agregar validación de entrada
- [x] Implementar logging con contexto

**Estimación:** 6 horas

##### ✅ Paso 2.5: Refactorizar Handlers
**Tareas:**
- [x] Reducir handlers a 15-20 líneas
- [x] Delegar a use cases
- [x] Implementar validación
- [x] Agregar error handling

**Estimación:** 4 horas

##### ✅ Paso 2.6: Testing & Documentación
**Tareas:**
- [x] Unit tests para query builder
- [x] Unit tests para repositorios
- [x] Integration tests para use cases
- [x] Documentar API

**Estimación:** 4 horas

**Total Fase 2:** ~28 horas

---

## 📋 FASE 3: Python Worker (worker.py - 799 líneas)

### Estado: ✅ Completado

### Problemas Identificados

#### 🔴 Violaciones SOLID
1. **SRP**: Un archivo con múltiples responsabilidades:
   - Configuración
   - Modelos ORM
   - Repositorio
   - Análisis de audio
   - Tareas Celery
   - Logging

2. **DRY**: Código duplicado en upserts (líneas 335-504)
3. **OCP**: Lógica de agregación hardcodeada

#### 🟡 Code Smells
- Archivo monolítico de 799 líneas
- Funciones de 100+ líneas (`update_event_aggregation`)
- Lógica SQL compleja embebida
- Configuración mezclada con lógica

### Plan de Refactorización

#### 3.1. Crear Estructura de Módulos

```
services/python-worker/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── track.py
│   │   │   ├── artist.py
│   │   │   ├── album.py
│   │   │   └── analytics.py
│   │   ├── repositories/
│   │   │   ├── track_repository.py
│   │   │   ├── analytics_repository.py
│   │   │   └── base_repository.py
│   │   └── services/
│   │       ├── audio_analyzer.py
│   │       └── metadata_extractor.py
│   ├── application/
│   │   ├── usecases/
│   │   │   ├── analyze_audio.py
│   │   │   └── process_analytics.py
│   │   └── dto/
│   │       ├── audio_metadata_dto.py
│   │       └── analytics_event_dto.py
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   ├── track_model.py
│   │   │   │   ├── artist_model.py
│   │   │   │   └── analytics_model.py
│   │   │   ├── repositories/
│   │   │   │   ├── track_repository_impl.py
│   │   │   │   └── analytics_repository_impl.py
│   │   │   └── session.py
│   │   ├── cache/
│   │   │   └── redis_client.py
│   │   ├── tasks/
│   │   │   ├── audio_tasks.py
│   │   │   └── analytics_tasks.py
│   │   └── logging/
│   │       ├── json_formatter.py
│   │       └── logger_config.py
│   ├── config/
│   │   ├── settings.py
│   │   └── celery_config.py
│   └── utils/
│       ├── cover_art_extractor.py
│       └── metadata_parser.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── main.py
```

#### 3.2. Implementación por Pasos

##### ✅ Paso 3.1: Separar Configuración
**Archivos a crear:**
- `src/config/settings.py`
- `src/config/celery_config.py`

**Tareas:**
- [x] Extraer configuración a módulo dedicado
- [x] Implementar validación de configuración
- [x] Usar pydantic para settings
- [x] Agregar configuración por entorno

**Estimación:** 2 horas

##### ✅ Paso 3.2: Separar Modelos ORM
**Archivos a crear:**
- `src/infrastructure/database/models/track_model.py`
- `src/infrastructure/database/models/artist_model.py`
- `src/infrastructure/database/models/album_model.py`
- `src/infrastructure/database/models/analytics_model.py`

**Tareas:**
- [x] Migrar modelos SQLAlchemy a archivos separados
- [x] Agregar documentación a modelos
- [x] Implementar métodos helper en modelos
- [x] Crear base model con campos comunes

**Estimación:** 3 horas

##### ✅ Paso 3.3: Crear Logging Estructurado
**Archivos a crear:**
- `src/infrastructure/logging/json_formatter.py`
- `src/infrastructure/logging/logger_config.py`

**Tareas:**
- [x] Extraer JSONFormatter a módulo
- [x] Crear configuración centralizada de logging
- [x] Implementar contexto de trazas
- [x] Agregar niveles de log configurables

**Estimación:** 2 horas

##### ✅ Paso 3.4: Refactorizar Repositorio
**Archivos a crear:**
- `src/domain/repositories/base_repository.py`
- `src/infrastructure/database/repositories/track_repository_impl.py`
- `src/infrastructure/database/repositories/analytics_repository_impl.py`

**Tareas:**
- [x] Crear base repository con operaciones comunes
- [x] Implementar pattern Repository
- [x] Separar lógica de upsert
- [x] Agregar manejo de errores robusto

**Estimación:** 6 horas

##### ✅ Paso 3.5: Modularizar Análisis de Audio
**Archivos a crear:**
- `src/domain/services/audio_analyzer.py`
- `src/domain/services/metadata_extractor.py`
- `src/utils/cover_art_extractor.py`

**Tareas:**
- [x] Extraer función `analyze_audio` a servicio
- [x] Separar extracción de cover art
- [x] Crear parser de metadata
- [x] Implementar validación de archivos

**Estimación:** 4 horas

##### ✅ Paso 3.6: Refactorizar Tareas Celery
**Archivos a crear:**
- `src/infrastructure/tasks/audio_tasks.py`
- `src/infrastructure/tasks/analytics_tasks.py`
- `src/application/usecases/analyze_audio.py`
- `src/application/usecases/process_analytics.py`

**Tareas:**
- [x] Separar tareas Celery por dominio
- [x] Crear use cases para lógica de negocio
- [x] Implementar retry logic configurable
- [x] Agregar logging con trace IDs

**Estimación:** 6 horas

##### ✅ Paso 3.7: Refactorizar Agregación de Analytics
**Archivo:** `src/domain/services/analytics_aggregator.py`

**Tareas:**
- [x] Extraer lógica de `update_event_aggregation`
- [x] Crear estrategias por tipo de evento (Strategy Pattern)
- [x] Implementar builders para upserts
- [x] Reducir complejidad ciclomática

**Estimación:** 8 horas

##### ✅ Paso 3.8: Testing & Documentación
**Tareas:**
- [x] Unit tests para servicios
- [x] Unit tests para repositorios
- [x] Integration tests para tareas Celery
- [x] Documentar arquitectura
- [x] Crear guía de desarrollo

**Estimación:** 6 horas

**Total Fase 3:** ~37 horas

---

## 📋 FASE 4: Mejoras Transversales

### Estado: 🚧 En Progreso

### 4.1. Logging Estructurado

**Objetivo:** Implementar logging consistente con trazas distribuidas

**Tareas:**
- [x] Implementar trace IDs en Go (usando context)
- [x] Implementar trace IDs en Python (usando contextvars)
- [x] Crear formato JSON estructurado
- [x] Agregar niveles de log configurables
- [ ] Implementar log rotation

**Estimación:** 6 horas

### 4.2. Error Handling Robusto

**Objetivo:** Manejo de errores consistente y recuperable

**Tareas:**
- [x] Crear jerarquía de errores custom en Go
- [ ] Crear excepciones custom en Python
- [x] Implementar retry logic configurable (Go Middleware & Celery)
- [ ] Agregar circuit breaker para servicios externos
- [x] Implementar graceful degradation

**Estimación:** 8 horas

### 4.3. Configuración Centralizada

**Objetivo:** Configuración por entorno y validada

**Tareas:**
- [x] Implementar viper en Go
- [x] Implementar pydantic settings en Python
- [x] Crear archivos de configuración por entorno
- [x] Validar configuración al inicio
- [x] Documentar variables de entorno

**Estimación:** 4 horas

### 4.4. Métricas y Observabilidad

**Objetivo:** Monitoreo de performance y salud

**Tareas:**
- [ ] Implementar Prometheus metrics en Go
- [ ] Implementar Prometheus metrics en Python
- [ ] Agregar health checks
- [ ] Implementar tracing distribuido (OpenTelemetry)
- [ ] Crear dashboards de Grafana

**Estimación:** 10 horas

**Total Fase 4:** ~28 horas

---

## 📋 FASE 5: Testing & Documentación

### Estado: ⏸️ Pendiente

### 5.1. Testing Automatizado

**Tareas:**
- [ ] Unit tests (cobertura >80%)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Configurar CI/CD para tests

**Estimación:** 20 horas

### 5.2. Documentación

**Tareas:**
- [ ] Documentar arquitectura (diagramas C4)
- [ ] Documentar APIs (OpenAPI/Swagger)
- [ ] Crear guías de desarrollo
- [ ] Documentar decisiones arquitectónicas (ADRs)
- [ ] Crear ejemplos de uso

**Estimación:** 12 horas

**Total Fase 5:** ~32 horas

---

## 📊 Resumen de Estimaciones

| Fase | Descripción | Horas | Prioridad |
|------|-------------|-------|-----------|
| **Fase 1** | Go Analytics Service | 28h | 🔴 CRÍTICA |
| **Fase 2** | Go Library API | 28h | 🔴 CRÍTICA |
| **Fase 3** | Python Worker | 37h | 🔴 CRÍTICA |
| **Fase 4** | Mejoras Transversales | 28h | 🟡 ALTA |
| **Fase 5** | Testing & Docs | 32h | 🟡 ALTA |
| **TOTAL** | | **153h** | (~4 semanas) |

---

## 🎯 Criterios de Éxito

### Métricas de Calidad

- [ ] **Cobertura de tests**: >80%
- [ ] **Complejidad ciclomática**: <10 por función
- [ ] **Líneas por archivo**: <300
- [ ] **Líneas por función**: <50
- [ ] **Duplicación de código**: <3%

### Métricas de Performance

- [ ] **Tiempo de respuesta API**: <100ms (p95)
- [ ] **Throughput analytics**: >1000 eventos/seg
- [ ] **Uso de memoria**: Reducción del 20%
- [ ] **Latencia de caché**: <10ms

### Métricas de Mantenibilidad

- [ ] **Tiempo para agregar feature**: Reducción del 40%
- [ ] **Tiempo para fix bug**: Reducción del 50%
- [ ] **Onboarding de desarrolladores**: <2 días

---

## 🚀 Orden de Ejecución Recomendado

### Sprint 1 (Semana 1)
1. ✅ Fase 1, Paso 1.1: Domain Layer Analytics
2. ✅ Fase 1, Paso 1.2: Application Layer Analytics
3. ✅ Fase 3, Paso 3.1-3.3: Config + Models + Logging Python

### Sprint 2 (Semana 2)
1. ✅ Fase 1, Paso 1.3-1.4: Infrastructure + Presentation Analytics
2. ✅ Fase 2, Paso 2.1-2.2: Query Builder + Repositorios Library
3. ✅ Fase 3, Paso 3.4-3.5: Repositorios + Audio Analyzer Python

### Sprint 3 (Semana 3)
1. ✅ Fase 2, Paso 2.3-2.5: Cache + Use Cases + Handlers Library
2. ✅ Fase 3, Paso 3.6-3.7: Celery Tasks + Analytics Aggregator
3. ✅ Fase 4, Paso 4.1-4.2: Logging + Error Handling

### Sprint 4 (Semana 4)
1. ✅ Fase 1, Paso 1.5: Testing Analytics
2. ✅ Fase 2, Paso 2.6: Testing Library
3. ✅ Fase 3, Paso 3.8: Testing Python
4. ✅ Fase 4, Paso 4.3-4.4: Config + Observabilidad
5. ✅ Fase 5: Documentación

---

## 📝 Notas de Implementación

### Principios a Seguir

1. **"The Wise Craftsman"**: Cada cambio debe ser reflexivo y mejorar la calidad
2. **"Sound is language"**: El código debe comunicar claramente su intención
3. **"Respect the intention"**: No romper funcionalidad existente
4. **"User autonomy"**: Código extensible y configurable

### Reglas de Refactorización

1. ✅ **Nunca refactorizar sin tests**
2. ✅ **Un cambio a la vez** (commits atómicos)
3. ✅ **Mantener funcionalidad** (green refactoring)
4. ✅ **Documentar decisiones** (ADRs)
5. ✅ **Revisar con el equipo** (code reviews)

### Herramientas Recomendadas

**Go:**
- `golangci-lint`: Linting
- `go test -cover`: Cobertura
- `go-critic`: Code smells
- `gocyclo`: Complejidad ciclomática

**Python:**
- `pylint`: Linting
- `pytest`: Testing
- `coverage.py`: Cobertura
- `radon`: Complejidad ciclomática
- `black`: Formatting

---

## 🔄 Proceso de Revisión

### Checklist por Pull Request

- [ ] Tests pasan (unit + integration)
- [ ] Cobertura >80%
- [ ] Linting sin errores
- [ ] Documentación actualizada
- [ ] Performance no degradado
- [ ] Revisión de código aprobada
- [ ] ADR creado (si aplica)

---

## 📚 Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [Go Project Layout](https://github.com/golang-standards/project-layout)
- [Python Clean Architecture](https://github.com/cosmic-python/book)

---

**Última actualización:** 2026-01-08  
**Responsable:** Equipo Sonántica  
**Estado:** 📋 En Planificación
