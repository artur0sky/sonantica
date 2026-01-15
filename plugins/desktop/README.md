# Sonántica Desktop Plugins

## 🎯 Overview

This directory contains the **desktop plugins** for Sonántica, implementing a modular audio processing architecture where plugins can work together seamlessly.

## 🏗️ Architecture

### The "Eevee Strategy"

Like Pokémon's Eevee evolves into different forms, Sonántica evolves based on installed plugins:

- **Base (Eevee)**: Pure music player (always active)
- **Compositor (Flareon)**: DAW features (audio editing, mixing, effects)
- **Orquestador (Vaporeon)**: Multi-channel routing and management
- **Future evolutions**: Visualizers, AI mastering, etc.

### Plugin Interoperability

**Key Principle**: Plugins are NOT isolated modules. They work together through a **unified audio graph** where:

- Each plugin provides **nodes** (audio processing units)
- Nodes can be **connected** to form processing chains
- Audio flows through the graph in real-time
- Plugins can **communicate** and **share state**

## 📦 Plugin Structure

```
plugins/desktop/
├── espectro/          # Core audio graph system
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── buffer.rs     # AudioBuffer
│   │   ├── node.rs       # AudioNode trait
│   │   ├── graph.rs      # AudioGraph (topological sort, cycle detection)
│   │   ├── connection.rs # Node connections
│   │   └── error.rs      # Error types
│   └── Cargo.toml
│
├── compositor/           # DAW plugin
│   ├── src/
│   │   ├── nodes/
│   │   │   ├── gain.rs       # Volume control
│   │   │   ├── eq.rs         # Parametric EQ (10 bands)
│   │   │   └── compressor.rs # Dynamic range compression
│   │   ├── core/         # Timeline, transport (future)
│   │   └── effects/      # Additional effects (future)
│   └── Cargo.toml
│
├── orquestador/          # Routing plugin
│   ├── src/
│   │   ├── nodes/
│   │   │   ├── pan.rs           # Stereo panning
│   │   │   ├── channel_strip.rs # Volume + Pan + Mute + Solo
│   │   │   └── mixer.rs         # Multi-input mixer
│   │   └── core/         # Routing matrix, buses (future)
│   └── Cargo.toml
│
└── examples/
    └── plugin_interop.rs # Demonstrates plugin interoperability
```

## 🔌 How Plugins Work Together

### Example 1: Recording with Effects

```rust
// User wants to record microphone with EQ and compression

Input Device (Microphone)
    ↓
EQ Node (Compositor)
    ↓
Compressor Node (Compositor)
    ↓
Recorder Node (Compositor)
```

### Example 2: Multi-output Routing

```rust
// Music to speakers with EQ, to headphones without EQ

Player
  ├→ EQ (Compositor) → Channel Strip (Orquestador) → Speakers
  └→ Channel Strip (Orquestador) → Headphones
```

### Example 3: Complex Mixing

```rust
// 3-channel mix with different processing

Channel 1: EQ + Pan Left    ┐
Channel 2: Comp + Pan Center├→ Mixer → Output
Channel 3: Gain + Pan Right ┘
```

## 🚀 Getting Started

### Building the Plugins

```bash
# Build all plugins
cd plugins/desktop
cargo build --release

# Run tests
cargo test

# Run the interoperability example
cargo run --example plugin_interop
```

### Using in Code

```rust
use audio_graph::{AudioGraph, Connection};
use compositor::{EqualizerNode, CompressorNode};
use orquestador::ChannelStripNode;

// Create graph
let mut graph = AudioGraph::new();

// Add nodes from different plugins
graph.add_node(Box::new(EqualizerNode::new("eq".into(), 10)))?;
graph.add_node(Box::new(CompressorNode::new("comp".into())))?;
graph.add_node(Box::new(ChannelStripNode::new("channel".into())))?;

// Connect them
graph.connect(Connection::simple("eq".into(), "comp".into()))?;
graph.connect(Connection::simple("comp".into(), "channel".into()))?;

// Configure parameters
graph.set_parameter("eq", "band_0_gain", 3.0)?;
graph.set_parameter("comp", "threshold", -15.0)?;
graph.set_parameter("channel", "gain", 2.0)?;

// Process audio
let output = graph.process(input_buffer)?;
```

