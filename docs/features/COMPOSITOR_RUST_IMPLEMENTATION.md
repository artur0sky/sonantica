# Compositor & Orquestador — Rust Implementation Plan
## Plugin Interoperability & Audio Graph Architecture

> **Critical Principle**: Plugins must be able to work together seamlessly through a unified audio graph.

---

## 🎯 Core Concept: Audio Graph System

Instead of isolated plugins, we implement a **directed audio graph** where:
- Each plugin is a **node** in the graph
- Nodes can be **connected** to form processing chains
- Audio flows through the graph in real-time
- Plugins can **communicate** and **share state**

### Example: Compositor + Orquestador Working Together
```
Input Device (Microphone)
    ↓
Compositor Node (Noise Reduction)
    ↓
Compositor Node (EQ)
    ↓
Orquestador Node (Channel Strip)
    ↓
Orquestador Node (Routing Matrix)
    ↓ ↓ ↓
Output 1  Output 2  Output 3
(Speakers) (Headphones) (Recording)
```

---

## 🏗️ Rust Architecture

### 1. Audio Graph Core

```rust
// packages/espectro/src/lib.rs

use std::sync::Arc;
use parking_lot::RwLock;
use anyhow::Result;

/// Audio buffer format (interleaved or planar)
pub struct AudioBuffer {
    pub channels: usize,
    pub sample_rate: u32,
    pub samples: Vec<f32>, // Interleaved: [L, R, L, R, ...]
}

/// Base trait for all audio processing nodes
pub trait AudioNode: Send + Sync {
    /// Unique node identifier
    fn id(&self) -> &str;
    
    /// Node metadata
    fn metadata(&self) -> NodeMetadata;
    
    /// Process audio (in-place or return new buffer)
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer>;
    
    /// Handle parameter changes from UI
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()>;
    
    /// Get current parameter value
    fn get_parameter(&self, name: &str) -> Option<f32>;
    
    /// Latency introduced by this node (in samples)
    fn latency(&self) -> usize {
        0
    }
}

pub struct NodeMetadata {
    pub name: String,
    pub category: NodeCategory,
    pub input_channels: usize,
    pub output_channels: usize,
    pub parameters: Vec<ParameterDescriptor>,
}

pub enum NodeCategory {
    Source,      // Input devices, file players
    Effect,      // EQ, compressor, reverb
    Routing,     // Splitters, mergers, routers
    Sink,        // Output devices, recorders
}

pub struct ParameterDescriptor {
    pub name: String,
    pub min: f32,
    pub max: f32,
    pub default: f32,
    pub unit: String, // "dB", "Hz", "%", etc.
}

/// Connection between two nodes
#[derive(Clone)]
pub struct Connection {
    pub from_node: String,
    pub from_output: usize,
    pub to_node: String,
    pub to_input: usize,
}

/// The audio processing graph
pub struct AudioGraph {
    nodes: HashMap<String, Box<dyn AudioNode>>,
    connections: Vec<Connection>,
    execution_order: Vec<String>, // Topologically sorted
}

impl AudioGraph {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            connections: Vec::new(),
            execution_order: Vec::new(),
        }
    }
    
    /// Add a node to the graph
    pub fn add_node(&mut self, node: Box<dyn AudioNode>) -> Result<()> {
        let id = node.id().to_string();
        if self.nodes.contains_key(&id) {
            return Err(anyhow!("Node {} already exists", id));
        }
        self.nodes.insert(id, node);
        self.recompute_execution_order()?;
        Ok(())
    }
    
    /// Remove a node and all its connections
    pub fn remove_node(&mut self, id: &str) -> Result<()> {
        self.nodes.remove(id);
        self.connections.retain(|c| c.from_node != id && c.to_node != id);
        self.recompute_execution_order()?;
        Ok(())
    }
    
    /// Connect two nodes
    pub fn connect(&mut self, connection: Connection) -> Result<()> {
        // Validate nodes exist
        if !self.nodes.contains_key(&connection.from_node) {
            return Err(anyhow!("Source node {} not found", connection.from_node));
        }
        if !self.nodes.contains_key(&connection.to_node) {
            return Err(anyhow!("Destination node {} not found", connection.to_node));
        }
        
        // Check for cycles
        if self.would_create_cycle(&connection) {
            return Err(anyhow!("Connection would create a cycle"));
        }
        
        self.connections.push(connection);
        self.recompute_execution_order()?;
        Ok(())
    }
    
    /// Disconnect two nodes
    pub fn disconnect(&mut self, from_node: &str, to_node: &str) -> Result<()> {
        self.connections.retain(|c| {
            !(c.from_node == from_node && c.to_node == to_node)
        });
        self.recompute_execution_order()?;
        Ok(())
    }
    
    /// Process audio through the entire graph
    pub fn process(&mut self, input: AudioBuffer) -> Result<AudioBuffer> {
        let mut buffers: HashMap<String, AudioBuffer> = HashMap::new();
        
        // Process nodes in topological order
        for node_id in &self.execution_order {
            let node = self.nodes.get_mut(node_id).unwrap();
            
            // Gather inputs from connected nodes
            let node_input = self.gather_inputs(node_id, &buffers)?;
            
            // Process
            let output = node.process(&node_input)?;
            
            // Store output for downstream nodes
            buffers.insert(node_id.clone(), output);
        }
        
        // Return final output (from sink nodes)
        self.get_final_output(&buffers)
    }
    
    /// Topological sort to determine execution order
    fn recompute_execution_order(&mut self) -> Result<()> {
        // Kahn's algorithm for topological sorting
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut adj_list: HashMap<String, Vec<String>> = HashMap::new();
        
        // Initialize
        for node_id in self.nodes.keys() {
            in_degree.insert(node_id.clone(), 0);
            adj_list.insert(node_id.clone(), Vec::new());
        }
        
        // Build adjacency list and in-degree count
        for conn in &self.connections {
            *in_degree.get_mut(&conn.to_node).unwrap() += 1;
            adj_list.get_mut(&conn.from_node).unwrap().push(conn.to_node.clone());
        }
        
        // Find nodes with no incoming edges
        let mut queue: Vec<String> = in_degree
            .iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(id, _)| id.clone())
            .collect();
        
        let mut sorted = Vec::new();
        
        while let Some(node_id) = queue.pop() {
            sorted.push(node_id.clone());
            
            // Reduce in-degree for neighbors
            if let Some(neighbors) = adj_list.get(&node_id) {
                for neighbor in neighbors {
                    let degree = in_degree.get_mut(neighbor).unwrap();
                    *degree -= 1;
                    if *degree == 0 {
                        queue.push(neighbor.clone());
                    }
                }
            }
        }
        
        if sorted.len() != self.nodes.len() {
            return Err(anyhow!("Graph contains a cycle"));
        }
        
        self.execution_order = sorted;
        Ok(())
    }
    
    fn would_create_cycle(&self, new_connection: &Connection) -> bool {
        // DFS to detect cycles
        // Implementation omitted for brevity
        false
    }
    
    fn gather_inputs(&self, node_id: &str, buffers: &HashMap<String, AudioBuffer>) -> Result<AudioBuffer> {
        // Collect all inputs connected to this node
        let incoming: Vec<&Connection> = self.connections
            .iter()
            .filter(|c| c.to_node == node_id)
            .collect();
        
        if incoming.is_empty() {
            // No inputs, return silence
            return Ok(AudioBuffer {
                channels: 2,
                sample_rate: 48000,
                samples: vec![0.0; 1024],
            });
        }
        
        // Mix all inputs
        let first_buffer = buffers.get(&incoming[0].from_node).unwrap();
        let mut mixed = first_buffer.clone();
        
        for conn in incoming.iter().skip(1) {
            let buffer = buffers.get(&conn.from_node).unwrap();
            for (i, sample) in buffer.samples.iter().enumerate() {
                mixed.samples[i] += sample;
            }
        }
        
        Ok(mixed)
    }
    
    fn get_final_output(&self, buffers: &HashMap<String, AudioBuffer>) -> Result<AudioBuffer> {
        // Find sink nodes (nodes with no outgoing connections)
        let sink_nodes: Vec<&String> = self.nodes
            .keys()
            .filter(|id| {
                !self.connections.iter().any(|c| &c.from_node == *id)
            })
            .collect();
        
        if sink_nodes.is_empty() {
            return Err(anyhow!("No sink nodes found"));
        }
        
        // Return output from first sink node
        buffers.get(sink_nodes[0])
            .cloned()
            .ok_or_else(|| anyhow!("Sink node has no output"))
    }
}
```

