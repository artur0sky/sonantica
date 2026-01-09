# 🔧 Ejemplos de Refactorización: Antes y Después

## Sonántica - Clean Architecture & SOLID

> Este documento muestra ejemplos concretos de cómo refactorizar el código existente siguiendo los principios de Clean Architecture, SOLID y DRY.

---

## 📘 Ejemplo 1: Analytics Handler (Go)

### ❌ ANTES: Violaciones SOLID (analytics.go - líneas 35-70)

```go
// ❌ PROBLEMA: Handler con múltiples responsabilidades
// - Manejo HTTP
// - Validación
// - Lógica de negocio
// - Acceso a base de datos
// - Gestión de caché
// - Gestión de sesiones

func (h *AnalyticsHandler) IngestEvent(w http.ResponseWriter, r *http.Request) {
    var event models.AnalyticsEvent
    
    // ❌ Parsing sin validación robusta
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    // ❌ Lógica de negocio en handler
    ip := getIP(r)
    event.IPAddress = &ip
    
    // ❌ Llamada directa a storage (violación DIP)
    if err := h.handleSessionEvent(&event); err != nil {
        log.Printf("Error handling session event: %v", err)
    }
    
    // ❌ Llamada directa a storage
    if err := h.storage.InsertEvent(r.Context(), &event); err != nil {
        log.Printf("Error inserting event: %v", err)
    }
    
    // ❌ Lógica de caché embebida
    go func() {
        if err := cache.EnqueueCeleryTask(context.Background(), "sonantica.process_analytics", event); err != nil {
            log.Printf("Failed to enqueue analytics task: %v", err)
        }
    }()
    
    // ❌ Response sin estructura
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{
        "status":  "ok",
        "eventId": event.EventID,
    })
}
```

### ✅ DESPUÉS: Clean Architecture

#### 1. Domain Layer

```go
// ✅ domain/entities/event.go
package entities

import (
    "time"
    "errors"
)

// Event representa un evento de analytics en el dominio
type Event struct {
    EventID   string
    SessionID string
    EventType EventType
    Timestamp time.Time
    Data      map[string]interface{}
    IPAddress string
    UserID    *string
}

// EventType representa los tipos de eventos válidos
type EventType string

const (
    EventPlaybackStart    EventType = "playback.start"
    EventPlaybackComplete EventType = "playback.complete"
    EventSessionStart     EventType = "session.start"
)

// Validate valida la entidad de dominio
func (e *Event) Validate() error {
    if e.EventID == "" {
        return errors.New("event ID is required")
    }
    if e.SessionID == "" {
        return errors.New("session ID is required")
    }
    if !e.EventType.IsValid() {
        return errors.New("invalid event type")
    }
    return nil
}

// IsValid verifica si el tipo de evento es válido
func (et EventType) IsValid() bool {
    switch et {
    case EventPlaybackStart, EventPlaybackComplete, EventSessionStart:
        return true
    }
    return false
}
```

```go
// ✅ domain/repositories/event_repository.go
package repositories

import (
    "context"
    "sonantica/analytics/domain/entities"
)

// EventRepository define el contrato para persistencia de eventos
type EventRepository interface {
    Save(ctx context.Context, event *entities.Event) error
    SaveBatch(ctx context.Context, events []*entities.Event) error
    FindByID(ctx context.Context, eventID string) (*entities.Event, error)
}

// SessionRepository define el contrato para gestión de sesiones
type SessionRepository interface {
    CreateOrUpdate(ctx context.Context, session *entities.Session) error
    UpdateHeartbeat(ctx context.Context, sessionID string) error
}
```

```go
// ✅ domain/services/event_service.go
package services

import (
    "context"
    "sonantica/analytics/domain/entities"
    "sonantica/analytics/domain/repositories"
    "sonantica/infrastructure/logging"
)

// EventService contiene la lógica de negocio para eventos
type EventService struct {
    eventRepo   repositories.EventRepository
    sessionRepo repositories.SessionRepository
    logger      logging.Logger
}

func NewEventService(
    eventRepo repositories.EventRepository,
    sessionRepo repositories.SessionRepository,
    logger logging.Logger,
) *EventService {
    return &EventService{
        eventRepo:   eventRepo,
        sessionRepo: sessionRepo,
        logger:      logger,
    }
}

// ProcessEvent procesa un evento aplicando reglas de negocio
func (s *EventService) ProcessEvent(ctx context.Context, event *entities.Event) error {
    // Validación de dominio
    if err := event.Validate(); err != nil {
        s.logger.Error(ctx, "Invalid event", "error", err)
        return err
    }
    
    // Lógica de negocio: actualizar sesión si es evento de sesión
    if event.EventType == entities.EventSessionStart {
        session := entities.NewSessionFromEvent(event)
        if err := s.sessionRepo.CreateOrUpdate(ctx, session); err != nil {
            s.logger.Error(ctx, "Failed to update session", "error", err)
            return err
        }
    }
    
    // Persistir evento
    if err := s.eventRepo.Save(ctx, event); err != nil {
        s.logger.Error(ctx, "Failed to save event", "error", err)
        return err
    }
    
    s.logger.Info(ctx, "Event processed successfully", "eventID", event.EventID)
    return nil
}
```

#### 2. Application Layer