## 🎨 Creating New Nodes

To create a new audio processing node:

1. **Implement the `AudioNode` trait**:

```rust
use audio_graph::{AudioNode, AudioBuffer, NodeMetadata, Result};

pub struct MyNode {
    id: String,
    // ... your parameters
}

impl AudioNode for MyNode {
    fn id(&self) -> &str { &self.id }
    
    fn metadata(&self) -> NodeMetadata {
        // Describe your node
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        // Process audio here
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        // Handle parameter changes
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        // Return parameter values
    }
}
```

2. **Add to your plugin's module**
3. **Export from `lib.rs`**
4. **Write tests**

## 📊 Plugin Categories

### Compositor Nodes

- **Gain**: Simple volume control
- **EQ**: Parametric equalizer (10 bands)
- **Compressor**: Dynamic range compression
- **Future**: Reverb, delay, chorus, limiter, etc.

### Orquestador Nodes

- **Pan**: Stereo panning (constant-power)
- **Channel Strip**: Volume + Pan + Mute + Solo
- **Mixer**: Multi-input mixing
- **Future**: Routing matrix, buses, sends, etc.

## 🔒 Design Principles

1. **Modularity**: Each node does one thing well
2. **Interoperability**: Nodes from different plugins work together
3. **Performance**: Lock-free audio processing
4. **Safety**: Rust's memory safety guarantees
5. **Testability**: Comprehensive unit tests

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run tests for specific plugin
cargo test -p espectro
cargo test -p compositor
cargo test -p orquestador

# Run with output
cargo test -- --nocapture
```

## 📈 Performance Considerations

- **Zero-copy where possible**: Nodes can modify buffers in-place
- **Topological sorting**: Graph execution order is optimized
- **Cycle detection**: Prevents infinite loops
- **Lock-free processing**: Audio thread never blocks

## 🛣️ Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Audio graph system
- [x] Basic Compositor nodes (Gain, EQ, Compressor)
- [x] Basic Orquestador nodes (Pan, Channel Strip, Mixer)
- [x] Plugin interoperability example

### Phase 2: Advanced Features (📋 Planned)
- [ ] Reverb, delay, chorus effects
- [ ] Routing matrix (N×M)
- [ ] Buses and sends
- [ ] Real-time metering

### Phase 3: DAW Features (📋 Planned)
- [ ] Timeline and transport controls
- [ ] Multi-track recording
- [ ] Clip management
- [ ] Export/render engine

### Phase 4: Integration (📋 Planned)
- [ ] Tauri commands for graph management
- [ ] UI for visual graph editor
- [ ] Preset management
- [ ] Plugin marketplace

## 🤝 Contributing

When adding new nodes:

1. Follow the existing code style
2. Write comprehensive tests
3. Document all public APIs
4. Add examples if introducing new concepts
5. Ensure nodes work with existing plugins

## 📚 Documentation

- **Architecture**: See `/docs/features/COMPOSITOR_ORQUESTADOR_ARCHITECTURE.md`
- **Implementation**: See `/docs/features/COMPOSITOR_RUST_IMPLEMENTATION.md`
- **Summary (ES)**: See `/docs/features/COMPOSITOR_SUMMARY_ES.md`

## 🌟 Philosophy

> "Respect the intention of the sound and the freedom of the listener."

These plugins embody Sonántica's core values:
- **User Autonomy**: Users choose which plugins to enable
- **Technical Transparency**: Clear, understandable audio processing
- **Intentional Minimalism**: Each node has a clear purpose
- **Shared Knowledge**: Open-source, well-documented code

---

**Version**: 0.1.0  
**Last Updated**: 2026-01-15  
**Status**: Foundation Complete  
**Maintainer**: Sonántica Core Team