---

## 2. Compositor Plugin Nodes

```rust
// packages/compositor/src/nodes/mod.rs

pub mod eq;
pub mod compressor;
pub mod reverb;
pub mod clip_player;
pub mod recorder;

// packages/compositor/src/nodes/eq.rs

use audio_graph::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor};
use anyhow::Result;

pub struct EqualizerNode {
    id: String,
    bands: Vec<EQBand>,
}

struct EQBand {
    frequency: f32,
    gain: f32,
    q: f32,
    filter: BiquadFilter,
}

impl EqualizerNode {
    pub fn new(id: String, num_bands: usize) -> Self {
        let mut bands = Vec::new();
        let frequencies = [60.0, 170.0, 310.0, 600.0, 1000.0, 3000.0, 6000.0, 12000.0, 14000.0, 16000.0];
        
        for i in 0..num_bands {
            bands.push(EQBand {
                frequency: frequencies[i],
                gain: 0.0,
                q: 1.0,
                filter: BiquadFilter::new(),
            });
        }
        
        Self { id, bands }
    }
}

impl AudioNode for EqualizerNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        let mut parameters = Vec::new();
        for (i, band) in self.bands.iter().enumerate() {
            parameters.push(ParameterDescriptor {
                name: format!("band_{}_gain", i),
                min: -24.0,
                max: 24.0,
                default: 0.0,
                unit: "dB".to_string(),
            });
        }
        
        NodeMetadata {
            name: "Parametric EQ".to_string(),
            category: NodeCategory::Effect,
            input_channels: 2,
            output_channels: 2,
            parameters,
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let mut output = input.clone();
        
        // Apply each band
        for band in &mut self.bands {
            band.filter.process(&mut output.samples);
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        if let Some(band_idx) = name.strip_prefix("band_").and_then(|s| s.strip_suffix("_gain")) {
            let idx: usize = band_idx.parse()?;
            if idx < self.bands.len() {
                self.bands[idx].gain = value;
                self.bands[idx].filter.update_coefficients(
                    self.bands[idx].frequency,
                    value,
                    self.bands[idx].q,
                );
            }
        }
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        if let Some(band_idx) = name.strip_prefix("band_").and_then(|s| s.strip_suffix("_gain")) {
            let idx: usize = band_idx.parse().ok()?;
            self.bands.get(idx).map(|b| b.gain)
        } else {
            None
        }
    }
}

// Simplified biquad filter (real implementation would be more complex)
struct BiquadFilter {
    a0: f32, a1: f32, a2: f32,
    b1: f32, b2: f32,
    x1: f32, x2: f32,
    y1: f32, y2: f32,
}

impl BiquadFilter {
    fn new() -> Self {
        Self {
            a0: 1.0, a1: 0.0, a2: 0.0,
            b1: 0.0, b2: 0.0,
            x1: 0.0, x2: 0.0,
            y1: 0.0, y2: 0.0,
        }
    }
    
    fn update_coefficients(&mut self, freq: f32, gain: f32, q: f32) {
        // Peaking EQ filter coefficients
        // Implementation based on RBJ Audio EQ Cookbook
        let sample_rate = 48000.0;
        let w0 = 2.0 * std::f32::consts::PI * freq / sample_rate;
        let alpha = w0.sin() / (2.0 * q);
        let a = 10.0_f32.powf(gain / 40.0);
        
        self.a0 = 1.0 + alpha * a;
        self.a1 = -2.0 * w0.cos();
        self.a2 = 1.0 - alpha * a;
        self.b1 = -2.0 * w0.cos();
        self.b2 = 1.0 - alpha / a;
        
        // Normalize
        let norm = 1.0 / (1.0 + alpha / a);
        self.a0 *= norm;
        self.a1 *= norm;
        self.a2 *= norm;
        self.b1 *= norm;
        self.b2 *= norm;
    }
    
    fn process(&mut self, samples: &mut [f32]) {
        for sample in samples.iter_mut() {
            let x = *sample;
            let y = self.a0 * x + self.a1 * self.x1 + self.a2 * self.x2
                  - self.b1 * self.y1 - self.b2 * self.y2;
            
            self.x2 = self.x1;
            self.x1 = x;
            self.y2 = self.y1;
            self.y1 = y;
            
            *sample = y;
        }
    }
}
```