```go
// ✅ application/usecases/ingest_event.go
package usecases

import (
    "context"
    "sonantica/analytics/application/dto"
    "sonantica/analytics/domain/entities"
    "sonantica/analytics/domain/services"
    "sonantica/infrastructure/logging"
    "sonantica/infrastructure/queue"
)

// IngestEventUseCase orquesta la ingesta de eventos
type IngestEventUseCase struct {
    eventService *services.EventService
    queue        queue.TaskQueue
    logger       logging.Logger
}

func NewIngestEventUseCase(
    eventService *services.EventService,
    queue queue.TaskQueue,
    logger logging.Logger,
) *IngestEventUseCase {
    return &IngestEventUseCase{
        eventService: eventService,
        queue:        queue,
        logger:       logger,
    }
}

// Execute ejecuta el caso de uso
func (uc *IngestEventUseCase) Execute(ctx context.Context, input dto.IngestEventInput) (*dto.IngestEventOutput, error) {
    // Mapear DTO a entidad de dominio
    event := input.ToEntity()
    
    // Enriquecer con información de contexto
    event.IPAddress = input.IPAddress
    
    // Procesar evento (lógica de negocio)
    if err := uc.eventService.ProcessEvent(ctx, event); err != nil {
        return nil, err
    }
    
    // Encolar para procesamiento asíncrono (agregación)
    if err := uc.queue.Enqueue(ctx, "process_analytics", event); err != nil {
        uc.logger.Warn(ctx, "Failed to enqueue event for aggregation", "error", err)
        // No retornamos error porque el evento ya se guardó
    }
    
    return &dto.IngestEventOutput{
        EventID: event.EventID,
        Status:  "accepted",
    }, nil
}
```

```go
// ✅ application/dto/event_dto.go
package dto

import (
    "sonantica/analytics/domain/entities"
    "time"
)

// IngestEventInput representa la entrada del caso de uso
type IngestEventInput struct {
    EventID   string                 `json:"eventId" validate:"required,uuid"`
    SessionID string                 `json:"sessionId" validate:"required"`
    EventType string                 `json:"eventType" validate:"required"`
    Timestamp int64                  `json:"timestamp" validate:"required"`
    Data      map[string]interface{} `json:"data"`
    IPAddress string                 // Inyectado por el handler
}

// ToEntity convierte el DTO a entidad de dominio
func (i *IngestEventInput) ToEntity() *entities.Event {
    return &entities.Event{
        EventID:   i.EventID,
        SessionID: i.SessionID,
        EventType: entities.EventType(i.EventType),
        Timestamp: time.Unix(0, i.Timestamp*int64(time.Millisecond)),
        Data:      i.Data,
        IPAddress: i.IPAddress,
    }
}

// IngestEventOutput representa la salida del caso de uso
type IngestEventOutput struct {
    EventID string `json:"eventId"`
    Status  string `json:"status"`
}
```

#### 3. Infrastructure Layer

```go
// ✅ infrastructure/persistence/postgres/event_repository_impl.go
package postgres

import (
    "context"
    "sonantica/analytics/domain/entities"
    "sonantica/analytics/domain/repositories"
    "sonantica/infrastructure/logging"
    
    "github.com/jackc/pgx/v5/pgxpool"
)

// EventRepositoryImpl implementa EventRepository usando PostgreSQL
type EventRepositoryImpl struct {
    db     *pgxpool.Pool
    logger logging.Logger
}

func NewEventRepository(db *pgxpool.Pool, logger logging.Logger) repositories.EventRepository {
    return &EventRepositoryImpl{
        db:     db,
        logger: logger,
    }
}

func (r *EventRepositoryImpl) Save(ctx context.Context, event *entities.Event) error {
    query := `
        INSERT INTO analytics_events (
            event_id, session_id, event_type, timestamp, data, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_id) DO NOTHING
    `
    
    _, err := r.db.Exec(ctx, query,
        event.EventID,
        event.SessionID,
        event.EventType,
        event.Timestamp,
        event.Data,
        event.IPAddress,
    )
    
    if err != nil {
        r.logger.Error(ctx, "Failed to save event", "error", err, "eventID", event.EventID)
        return err
    }
    
    r.logger.Debug(ctx, "Event saved", "eventID", event.EventID)
    return nil
}

func (r *EventRepositoryImpl) SaveBatch(ctx context.Context, events []*entities.Event) error {
    // Implementación de batch insert
    // ...
    return nil
}

func (r *EventRepositoryImpl) FindByID(ctx context.Context, eventID string) (*entities.Event, error) {
    // Implementación de búsqueda
    // ...
    return nil, nil
}
```

```go
// ✅ infrastructure/logging/structured_logger.go
package logging

import (
    "context"
    "log/slog"
    "os"
)

// Logger define la interfaz de logging
type Logger interface {
    Debug(ctx context.Context, msg string, args ...interface{})
    Info(ctx context.Context, msg string, args ...interface{})
    Warn(ctx context.Context, msg string, args ...interface{})
    Error(ctx context.Context, msg string, args ...interface{})
}

// StructuredLogger implementa Logger usando slog
type StructuredLogger struct {
    logger *slog.Logger
}

func NewStructuredLogger() Logger {
    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    })
    return &StructuredLogger{
        logger: slog.New(handler),
    }
}

func (l *StructuredLogger) Info(ctx context.Context, msg string, args ...interface{}) {
    // Extraer trace ID del contexto
    traceID := getTraceID(ctx)
    
    // Agregar trace ID a los argumentos
    allArgs := append([]interface{}{"trace_id", traceID}, args...)
    
    l.logger.InfoContext(ctx, msg, allArgs...)
}

// ... implementar otros métodos

func getTraceID(ctx context.Context) string {
    if traceID, ok := ctx.Value("trace_id").(string); ok {
        return traceID
    }
    return "unknown"
}
```

