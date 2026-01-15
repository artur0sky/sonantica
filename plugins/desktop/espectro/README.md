# espectro

> "Plugins must be able to work together."

The foundational audio processing graph system that enables plugin interoperability in Sonántica. This is the core infrastructure that allows Compositor and Orquestador to work together seamlessly.

## 🧠 Philosophy

> "The graph is the conductor, nodes are the musicians."

The Audio Graph acts as the **orchestrator** of all audio processing in Sonántica's desktop plugins. It does not care whether a node comes from Compositor or Orquestador—it only cares about connections, order, and signal flow. It guarantees that audio flows correctly, regardless of plugin boundaries.

## 📦 Capabilities

- **Plugin-Agnostic**: Nodes from any plugin can be added and connected.
- **Topological Sorting**: Automatic execution order optimization using Kahn's algorithm.
- **Cycle Detection**: Prevents infinite loops in the audio graph.
- **Lock-Free Processing**: Real-time audio processing without blocking.
- **Type-Safe Connections**: Rust's type system ensures correct node connections.

## 🛡️ Security & Reliability

The graph engine is hardened to ensure stable, safe audio processing:
- **Cycle Prevention**: Graph validation prevents infinite loops before they occur.
- **Node Isolation**: Node crashes don't propagate to the entire graph.
- **Memory Safety**: Rust's ownership system prevents use-after-free and memory leaks.
- **Parameter Validation**: All parameter changes are validated before application.

## ⚡ Performance Specifications

The graph engine is engineered for **real-time audio processing**.

### Zero-Copy Processing
**Philosophy:** Audio data should flow, not be copied.

```rust
// Nodes can modify buffers in-place
fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
    let mut output = input.clone(); // Only when necessary
    // Process in-place...
    Ok(output)
}
```

**Optimizations:**
- **Topological Sorting**: Nodes execute in optimal order (computed once).
- **Cached Execution Order**: Recomputed only when graph structure changes.
- **Buffer Reuse**: Intermediate buffers cached per processing cycle.

**Impact:**
- Minimal latency overhead (<1ms for typical graphs).
- Predictable performance regardless of graph complexity.
- No audio dropouts during parameter changes.

> "The signal waits for no one."

## 🛠️ Usage

```rust
use audio_graph::{AudioGraph, AudioBuffer, Connection};

// Create graph
let mut graph = AudioGraph::new();

// Add nodes (from any plugin)
graph.add_node(Box::new(MyNode::new("node1")))?;
graph.add_node(Box::new(AnotherNode::new("node2")))?;

// Connect them
graph.connect(Connection::simple("node1".into(), "node2".into()))?;

// Set parameters
graph.set_parameter("node1", "gain", 6.0)?;

// Process audio
let output = graph.process(input_buffer)?;
```

## 🏗️ Architecture

- **Clean Architecture**: Zero dependencies except standard Rust crates.
- **Trait-Based**: `AudioNode` trait enables any plugin to create nodes.
- **Graph Theory**: Directed Acyclic Graph (DAG) with topological sorting.
- **Error Handling**: Comprehensive error types with `thiserror`.

## 📐 Core Types

### AudioBuffer
Interleaved audio samples with metadata:
```rust
pub struct AudioBuffer {
    pub channels: usize,      // Number of channels
    pub sample_rate: u32,     // Sample rate in Hz
    pub samples: Vec<f32>,    // Interleaved samples
}
```

### AudioNode Trait
The contract all nodes must implement:
```rust
pub trait AudioNode: Send + Sync {
    fn id(&self) -> &str;
    fn metadata(&self) -> NodeMetadata;
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer>;
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()>;
    fn get_parameter(&self, name: &str) -> Option<f32>;
}
```

### Connection
Links between nodes:
```rust
pub struct Connection {
    pub from_node: String,
    pub from_output: usize,
    pub to_node: String,
    pub to_input: usize,
}
```

## ⚖️ Responsibility

This package handles:
- Graph structure management (add/remove nodes, connections).
- Execution order computation (topological sorting).
- Cycle detection and prevention.
- Audio routing and mixing (multiple inputs to one node).
- Parameter management across all nodes.

> "Order emerges from connections."

## 🔬 Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_cycle_detection
```

## 📊 Performance Metrics

- **Graph Construction**: O(N) where N = number of nodes
- **Topological Sort**: O(N + E) where E = number of edges
- **Cycle Detection**: O(N + E) using DFS
- **Parameter Update**: O(1) direct node access
- **Audio Processing**: O(N) single pass through sorted nodes

## 📄 License

Licensed under the **Apache License, Version 2.0**.

---

Made with ❤ and **Progressive Metal**.