---

## 3. Orquestador Plugin Nodes

```rust
// packages/orquestador/src/nodes/mod.rs

pub mod channel_strip;
pub mod router;
pub mod mixer;
pub mod meter;

// packages/orquestador/src/nodes/channel_strip.rs

use audio_graph::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor};
use anyhow::Result;

pub struct ChannelStripNode {
    id: String,
    gain: f32,        // Linear gain (0.0 to 2.0)
    pan: f32,         // -1.0 (left) to 1.0 (right)
    mute: bool,
    solo: bool,
}

impl ChannelStripNode {
    pub fn new(id: String) -> Self {
        Self {
            id,
            gain: 1.0,
            pan: 0.0,
            mute: false,
            solo: false,
        }
    }
}

impl AudioNode for ChannelStripNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Channel Strip".to_string(),
            category: NodeCategory::Routing,
            input_channels: 2,
            output_channels: 2,
            parameters: vec![
                ParameterDescriptor {
                    name: "gain".to_string(),
                    min: 0.0,
                    max: 2.0,
                    default: 1.0,
                    unit: "linear".to_string(),
                },
                ParameterDescriptor {
                    name: "pan".to_string(),
                    min: -1.0,
                    max: 1.0,
                    default: 0.0,
                    unit: "".to_string(),
                },
            ],
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        if self.mute {
            return Ok(AudioBuffer {
                channels: input.channels,
                sample_rate: input.sample_rate,
                samples: vec![0.0; input.samples.len()],
            });
        }
        
        let mut output = input.clone();
        
        // Apply gain and pan
        for i in (0..output.samples.len()).step_by(2) {
            let left = output.samples[i];
            let right = output.samples[i + 1];
            
            // Constant power panning
            let pan_angle = (self.pan + 1.0) * std::f32::consts::FRAC_PI_4;
            let left_gain = pan_angle.cos() * self.gain;
            let right_gain = pan_angle.sin() * self.gain;
            
            output.samples[i] = left * left_gain;
            output.samples[i + 1] = right * right_gain;
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        match name {
            "gain" => self.gain = value.clamp(0.0, 2.0),
            "pan" => self.pan = value.clamp(-1.0, 1.0),
            "mute" => self.mute = value > 0.5,
            "solo" => self.solo = value > 0.5,
            _ => return Err(anyhow!("Unknown parameter: {}", name)),
        }
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        match name {
            "gain" => Some(self.gain),
            "pan" => Some(self.pan),
            "mute" => Some(if self.mute { 1.0 } else { 0.0 }),
            "solo" => Some(if self.solo { 1.0 } else { 0.0 }),
            _ => None,
        }
    }
}

// packages/orquestador/src/nodes/router.rs

pub struct RouterNode {
    id: String,
    routing_matrix: Vec<Vec<bool>>, // [input][output] = enabled
}

impl RouterNode {
    pub fn new(id: String, num_inputs: usize, num_outputs: usize) -> Self {
        let routing_matrix = vec![vec![false; num_outputs]; num_inputs];
        Self { id, routing_matrix }
    }
    
    pub fn set_route(&mut self, input: usize, output: usize, enabled: bool) {
        if input < self.routing_matrix.len() && output < self.routing_matrix[0].len() {
            self.routing_matrix[input][output] = enabled;
        }
    }
}

impl AudioNode for RouterNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Audio Router".to_string(),
            category: NodeCategory::Routing,
            input_channels: self.routing_matrix.len(),
            output_channels: self.routing_matrix[0].len(),
            parameters: vec![],
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let num_outputs = self.routing_matrix[0].len();
        let samples_per_channel = input.samples.len() / input.channels;
        
        let mut output = AudioBuffer {
            channels: num_outputs,
            sample_rate: input.sample_rate,
            samples: vec![0.0; samples_per_channel * num_outputs],
        };
        
        // Route inputs to outputs based on matrix
        for in_ch in 0..input.channels {
            for out_ch in 0..num_outputs {
                if self.routing_matrix[in_ch][out_ch] {
                    for i in 0..samples_per_channel {
                        output.samples[i * num_outputs + out_ch] += 
                            input.samples[i * input.channels + in_ch];
                    }
                }
            }
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        // Parameters like "route_0_1" to enable input 0 -> output 1
        if let Some(rest) = name.strip_prefix("route_") {
            let parts: Vec<&str> = rest.split('_').collect();
            if parts.len() == 2 {
                let input: usize = parts[0].parse()?;
                let output: usize = parts[1].parse()?;
                self.set_route(input, output, value > 0.5);
            }
        }
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        if let Some(rest) = name.strip_prefix("route_") {
            let parts: Vec<&str> = rest.split('_').collect();
            if parts.len() == 2 {
                let input: usize = parts[0].parse().ok()?;
                let output: usize = parts[1].parse().ok()?;
                return Some(if self.routing_matrix[input][output] { 1.0 } else { 0.0 });
            }
        }
        None
    }
}
```