#### 4. Presentation Layer

```go
// ✅ presentation/http/handlers/event_handler.go
package handlers

import (
    "encoding/json"
    "net/http"
    
    "sonantica/analytics/application/dto"
    "sonantica/analytics/application/usecases"
    "sonantica/presentation/http/middleware"
    "sonantica/presentation/http/validators"
)

// EventHandler maneja requests HTTP para eventos
type EventHandler struct {
    ingestUseCase *usecases.IngestEventUseCase
    validator     *validators.EventValidator
}

func NewEventHandler(
    ingestUseCase *usecases.IngestEventUseCase,
    validator *validators.EventValidator,
) *EventHandler {
    return &EventHandler{
        ingestUseCase: ingestUseCase,
        validator:     validator,
    }
}

// IngestEvent maneja POST /api/v1/analytics/events
func (h *EventHandler) IngestEvent(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // 1. Parse request
    var input dto.IngestEventInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    
    // 2. Validar entrada
    if err := h.validator.Validate(&input); err != nil {
        middleware.RespondError(w, http.StatusBadRequest, err.Error())
        return
    }
    
    // 3. Enriquecer con información del request
    input.IPAddress = middleware.GetClientIP(r)
    
    // 4. Ejecutar caso de uso
    output, err := h.ingestUseCase.Execute(ctx, input)
    if err != nil {
        middleware.RespondError(w, http.StatusInternalServerError, "Failed to process event")
        return
    }
    
    // 5. Responder
    middleware.RespondJSON(w, http.StatusCreated, output)
}
```

```go
// ✅ presentation/http/middleware/response.go
package middleware

import (
    "encoding/json"
    "net/http"
)

// ErrorResponse representa una respuesta de error
type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message"`
}

// RespondJSON envía una respuesta JSON
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

// RespondError envía una respuesta de error
func RespondError(w http.ResponseWriter, status int, message string) {
    RespondJSON(w, status, ErrorResponse{
        Error:   http.StatusText(status),
        Message: message,
    })
}
```

```go
// ✅ presentation/http/validators/event_validator.go
package validators

import (
    "sonantica/analytics/application/dto"
    
    "github.com/go-playground/validator/v10"
)

// EventValidator valida DTOs de eventos
type EventValidator struct {
    validate *validator.Validate
}

func NewEventValidator() *EventValidator {
    return &EventValidator{
        validate: validator.New(),
    }
}

func (v *EventValidator) Validate(input *dto.IngestEventInput) error {
    return v.validate.Struct(input)
}
```

### 📊 Comparación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas en handler** | 35 | 15 |
| **Responsabilidades** | 6 | 1 (solo HTTP) |
| **Testabilidad** | Baja (dependencias concretas) | Alta (interfaces) |
| **Reutilización** | Imposible | Alta (use cases) |
| **Mantenibilidad** | Baja | Alta |
| **Violaciones SOLID** | SRP, DIP, OCP | Ninguna |

---

## 📘 Ejemplo 2: Query Duplicado (Go Library)

### ❌ ANTES: Código Duplicado (library.go)

```go
// ❌ PROBLEMA: Código duplicado en GetTracks, GetArtists, GetAlbums
// - Lógica de caché repetida
// - Parsing de parámetros repetido
// - Queries SQL similares

func GetTracks(w http.ResponseWriter, r *http.Request) {
    // ❌ Parsing duplicado
    limit := 50
    offset := 0
    if l := r.URL.Query().Get("limit"); l != "" {
        fmt.Sscanf(l, "%d", &limit)
    }
    if o := r.URL.Query().Get("offset"); o != "" {
        fmt.Sscanf(o, "%d", &offset)
    }
    
    // ❌ Lógica de caché duplicada
    var tracks []models.Track
    if err := cache.GetTracks(r.Context(), offset, limit, sortParam, orderParam, &tracks); err == nil {
        json.NewEncoder(w).Encode(map[string]interface{}{
            "tracks": tracks,
            "cached": true,
        })
        return
    }
    
    // ❌ Query SQL embebida
    query := `SELECT ... FROM tracks ... LIMIT $1 OFFSET $2`
    rows, err := database.DB.Query(r.Context(), query, limit, offset)
    // ...
}

func GetArtists(w http.ResponseWriter, r *http.Request) {
    // ❌ MISMO CÓDIGO DUPLICADO
    limit := 50
    offset := 0
    if l := r.URL.Query().Get("limit"); l != "" {
        fmt.Sscanf(l, "%d", &limit)
    }
    // ... etc
}
```

### ✅ DESPUÉS: DRY con Abstracciones

```go
// ✅ infrastructure/persistence/postgres/query_builder.go
package postgres

import (
    "fmt"
    "strings"
)

