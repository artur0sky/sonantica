# Plan de Migración: Arquitectura "Server-First" (Opción 2)

Este documento define la estrategia para transformar Sonántica de una aplicación híbrida local/remota a una arquitectura **Cliente-Servidor Pura** (estilo Spotify/Jellyfin), respetando los principios de identidad y calidad de ingeniería.

## 🎯 Objetivos Principales

1.  **Centralización:** El `api-server` se convierte en la única fuente de verdad.
2.  **Simplificación:** Los clientes (Web/Mobile) se vuelven ligeros ("Thin Clients").
3.  **Consistencia:** Web y Mobile comparten exactamente la misma lógica de negocio a través de `media-library`.
4.  **Calidad:** Arquitectura DRY, SOLID y ATOMIC.

---

## 🏗️ Fase 1: Abstracción y Contratos (Shared Core)

*Principio: Dependency Inversion (SOLID)*

### 1.1 Estandarización de Contratos (`packages/media-library`)
Definir interfaz estricta para desacoplar la UI de la fuente de datos.

- **Archivo:** `src/contracts/ILibraryProvider.ts`
- **Responsabilidad:** Definir métodos (`getTracks`, `search`, `getStreamUrl`, `getStats`).
- **Acción:** Refactorizar `RemoteLibraryAdapter` para implementar estrictamente esta interfaz.

### 1.2 Centralización de Configuración (`packages/shared`)
Evitar duplicación de lógica de validación y constantes.

- **Archivo:** `src/config/server-config.ts`
- **Contenido:** Validadores de URL, constantes de API Endpoints, tipos de estado de conexión.

---

## 💻 Fase 2: Transformación del Cliente Web (`apps/web`)

*Principio: Single Responsibility (SOLID) & Atomic Design*

### 2.1 Limpieza de "Local Mode"
Eliminar código muerto y complejidad innecesaria.

- **Acción:** Remover `FolderManager` (versión navegador).
- **Acción:** Ocultar/Eliminar UI de "Add Folder" local.
- **Acción:** Eliminar `FileSystemAccess` API calls.

### 2.2 Implementación de "Setup Flow"
Una experiencia de usuario inicial guiada ("Wise Craftsman").

- **Componente:** `ServerConnectPage` (Nuevo router entry).
- **Flujo:**
    1.  Splash Screen.
    2.  Check `localStorage`.
    3.  Si falta URL -> Redirect `/setup`.
    4.  Input URL -> Validar -> Guardar -> Redirect `/library`.

### 2.3 Refactor de Store (`useLibraryStore`)
Hacer el store agnóstico del origen de datos.

- **Acción:** El store debe inicializarse inyectando `RemoteLibraryAdapter`.
- **DRY:** No tener lógica condicional `if (local) ... else (remote)`. El store solo llama a `adapter.getTracks()`.

---

## 📱 Fase 3: Cliente Móvil "First-Class" (`apps/mobile`)

*Principio: Don't Repeat Yourself (DRY)*

### 3.1 Setup Inicial
- **Acción:** Replicar el flujo de `/setup` de la web usando componentes nativos.
- **Persistencia:** Usar almacenamiento seguro para la URL del servidor.

### 3.2 Conexión con Núcleo
- **Acción:** Instanciar `RemoteLibraryAdapter` en el contexto de la app móvil.
- **Acción:** Conectar UI de listas (Tracks/Albums) al adaptador.

---

## ⚙️ Fase 4: Servidor y Docker (`packages/api-server`)

### 4.1 Robustez
- **Acción:** Asegurar que el escaneo maneje correctamente permisos de Docker.
- **Acción:** Implementar endpoints de administración para que el cliente pueda pedir "Rescan".

---

## 📋 Lista de Tareas Inmediatas (Next Steps)

1.  [ ] **Refactor `media-library`**: Crear `ILibraryProvider` y ajustar Adapter.
2.  [ ] **Web Cleanup**: Eliminar gestión de carpetas locales.
3.  [ ] **Web Setup**: Crear página `/setup`.
4.  [ ] **Web Store**: Conectar store exclusivamente al adaptador remoto.

## ⚠️ Notas de Identidad (Identity.md)
- **Mensajes de Error:** Deben ser calmados y explicativos ("Unable to reach your library" vs "Connection Error").
- **UI:** Mantener el minimalismo. La configuración del servidor debe sentirse técnica pero accesible.