---

## 4. Plugin Interoperability Examples

### Example 1: Recording with Effects
```rust
// User wants to record microphone with EQ and compression

let mut graph = AudioGraph::new();

// Add nodes
graph.add_node(Box::new(InputDeviceNode::new("mic_input")));
graph.add_node(Box::new(EqualizerNode::new("eq", 10)));
graph.add_node(Box::new(CompressorNode::new("compressor")));
graph.add_node(Box::new(RecorderNode::new("recorder", "/path/to/output.wav")));

// Connect them
graph.connect(Connection {
    from_node: "mic_input".to_string(),
    from_output: 0,
    to_node: "eq".to_string(),
    to_input: 0,
});

graph.connect(Connection {
    from_node: "eq".to_string(),
    from_output: 0,
    to_node: "compressor".to_string(),
    to_input: 0,
});

graph.connect(Connection {
    from_node: "compressor".to_string(),
    from_output: 0,
    to_node: "recorder".to_string(),
    to_input: 0,
});

// Start processing
graph.process(input_buffer)?;
```

### Example 2: Multi-output Routing with Effects
```rust
// User wants to send music to speakers with EQ, and to headphones without EQ

let mut graph = AudioGraph::new();

graph.add_node(Box::new(PlayerNode::new("player")));
graph.add_node(Box::new(EqualizerNode::new("speaker_eq", 10)));
graph.add_node(Box::new(ChannelStripNode::new("speaker_channel")));
graph.add_node(Box::new(ChannelStripNode::new("headphone_channel")));
graph.add_node(Box::new(OutputDeviceNode::new("speakers")));
graph.add_node(Box::new(OutputDeviceNode::new("headphones")));

// Speakers path (with EQ)
graph.connect(Connection {
    from_node: "player".to_string(),
    from_output: 0,
    to_node: "speaker_eq".to_string(),
    to_input: 0,
});

graph.connect(Connection {
    from_node: "speaker_eq".to_string(),
    from_output: 0,
    to_node: "speaker_channel".to_string(),
    to_input: 0,
});

graph.connect(Connection {
    from_node: "speaker_channel".to_string(),
    from_output: 0,
    to_node: "speakers".to_string(),
    to_input: 0,
});

// Headphones path (direct)
graph.connect(Connection {
    from_node: "player".to_string(),
    from_output: 0,
    to_node: "headphone_channel".to_string(),
    to_input: 0,
});

graph.connect(Connection {
    from_node: "headphone_channel".to_string(),
    from_output: 0,
    to_node: "headphones".to_string(),
    to_input: 0,
});
```

