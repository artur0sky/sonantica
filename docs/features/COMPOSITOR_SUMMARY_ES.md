# Sonántica Compositor & Orquestador — Implementation Summary

## 📋 Overview

He creado una arquitectura completa de plugins para Sonántica que permite que **Compositor** y **Orquestador** trabajen juntos de manera modular e interoperable.

## 🎯 Conceptos Clave

### 1. **Plugin Interoperability (Interoperabilidad de Plugins)**
Los plugins NO son módulos aislados. Funcionan a través de un **Audio Graph** (grafo de audio) donde:
- Cada plugin es un **nodo** en el grafo
- Los nodos se **conectan** para formar cadenas de procesamiento
- El audio fluye a través del grafo en tiempo real
- Los plugins pueden **comunicarse** y **compartir estado**

### 2. **Arquitectura "Eevee"**
Como Eevee en Pokémon, Sonántica evoluciona según las necesidades del usuario:
- **Base (Eevee)**: Reproductor de música puro (siempre activo)
- **Compositor (Flareon)**: Funciones DAW (edición, mezcla, efectos)
- **Orquestador (Vaporeon)**: Enrutamiento multi-canal
- **Futuras evoluciones**: Visualizadores, masterización AI, etc.

### 3. **Desktop vs Server Plugins**
- **Desktop Plugins**: Rust nativo, baja latencia, acceso directo a hardware
- **Server Plugins**: Microservicios (Python/Go), aceleración GPU, procesamiento pesado
  - **En desktop**: Server plugins deshabilitados por defecto (ej: Demucs)
  - **Razón**: No todos los usuarios tienen infraestructura de servidor

## 📐 Arquitectura Técnica

### Audio Graph System
```
Input Device → EQ Node → Compressor Node → Channel Strip → Router → Output Devices
                                                                    ↓
                                                                 Recorder
```

Cada nodo implementa el trait `AudioNode`:
```rust
pub trait AudioNode: Send + Sync {
    fn id(&self) -> &str;
    fn metadata(&self) -> NodeMetadata;
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer>;
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()>;
    fn get_parameter(&self, name: &str) -> Option<f32>;
}
```

### Compositor Nodes (Paquete `compositor`)
- **EQ Node**: Ecualizador paramétrico de 10 bandas
- **Compressor Node**: Procesamiento de dinámica
- **Reverb Node**: Reverberación por convolución
- **Clip Player Node**: Reproducción de clips de audio
- **Recorder Node**: Grabación multi-pista

### Orquestador Nodes (Paquete `orquestador`)
- **Channel Strip Node**: Volumen, paneo, mute, solo
- **Router Node**: Matriz de enrutamiento N×M
- **Mixer Node**: Mezcla de múltiples canales
- **Meter Node**: Medición peak/RMS

## 🔌 Ejemplos de Interoperabilidad

### Ejemplo 1: Grabación con Efectos
```rust
// Usuario quiere grabar micrófono con EQ y compresión
Microphone → EQ (Compositor) → Compressor (Compositor) → Recorder (Compositor)
```

### Ejemplo 2: Multi-output con Efectos Selectivos
```rust
// Música a parlantes con EQ, a audífonos sin EQ
Player → ┬→ EQ (Compositor) → Channel (Orquestador) → Speakers
         └→ Channel (Orquestador) → Headphones
```

### Ejemplo 3: Demucs + Routing (Server + Desktop)
```rust
// Separar stems y enrutar cada uno a salidas diferentes
Player → Demucs (Server Plugin) → ┬→ Vocals Channel → Output 1
                                   ├→ Drums Channel → Output 2
                                   ├→ Bass Channel → Output 3
                                   └→ Other Channel → Output 4
```

## 📦 Estructura de Paquetes

```
packages/
├── espectro/          # Sistema de grafo de audio (core)
│   ├── src/
│   │   ├── lib.rs        # AudioNode trait, AudioGraph
│   │   ├── buffer.rs     # AudioBuffer
│   │   └── connection.rs # Connection management
│   └── Cargo.toml
│
├── compositor/           # Plugin DAW
│   ├── src/
│   │   ├── core/         # Timeline, clip, transport
│   │   ├── effects/      # EQ, compressor, reverb
│   │   ├── desktop/      # Native DSP
│   │   └── server/       # Demucs integration
│   └── Cargo.toml
│
└── orquestador/          # Plugin de enrutamiento
    ├── src/
    │   ├── core/         # Router, channel, bus
    │   ├── desktop/      # Multi-device, ASIO
    │   └── server/       # Network streaming
    └── Cargo.toml
```

## 🚀 Fases de Implementación

### Fase 1: Audio Graph Core (Semana 1-2)
- [ ] Crear paquete `espectro` con trait `AudioNode`
- [ ] Implementar `AudioGraph` con ordenamiento topológico
- [ ] Detección de ciclos
- [ ] Tests unitarios