// QueryBuilder construye queries SQL de forma fluida
type QueryBuilder struct {
    table      string
    columns    []string
    joins      []string
    where      []string
    orderBy    string
    limit      int
    offset     int
    args       []interface{}
    argCounter int
}

func NewQueryBuilder(table string) *QueryBuilder {
    return &QueryBuilder{
        table:      table,
        columns:    []string{},
        joins:      []string{},
        where:      []string{},
        args:       []interface{}{},
        argCounter: 1,
    }
}

func (qb *QueryBuilder) Select(columns ...string) *QueryBuilder {
    qb.columns = append(qb.columns, columns...)
    return qb
}

func (qb *QueryBuilder) LeftJoin(table, condition string) *QueryBuilder {
    qb.joins = append(qb.joins, fmt.Sprintf("LEFT JOIN %s ON %s", table, condition))
    return qb
}

func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
    qb.where = append(qb.where, condition)
    qb.args = append(qb.args, args...)
    return qb
}

func (qb *QueryBuilder) OrderBy(column, direction string) *QueryBuilder {
    qb.orderBy = fmt.Sprintf("%s %s", column, strings.ToUpper(direction))
    return qb
}

func (qb *QueryBuilder) Paginate(limit, offset int) *QueryBuilder {
    qb.limit = limit
    qb.offset = offset
    return qb
}

func (qb *QueryBuilder) Build() (string, []interface{}) {
    var parts []string
    
    // SELECT
    parts = append(parts, fmt.Sprintf("SELECT %s", strings.Join(qb.columns, ", ")))
    
    // FROM
    parts = append(parts, fmt.Sprintf("FROM %s", qb.table))
    
    // JOINS
    if len(qb.joins) > 0 {
        parts = append(parts, strings.Join(qb.joins, " "))
    }
    
    // WHERE
    if len(qb.where) > 0 {
        parts = append(parts, fmt.Sprintf("WHERE %s", strings.Join(qb.where, " AND ")))
    }
    
    // ORDER BY
    if qb.orderBy != "" {
        parts = append(parts, fmt.Sprintf("ORDER BY %s", qb.orderBy))
    }
    
    // LIMIT & OFFSET
    if qb.limit > 0 {
        parts = append(parts, fmt.Sprintf("LIMIT $%d", qb.nextArg()))
        qb.args = append(qb.args, qb.limit)
    }
    if qb.offset > 0 {
        parts = append(parts, fmt.Sprintf("OFFSET $%d", qb.nextArg()))
        qb.args = append(qb.args, qb.offset)
    }
    
    return strings.Join(parts, " "), qb.args
}

func (qb *QueryBuilder) nextArg() int {
    arg := qb.argCounter
    qb.argCounter++
    return arg
}
```

```go
// ✅ infrastructure/utils/pagination.go
package utils

import (
    "net/http"
    "strconv"
)

// PaginationParams representa parámetros de paginación
type PaginationParams struct {
    Limit  int
    Offset int
}

// ParsePaginationParams extrae parámetros de paginación del request
func ParsePaginationParams(r *http.Request, defaultLimit int) PaginationParams {
    limit := defaultLimit
    offset := 0
    
    if l := r.URL.Query().Get("limit"); l != "" {
        if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
            limit = parsed
        }
    }
    
    if o := r.URL.Query().Get("offset"); o != "" {
        if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
            offset = parsed
        }
    }
    
    // Validar límites
    if limit > 100 {
        limit = 100
    }
    
    return PaginationParams{
        Limit:  limit,
        Offset: offset,
    }
}

// SortingParams representa parámetros de ordenamiento
type SortingParams struct {
    SortBy    string
    Direction string
}

// ParseSortingParams extrae parámetros de ordenamiento
func ParseSortingParams(r *http.Request, defaultSort string) SortingParams {
    sortBy := defaultSort
    direction := "asc"
    
    if s := r.URL.Query().Get("sort"); s != "" {
        sortBy = s
    }
    
    if d := r.URL.Query().Get("order"); d == "desc" {
        direction = "desc"
    }
    
    return SortingParams{
        SortBy:    sortBy,
        Direction: direction,
    }
}
```

```go
// ✅ infrastructure/persistence/postgres/track_repository_impl.go
package postgres

import (
    "context"
    "sonantica/library/domain/entities"
    "sonantica/library/domain/repositories"
    
    "github.com/jackc/pgx/v5/pgxpool"
)

type TrackRepositoryImpl struct {
    db *pgxpool.Pool
}

func NewTrackRepository(db *pgxpool.Pool) repositories.TrackRepository {
    return &TrackRepositoryImpl{db: db}
}