### Example 3: Demucs + Orquestador (Server + Desktop Plugins)
```rust
// User wants to separate stems and route each to different outputs

let mut graph = AudioGraph::new();

// Compositor server plugin (Demucs)
graph.add_node(Box::new(DemucsNode::new("demucs", server_url)));

// Orquestador desktop plugins (routing)
graph.add_node(Box::new(ChannelStripNode::new("vocals_channel")));
graph.add_node(Box::new(ChannelStripNode::new("drums_channel")));
graph.add_node(Box::new(ChannelStripNode::new("bass_channel")));
graph.add_node(Box::new(ChannelStripNode::new("other_channel")));

graph.add_node(Box::new(OutputDeviceNode::new("main_output")));

// Connect Demucs outputs to individual channels
graph.connect(Connection {
    from_node: "demucs".to_string(),
    from_output: 0, // vocals
    to_node: "vocals_channel".to_string(),
    to_input: 0,
});

// ... similar for drums, bass, other

// Mix all channels to main output
graph.connect(Connection {
    from_node: "vocals_channel".to_string(),
    from_output: 0,
    to_node: "main_output".to_string(),
    to_input: 0,
});

// ... similar for other channels
```

---

## 5. Tauri Integration

```rust
// apps/desktop/src-tauri/src/services/audio_graph.rs

use std::sync::Arc;
use parking_lot::RwLock;
use audio_graph::{AudioGraph, Connection};
use anyhow::Result;

pub struct AudioGraphService {
    graph: Arc<RwLock<AudioGraph>>,
}

impl AudioGraphService {
    pub fn new() -> Self {
        Self {
            graph: Arc::new(RwLock::new(AudioGraph::new())),
        }
    }
    
    pub fn add_node(&self, plugin_id: &str, node_type: &str, config: serde_json::Value) -> Result<()> {
        let mut graph = self.graph.write();
        
        let node: Box<dyn AudioNode> = match node_type {
            "compositor.eq" => Box::new(EqualizerNode::new(plugin_id.to_string(), 10)),
            "compositor.compressor" => Box::new(CompressorNode::new(plugin_id.to_string())),
            "orquestador.channel_strip" => Box::new(ChannelStripNode::new(plugin_id.to_string())),
            "orquestador.router" => Box::new(RouterNode::new(plugin_id.to_string(), 2, 4)),
            _ => return Err(anyhow!("Unknown node type: {}", node_type)),
        };
        
        graph.add_node(node)?;
        Ok(())
    }
    
    pub fn connect_nodes(&self, from: &str, to: &str) -> Result<()> {
        let mut graph = self.graph.write();
        graph.connect(Connection {
            from_node: from.to_string(),
            from_output: 0,
            to_node: to.to_string(),
            to_input: 0,
        })?;
        Ok(())
    }
    
    pub fn set_parameter(&self, node_id: &str, param: &str, value: f32) -> Result<()> {
        let mut graph = self.graph.write();
        if let Some(node) = graph.nodes.get_mut(node_id) {
            node.set_parameter(param, value)?;
        }
        Ok(())
    }
}

// apps/desktop/src-tauri/src/commands/audio_graph.rs

#[tauri::command]
pub async fn add_audio_node(
    node_id: String,
    node_type: String,
    config: serde_json::Value,
    state: tauri::State<'_, AudioGraphService>,
) -> Result<(), String> {
    state.add_node(&node_id, &node_type, config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn connect_audio_nodes(
    from_node: String,
    to_node: String,
    state: tauri::State<'_, AudioGraphService>,
) -> Result<(), String> {
    state.connect_nodes(&from_node, &to_node)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_node_parameter(
    node_id: String,
    parameter: String,
    value: f32,
    state: tauri::State<'_, AudioGraphService>,
) -> Result<(), String> {
    state.set_parameter(&node_id, &parameter, value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_audio_graph_state(
    state: tauri::State<'_, AudioGraphService>,
) -> Result<serde_json::Value, String> {
    // Serialize graph state for UI
    Ok(serde_json::json!({
        "nodes": [],
        "connections": [],
    }))
}
```