### Fase 2: Compositor Nodes (Semana 3-4)
- [ ] EQ paramétrico (10 bandas)
- [ ] Compresor
- [ ] Grabador
- [ ] Reproductor de clips

### Fase 3: Orquestador Nodes (Semana 5-6)
- [ ] Channel strip
- [ ] Router (matriz N×M)
- [ ] Medidores (peak/RMS)
- [ ] Multi-output device

### Fase 4: Integración Tauri (Semana 7)
- [ ] Comandos Tauri para grafo
- [ ] Serialización de estado
- [ ] Actualizaciones de parámetros en tiempo real

### Fase 5: UI (Semana 8-9)
- [ ] Editor visual de grafo (ReactFlow)
- [ ] Paneles de parámetros de nodos
- [ ] Gestión de presets
- [ ] Drag-and-drop de nodos

## 🎨 UI/UX

### Renderizado Condicional
```typescript
// Solo mostrar UI de Compositor si el plugin está habilitado
{usePluginStore().isEnabled('compositor') && <CompositorWorkspace />}

// Mostrar estado deshabilitado con explicación
{!usePluginStore().isEnabled('compositor') && (
  <PluginDisabledBanner
    pluginName="Compositor"
    description="Habilita funciones DAW en Configuración > Plugins"
  />
)}
```

### Navegación
```
Menú Principal (Reproductor Base)
├── Biblioteca
├── Cola
├── Listas de reproducción
└── Configuración

Menú Principal (Con Compositor Habilitado)
├── Biblioteca
├── Cola
├── Listas de reproducción
├── 🎼 Compositor (NUEVO)
│   ├── Proyectos
│   ├── Editor
│   └── Efectos
└── Configuración

Menú Principal (Con Orquestador Habilitado)
├── Biblioteca
├── Cola
├── Listas de reproducción
├── 🎛️ Mezclador (NUEVO)
│   ├── Enrutamiento
│   ├── Canales
│   └── Buses
└── Configuración
```

## 🔒 Seguridad y Estabilidad

### Sandboxing de Plugins
- **Desktop Plugins**: Ejecutan en threads separados con panic handlers
- **Server Plugins**: Aislamiento de red, validación de API keys

### Límites de Recursos
```rust
pub struct PluginLimits {
    pub max_memory_mb: usize,      // 500MB por defecto
    pub max_cpu_percent: f32,      // 50% por defecto
    pub max_network_kbps: usize,   // 1000 kbps por defecto
}
```

### Recuperación de Crashes
- Los crashes de plugins NO deben crashear el reproductor principal
- Auto-deshabilitar plugins problemáticos
- Notificación al usuario con logs de error

## 📊 Métricas de Éxito

### Técnicas
- [ ] Plugins cargan en <500ms
- [ ] Crashes de plugins no afectan reproductor core
- [ ] Plugins desktop funcionan offline
- [ ] Plugins server degradan gracefully cuando servidor no disponible

### Experiencia de Usuario
- [ ] Usuarios pueden deshabilitar todos los plugins y usar reproductor puro
- [ ] Configuración de plugins es intuitiva
- [ ] Clara distinción entre plugins desktop/server
- [ ] Sin impacto de rendimiento cuando plugins deshabilitados

## 📚 Documentos Creados

1. **COMPOSITOR_ORQUESTADOR_ARCHITECTURE.md**: Arquitectura de plugins de alto nivel
2. **COMPOSITOR_RUST_IMPLEMENTATION.md**: Plan de implementación Rust detallado
3. **COMPOSITOR_PLAN.md**: Plan original actualizado con nueva arquitectura

## 🎯 Próximos Pasos

1. **Crear estructura de paquetes**:
   ```bash
   mkdir -p packages/espectro/src
   mkdir -p packages/compositor/src/{core,effects,desktop,server}
   mkdir -p packages/orquestador/src/{core,desktop,server}
   ```

2. **Implementar `espectro` core**:
   - Trait `AudioNode`
   - Struct `AudioGraph`
   - Topological sorting
   - Cycle detection

3. **Implementar nodos básicos**:
   - Gain node (simple)
   - Pan node (simple)
   - Mixer node (combina múltiples entradas)

4. **Integrar con Tauri**:
   - Comandos para agregar/remover nodos
   - Comandos para conectar/desconectar nodos
   - Comandos para establecer parámetros

5. **Crear UI básica**:
   - Editor visual de grafo (ReactFlow)
   - Panel de parámetros
   - Lista de plugins disponibles

---

**Versión**: 1.0  
**Última Actualización**: 2026-01-15  
**Estado**: Listo para Implementación  
**Propietario**: Equipo Core de Sonántica