func (r *TrackRepositoryImpl) FindAll(ctx context.Context, opts repositories.QueryOptions) ([]*entities.Track, error) {
    // ✅ Usar query builder
    qb := NewQueryBuilder("tracks t").
        Select(
            "t.id", "t.title", "t.album_id", "t.artist_id",
            "a.name as artist_name",
            "al.title as album_title",
        ).
        LeftJoin("artists a", "t.artist_id = a.id").
        LeftJoin("albums al", "t.album_id = al.id")
    
    // Aplicar ordenamiento
    if opts.SortBy != "" {
        qb.OrderBy(opts.SortBy, opts.Direction)
    }
    
    // Aplicar paginación
    qb.Paginate(opts.Limit, opts.Offset)
    
    // Construir query
    query, args := qb.Build()
    
    // Ejecutar
    rows, err := r.db.Query(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    // Mapear resultados
    tracks := []*entities.Track{}
    for rows.Next() {
        track := &entities.Track{}
        err := rows.Scan(
            &track.ID, &track.Title, &track.AlbumID, &track.ArtistID,
            &track.ArtistName, &track.AlbumTitle,
        )
        if err != nil {
            return nil, err
        }
        tracks = append(tracks, track)
    }
    
    return tracks, nil
}
```

```go
// ✅ application/usecases/get_tracks.go
package usecases

import (
    "context"
    "sonantica/library/domain/repositories"
    "sonantica/infrastructure/cache"
)

type GetTracksUseCase struct {
    trackRepo repositories.TrackRepository
    cache     cache.Cache
}

func (uc *GetTracksUseCase) Execute(ctx context.Context, opts repositories.QueryOptions) ([]*entities.Track, error) {
    // 1. Try cache
    cacheKey := fmt.Sprintf("tracks:%d:%d:%s:%s", opts.Offset, opts.Limit, opts.SortBy, opts.Direction)
    
    var tracks []*entities.Track
    if err := uc.cache.Get(ctx, cacheKey, &tracks); err == nil {
        return tracks, nil
    }
    
    // 2. Query database
    tracks, err := uc.trackRepo.FindAll(ctx, opts)
    if err != nil {
        return nil, err
    }
    
    // 3. Cache result
    go func() {
        uc.cache.Set(context.Background(), cacheKey, tracks, 5*time.Minute)
    }()
    
    return tracks, nil
}
```

```go
// ✅ presentation/http/handlers/track_handler.go
package handlers

import (
    "net/http"
    "sonantica/infrastructure/utils"
)

type TrackHandler struct {
    getTracksUseCase *usecases.GetTracksUseCase
}

func (h *TrackHandler) GetTracks(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // ✅ Reutilizar utilidades
    pagination := utils.ParsePaginationParams(r, 50)
    sorting := utils.ParseSortingParams(r, "created_at")
    
    // ✅ Delegar a use case
    tracks, err := h.getTracksUseCase.Execute(ctx, repositories.QueryOptions{
        Limit:     pagination.Limit,
        Offset:    pagination.Offset,
        SortBy:    sorting.SortBy,
        Direction: sorting.Direction,
    })
    
    if err != nil {
        middleware.RespondError(w, http.StatusInternalServerError, "Failed to get tracks")
        return
    }
    
    middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
        "tracks": tracks,
        "limit":  pagination.Limit,
        "offset": pagination.Offset,
    })
}
```

### 📊 Comparación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Código duplicado** | 3 handlers × 50 líneas | 1 utilidad reutilizable |
| **Queries SQL** | Embebidas en handlers | Centralizadas en repositorios |
| **Testabilidad** | Difícil | Fácil (query builder testeable) |
| **Mantenibilidad** | Cambios en 3 lugares | Cambio en 1 lugar |
| **Violaciones DRY** | Múltiples | Ninguna |

---

## 📘 Ejemplo 3: Python Worker Monolítico

### ❌ ANTES: Archivo Monolítico (worker.py - 799 líneas)

```python
# ❌ PROBLEMA: Todo en un archivo
# - Configuración
# - Modelos ORM
# - Repositorio
# - Análisis de audio
# - Tareas Celery
# - Logging

# Configuración mezclada
REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
POSTGRES_URL = os.environ.get("POSTGRES_URL")

# Logging inline
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AudioWorker")

# Modelos ORM (líneas 88-206)
class Artist(Base):
    __tablename__ = 'artists'
    id = Column(postgresql.UUID(as_uuid=True), primary_key=True)
    # ...

class Album(Base):
    # ...

class Track(Base):
    # ...

# Repositorio (líneas 208-315)
class AudioRepository:
    def __init__(self, db_url):
        # ...
    
    def save_track(self, meta: dict, file_path_rel: str):
        # ❌ Función de 45 líneas
        session = self.SessionLocal()
        try:
            artist_id = self.get_or_create_artist(session, meta["artist"])
            album_id = self.get_or_create_album(session, meta["album"], artist_id)
            # ... 40 líneas más
        except Exception as e:
            session.rollback()
        finally:
            session.close()
    
    def update_event_aggregation(self, event_data: dict):
        # ❌ Función de 200 líneas con lógica compleja
        session = self.SessionLocal()
        try:
            # ... 200 líneas de upserts
        except Exception as e:
            session.rollback()
        finally:
            session.close()

# Análisis de audio (líneas 595-667)
def analyze_audio(file_path):
    # ❌ Función de 70 líneas
    # ...

# Tareas Celery (líneas 671-776)
@app.task(name="sonantica.analyze_audio")
def task_analyze_audio(self, job_data):
    # ...

@app.task(name="sonantica.process_analytics")
def task_process_analytics(self, event_data):
    # ...
```

### ✅ DESPUÉS: Modularizado

#### 1. Configuración

```python
# ✅ src/config/settings.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Configuración de la aplicación validada con Pydantic"""
    
    # Database
    postgres_url: str
    postgres_pool_size: int = 10
    
    # Redis
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    
    # Media
    media_path: str = "/media"
    
    # Logging
    log_level: str = "INFO"
    log_dir: str = "/var/log/sonantica"
    
    # Celery
    celery_broker_url: str
    celery_result_backend: str
    celery_task_serializer: str = "json"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Singleton