---

## 6. Frontend Integration (TypeScript)

```typescript
// packages/shared/src/types/espectro.ts

export interface AudioGraphNode {
  id: string;
  type: string; // "compositor.eq", "orquestador.channel_strip", etc.
  category: 'compositor' | 'orquestador';
  position: { x: number; y: number }; // For visual graph editor
  parameters: Record<string, number>;
}

export interface AudioGraphConnection {
  from: string;
  to: string;
}

export interface AudioGraphState {
  nodes: AudioGraphNode[];
  connections: AudioGraphConnection[];
}

// packages/ui/src/stores/audioGraphStore.ts

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

interface AudioGraphStore {
  nodes: AudioGraphNode[];
  connections: AudioGraphConnection[];
  
  addNode: (type: string, config?: any) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  connectNodes: (from: string, to: string) => Promise<void>;
  disconnectNodes: (from: string, to: string) => Promise<void>;
  setParameter: (nodeId: string, param: string, value: number) => Promise<void>;
  
  loadGraph: () => Promise<void>;
}

export const useAudioGraphStore = create<AudioGraphStore>((set, get) => ({
  nodes: [],
  connections: [],
  
  addNode: async (type, config = {}) => {
    const id = `${type}_${Date.now()}`;
    await invoke('add_audio_node', { nodeId: id, nodeType: type, config });
    
    set((state) => ({
      nodes: [...state.nodes, {
        id,
        type,
        category: type.startsWith('compositor') ? 'compositor' : 'orquestador',
        position: { x: 0, y: 0 },
        parameters: {},
      }],
    }));
  },
  
  connectNodes: async (from, to) => {
    await invoke('connect_audio_nodes', { fromNode: from, toNode: to });
    
    set((state) => ({
      connections: [...state.connections, { from, to }],
    }));
  },
  
  setParameter: async (nodeId, param, value) => {
    await invoke('set_node_parameter', { nodeId, parameter: param, value });
    
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, parameters: { ...node.parameters, [param]: value } }
          : node
      ),
    }));
  },
  
  loadGraph: async () => {
    const state = await invoke<AudioGraphState>('get_audio_graph_state');
    set(state);
  },
}));
```

---

## 7. Visual Graph Editor UI

```typescript
// packages/ui/src/components/AudioGraphEditor.tsx

import React from 'react';
import ReactFlow, { Node, Edge, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { useAudioGraphStore } from '../stores/audioGraphStore';

export const AudioGraphEditor: React.FC = () => {
  const { nodes, connections, connectNodes } = useAudioGraphStore();
  
  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: node.position,
    data: { label: node.type, parameters: node.parameters },
  }));
  
  const flowEdges: Edge[] = connections.map((conn, idx) => ({
    id: `edge-${idx}`,
    source: conn.from,
    target: conn.to,
  }));
  
  const onConnect = (params: any) => {
    connectNodes(params.source, params.target);
  };
  
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
```

---

## 8. Implementation Phases

### Phase 1: Audio Graph Core (Week 1-2)
- [ ] Implement `espectro` package with `AudioNode` trait
- [ ] Add topological sorting and cycle detection
- [ ] Create basic nodes (gain, pan, mixer)
- [ ] Unit tests for graph operations

### Phase 2: Compositor Nodes (Week 3-4)
- [ ] Implement EQ node (10-band parametric)
- [ ] Implement compressor node
- [ ] Implement recorder node
- [ ] Implement clip player node
- [ ] Integration tests

### Phase 3: Orquestador Nodes (Week 5-6)
- [ ] Implement channel strip node
- [ ] Implement router node (N×M matrix)
- [ ] Implement meter node (peak/RMS)
- [ ] Implement multi-output device node

### Phase 4: Tauri Integration (Week 7)
- [ ] Expose graph commands via Tauri
- [ ] Add state serialization/deserialization
- [ ] Implement real-time parameter updates
- [ ] Add event streaming for meters

### Phase 5: UI (Week 8-9)
- [ ] Build visual graph editor (ReactFlow)
- [ ] Create node parameter panels
- [ ] Add preset management
- [ ] Implement drag-and-drop node creation

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-15  
**Status**: Implementation Ready  
**Owner**: Sonántica Core Team