_settings: Optional[Settings] = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
```

```python
# ✅ src/config/celery_config.py
from celery import Celery
from src.config.settings import get_settings

def create_celery_app() -> Celery:
    """Factory para crear aplicación Celery"""
    settings = get_settings()
    
    app = Celery(
        'sonantica',
        broker=settings.celery_broker_url,
        backend=settings.celery_result_backend
    )
    
    app.conf.update(
        task_serializer=settings.celery_task_serializer,
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        worker_prefetch_multiplier=1,
        task_acks_late=True
    )
    
    return app

celery_app = create_celery_app()
```

#### 2. Logging Estructurado

```python
# ✅ src/infrastructure/logging/json_formatter.py
import logging
import json
from datetime import datetime
from typing import Optional
from contextvars import ContextVar

# Context variable para trace ID
trace_id_var: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)

class JSONFormatter(logging.Formatter):
    """Formateador JSON estructurado para logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "trace_id": trace_id_var.get()
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        # Agregar campos extra
        if hasattr(record, 'extra'):
            log_record.update(record.extra)
        
        return json.dumps(log_record)
```

```python
# ✅ src/infrastructure/logging/logger_config.py
import logging
from pathlib import Path
from src.config.settings import get_settings
from src.infrastructure.logging.json_formatter import JSONFormatter

def setup_logging() -> logging.Logger:
    """Configura logging estructurado"""
    settings = get_settings()
    
    # Crear directorio de logs
    log_dir = Path(settings.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Handler de archivo
    file_handler = logging.FileHandler(log_dir / "worker.log")
    file_handler.setFormatter(JSONFormatter())
    
    # Handler de consola
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    
    # Configurar logger raíz
    logger = logging.getLogger("sonantica")
    logger.setLevel(getattr(logging, settings.log_level))
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Logger global
logger = setup_logging()
```

#### 3. Modelos Separados

```python
# ✅ src/infrastructure/database/models/base_model.py
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TimestampMixin:
    """Mixin para campos de timestamp"""
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

```python
# ✅ src/infrastructure/database/models/track_model.py
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from src.infrastructure.database.models.base_model import Base, TimestampMixin

class Track(Base, TimestampMixin):
    """Modelo ORM para tracks"""
    __tablename__ = 'tracks'
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String(255), nullable=False)
    album_id = Column(UUID(as_uuid=True), ForeignKey('albums.id', ondelete='SET NULL'))
    artist_id = Column(UUID(as_uuid=True), ForeignKey('artists.id', ondelete='SET NULL'))
    file_path = Column(String, unique=True, nullable=False)
    
    # Audio Info
    duration_seconds = Column(Float, default=0.0)
    format = Column(String(20))
    bitrate = Column(Integer)
    sample_rate = Column(Integer)
    channels = Column(Integer)
    
    # Metadata
    track_number = Column(Integer)
    disc_number = Column(Integer, default=1)
    genre = Column(String(100))
    year = Column(Integer)
    
    def __repr__(self):
        return f"<Track(id={self.id}, title='{self.title}')>"
```

#### 4. Repositorio Refactorizado

```python
# ✅ src/domain/repositories/base_repository.py
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List
from sqlalchemy.orm import Session

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """Repositorio base con operaciones CRUD"""
    
    def __init__(self, session: Session, model_class: type):
        self.session = session
        self.model_class = model_class
    
    def get_by_id(self, id: str) -> Optional[T]:
        """Obtiene entidad por ID"""
        return self.session.query(self.model_class).filter_by(id=id).first()
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """Obtiene todas las entidades con paginación"""
        return self.session.query(self.model_class).limit(limit).offset(offset).all()
    
    def save(self, entity: T) -> T:
        """Guarda o actualiza entidad"""
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity
    
    def delete(self, entity: T) -> None:
        """Elimina entidad"""
        self.session.delete(entity)
        self.session.commit()
```

```python
# ✅ src/infrastructure/database/repositories/track_repository_impl.py
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.domain.repositories.base_repository import BaseRepository
from src.infrastructure.database.models.track_model import Track
from src.infrastructure.database.models.artist_model import Artist
from src.infrastructure.database.models.album_model import Album
from src.infrastructure.logging.logger_config import logger

class TrackRepository(BaseRepository[Track]):
    """Repositorio para tracks"""
    
    def __init__(self, session: Session):
        super().__init__(session, Track)
    
    def get_or_create_artist(self, name: str) -> str:
        """Obtiene o crea un artista"""
        name = name.strip().replace("\x00", "")
        
        artist = self.session.query(Artist).filter(Artist.name == name).first()
        if artist:
            return artist.id
        
        try:
            new_artist = Artist(name=name)
            self.session.add(new_artist)
            self.session.commit()
            logger.info(f"Created artist: {name}", extra={"artist_id": new_artist.id})
            return new_artist.id
        except IntegrityError:
            self.session.rollback()
            artist = self.session.query(Artist).filter(Artist.name == name).first()
            return artist.id if artist else None
    
    def get_or_create_album(
        self,
        title: str,
        artist_id: str,
        cover_path: Optional[str] = None,
        year: Optional[int] = None
    ) -> str:
        """Obtiene o crea un álbum"""
        title = title.strip().replace("\x00", "")
        
        album = self.session.query(Album).filter(
            Album.title == title,
            Album.artist_id == artist_id
        ).first()
        
        release_date = f"{year}-01-01" if year and year > 0 else None
        
        if album:
            # Actualizar si hay nuevos datos
            updated = False
            if not album.cover_art and cover_path:
                album.cover_art = cover_path
                updated = True
            if not album.release_date and release_date:
                album.release_date = release_date
                updated = True
            
            if updated:
                self.session.commit()
            
            return album.id
        
        try:
            new_album = Album(
                title=title,
                artist_id=artist_id,
                cover_art=cover_path,
                release_date=release_date
            )
            self.session.add(new_album)
            self.session.commit()
            logger.info(f"Created album: {title}", extra={"album_id": new_album.id})
            return new_album.id
        except IntegrityError:
            self.session.rollback()
            album = self.session.query(Album).filter(
                Album.title == title,
                Album.artist_id == artist_id
            ).first()
            return album.id if album else None
    
    def save_track_from_metadata(self, metadata: dict, file_path: str) -> Optional[Track]:
        """Guarda o actualiza track desde metadata"""
        try:
            artist_id = self.get_or_create_artist(metadata["artist"])
            album_id = self.get_or_create_album(
                metadata["album"],
                artist_id,
                metadata.get("cover_path"),
                metadata.get("year", 0)
            )
            
            track = self.session.query(Track).filter(Track.file_path == file_path).first()
            
            if track:
                # Actualizar track existente
                track.title = metadata["title"]
                track.artist_id = artist_id
                track.album_id = album_id
                track.duration_seconds = metadata["duration"]
                track.track_number = metadata["track_number"]
                track.genre = metadata["genre"]
                track.year = metadata.get("year", 0)
                track.format = metadata["format"]
                track.bitrate = metadata["bitrate"]
                
                logger.info(f"Updated track: {metadata['title']}", extra={"track_id": track.id})
            else:
                # Crear nuevo track
                track = Track(
                    title=metadata["title"],
                    file_path=file_path,
                    artist_id=artist_id,
                    album_id=album_id,
                    duration_seconds=metadata["duration"],
                    format=metadata["format"],
                    bitrate=metadata["bitrate"],
                    sample_rate=metadata["sample_rate"],
                    channels=metadata["channels"],
                    track_number=metadata["track_number"],
                    genre=metadata["genre"],
                    year=metadata.get("year", 0)
                )
                self.session.add(track)
                logger.info(f"Created track: {metadata['title']}")
            
            self.session.commit()
            return track
            
        except Exception as e:
            self.session.rollback()
            logger.error(f"Failed to save track: {e}", exc_info=True)
            raise
```

#### 5. Servicio de Análisis de Audio

```python
# ✅ src/domain/services/audio_analyzer.py
from pathlib import Path
from typing import Optional, Dict
import mutagen
from src.infrastructure.logging.logger_config import logger
from src.utils.metadata_parser import MetadataParser
from src.utils.cover_art_extractor import CoverArtExtractor

class AudioAnalyzer:
    """Servicio para análisis de archivos de audio"""
    
    def __init__(self):
        self.metadata_parser = MetadataParser()
        self.cover_extractor = CoverArtExtractor()
    
    def analyze(self, file_path: str) -> Optional[Dict]:
        """
        Analiza un archivo de audio y extrae metadata
        
        Args:
            file_path: Ruta al archivo de audio
            
        Returns:
            Diccionario con metadata o None si falla
        """
        path = Path(file_path)
        
        if not path.exists():
            logger.error(f"File not found: {file_path}")
            return None
        
        try:
            audio = mutagen.File(file_path)
            if not audio:
                logger.warning(f"Could not open file with Mutagen: {file_path}")
                return None
            
            # Metadata base
            metadata = {
                "duration": 0,
                "bitrate": 0,
                "sample_rate": 0,
                "channels": 0,
                "format": path.suffix.lower().lstrip('.'),
                "title": path.stem,
                "artist": "Unknown Artist",
                "album": "Unknown Album",
                "track_number": 0,
                "genre": "Unknown",
                "cover_path": None
            }
            
            # Extraer información técnica
            if audio.info:
                metadata["duration"] = getattr(audio.info, "length", 0)
                metadata["bitrate"] = getattr(audio.info, "bitrate", 0)
                metadata["sample_rate"] = getattr(audio.info, "sample_rate", 0)
                metadata["channels"] = getattr(audio.info, "channels", 2)
            
            # Parsear tags
            if audio.tags:
                metadata.update(self.metadata_parser.parse(audio.tags))
            
            # Extraer cover art
            metadata["cover_path"] = self.cover_extractor.extract(
                audio,
                str(file_path),
                metadata["album"],
                metadata["artist"]
            )
            
            logger.debug(f"Analyzed audio: {metadata['title']}")
            return metadata
            
        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}", exc_info=True)
            return None
```

```python
# ✅ src/utils/metadata_parser.py
from typing import Dict, Any

class MetadataParser:
    """Parser de metadata de tags de audio"""
    
    def parse(self, tags: Any) -> Dict:
        """Parsea tags de audio a diccionario normalizado"""
        metadata = {}
        
        # Título
        metadata["title"] = str(tags.get("title", ["Unknown"])[0])
        
        # Artista
        metadata["artist"] = str(tags.get("artist", ["Unknown Artist"])[0])
        
        # Álbum
        metadata["album"] = str(tags.get("album", ["Unknown Album"])[0])
        
        # Género
        metadata["genre"] = str(tags.get("genre", ["Unknown"])[0])
        
        # Año
        year_raw = str(tags.get("date", tags.get("year", ["0"]))[0])
        try:
            metadata["year"] = int(year_raw.split('-')[0])
        except (ValueError, IndexError):
            metadata["year"] = 0
        
        # Número de track
        track_num_raw = str(tags.get("tracknumber", ["0"])[0])
        try:
            metadata["track_number"] = int(track_num_raw.split('/')[0])
        except (ValueError, IndexError):
            metadata["track_number"] = 0
        
        return metadata
```

#### 6. Tareas Celery Refactorizadas

```python
# ✅ src/infrastructure/tasks/audio_tasks.py
from src.config.celery_config import celery_app
from src.application.usecases.analyze_audio import AnalyzeAudioUseCase
from src.infrastructure.database.session import get_session
from src.infrastructure.logging.logger_config import logger
from src.infrastructure.logging.json_formatter import trace_id_var

@celery_app.task(name="sonantica.analyze_audio", bind=True, max_retries=3)
def task_analyze_audio(self, job_data: dict):
    """
    Tarea Celery para analizar archivo de audio
    
    Args:
        job_data: Diccionario con file_path, root, trace_id
    """
    trace_id = job_data.get("trace_id", "N/A")
    trace_id_var.set(trace_id)
    
    rel_path = job_data.get("file_path")
    logger.info(f"Analyzing audio: {rel_path}")
    
    try:
        # Crear use case con dependencias
        session = get_session()
        use_case = AnalyzeAudioUseCase(session)
        
        # Ejecutar
        result = use_case.execute(job_data)
        
        logger.info(f"Audio analysis completed: {result['track']}")
        return {"status": "success", "track": result["track"]}
        
    except Exception as e:
        logger.error(f"Audio analysis failed: {e}", exc_info=True)
        # Retry con backoff exponencial
        raise self.retry(exc=e, countdown=10 * (2 ** self.request.retries))
```

```python
# ✅ src/application/usecases/analyze_audio.py
import os
from pathlib import Path
from sqlalchemy.orm import Session

from src.domain.services.audio_analyzer import AudioAnalyzer
from src.infrastructure.database.repositories.track_repository_impl import TrackRepository
from src.config.settings import get_settings

class AnalyzeAudioUseCase:
    """Caso de uso para analizar archivo de audio"""
    
    def __init__(self, session: Session):
        self.session = session
        self.audio_analyzer = AudioAnalyzer()
        self.track_repository = TrackRepository(session)
        self.settings = get_settings()
    
    def execute(self, job_data: dict) -> dict:
        """
        Ejecuta el análisis de audio
        
        Args:
            job_data: Datos del job (file_path, root)
            
        Returns:
            Resultado del análisis
        """
        rel_path = job_data.get("file_path")
        root = job_data.get("root", self.settings.media_path)
        full_path = os.path.join(root, rel_path)
        
        # Analizar audio
        metadata = self.audio_analyzer.analyze(full_path)
        if not metadata:
            raise ValueError(f"Failed to analyze audio: {rel_path}")
        
        # Guardar en base de datos
        track = self.track_repository.save_track_from_metadata(metadata, rel_path)
        if not track:
            raise ValueError(f"Failed to save track: {rel_path}")
        
        return {
            "track": metadata["title"],
            "artist": metadata["artist"],
            "album": metadata["album"]
        }
```

### 📊 Comparación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Archivos** | 1 (799 líneas) | 20+ archivos modulares |
| **Responsabilidades por archivo** | Múltiples | Una (SRP) |
| **Testabilidad** | Muy difícil | Fácil (cada módulo) |
| **Reutilización** | Imposible | Alta |
| **Mantenibilidad** | Muy baja | Alta |
| **Complejidad ciclomática** | >50 | <10 por función |
| **Onboarding** | Días | Horas |

---

## 🎯 Resumen de Beneficios

### Antes de Refactorizar
- ❌ Archivos de 700+ líneas
- ❌ Funciones de 100+ líneas
- ❌ Múltiples responsabilidades por clase
- ❌ Código duplicado
- ❌ Difícil de testear
- ❌ Difícil de mantener
- ❌ Difícil de extender

### Después de Refactorizar
- ✅ Archivos de <300 líneas
- ✅ Funciones de <50 líneas
- ✅ Una responsabilidad por clase (SRP)
- ✅ Código reutilizable (DRY)
- ✅ Fácil de testear (interfaces)
- ✅ Fácil de mantener (Clean Architecture)
- ✅ Fácil de extender (OCP)

---

## 📚 Próximos Pasos

1. Revisar el plan completo en `CLEAN-ARCHITECTURE-REFACTORING-PLAN.md`
2. Comenzar con Fase 1 (Analytics Service)
3. Crear tests antes de refactorizar
4. Refactorizar incrementalmente
5. Mantener funcionalidad (green refactoring)
6. Documentar decisiones (ADRs)

---

**Última actualización:** 2026-01-08  
**Responsable:** Equipo Sonántica
