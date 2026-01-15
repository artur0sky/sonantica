//! Example: Compositor + Orquestador Plugin Interoperability
//! 
//! This example demonstrates how plugins from different modules can work together
//! through the audio graph system.

use audio_graph::{AudioGraph, AudioBuffer, Connection};
use compositor::{GainNode, EqualizerNode, CompressorNode};
use orquestador::{ChannelStripNode, PanNode, MixerNode};

fn main() -> anyhow::Result<()> {
    println!("Sonántica Plugin Interoperability Example");
    println!("==========================================\n");
    
    // Create audio graph
    let mut graph = AudioGraph::new();
    
    // Scenario: Recording with effects and routing
    // Input -> EQ (Compositor) -> Compressor (Compositor) -> Channel Strip (Orquestador) -> Output
    
    println!("Building audio processing chain:");
    println!("  Input → EQ → Compressor → Channel Strip → Output\n");
    
    // Add Compositor nodes
    let eq = EqualizerNode::new("eq".to_string(), 5);
    let compressor = CompressorNode::new("compressor".to_string());
    
    // Add Orquestador nodes
    let channel = ChannelStripNode::new("channel".to_string());
    
    // Add nodes to graph
    graph.add_node(Box::new(eq))?;
    graph.add_node(Box::new(compressor))?;
    graph.add_node(Box::new(channel))?;
    
    println!("Added nodes:");
    println!("  - EQ (Compositor plugin)");
    println!("  - Compressor (Compositor plugin)");
    println!("  - Channel Strip (Orquestador plugin)\n");
    
    // Connect nodes
    graph.connect(Connection::simple("eq".to_string(), "compressor".to_string()))?;
    graph.connect(Connection::simple("compressor".to_string(), "channel".to_string()))?;
    
    println!("Connected nodes in chain\n");
    
    // Configure EQ
    graph.set_parameter("eq", "band_0_gain", 3.0)?;  // Boost low end
    graph.set_parameter("eq", "band_2_gain", -2.0)?; // Cut mids
    
    println!("Configured EQ:");
    println!("  - Band 0: +3 dB (bass boost)");
    println!("  - Band 2: -2 dB (mid cut)\n");
    
    // Configure Compressor
    graph.set_parameter("compressor", "threshold", -15.0)?;
    graph.set_parameter("compressor", "ratio", 4.0)?;
    
    println!("Configured Compressor:");
    println!("  - Threshold: -15 dB");
    println!("  - Ratio: 4:1\n");
    
    // Configure Channel Strip
    graph.set_parameter("channel", "gain", 2.0)?;
    graph.set_parameter("channel", "pan", 0.2)?;  // Slightly right
    
    println!("Configured Channel Strip:");
    println!("  - Gain: +2 dB");
    println!("  - Pan: 0.2 (slightly right)\n");
    
    // Create test input
    let mut input = AudioBuffer::new(2, 48000, 512);
    for i in 0..input.samples.len() {
        input.samples[i] = 0.5 * (i as f32 * 0.01).sin();  // Test sine wave
    }
    
    println!("Processing audio...");
    
    // Process through the graph
    let output = graph.process(input)?;
    
    println!("✓ Audio processed successfully!");
    println!("\nOutput stats:");
    println!("  - Channels: {}", output.channels);
    println!("  - Sample rate: {} Hz", output.sample_rate);
    println!("  - Frames: {}", output.num_frames());
    println!("  - Peak level: {:.3}", output.peak_level());
    println!("  - RMS level: {:.3}", output.rms_level());
    
    println!("\n===========================================");
    println!("Example 2: Multi-channel Mixing");
    println!("===========================================\n");
    
    // Create a new graph for mixing scenario
    let mut mix_graph = AudioGraph::new();
    
    // Scenario: Mix 3 channels with different processing
    // Channel 1: EQ + Pan Left
    // Channel 2: Compressor + Pan Center
    // Channel 3: Gain + Pan Right
    // All → Mixer → Output
    
    println!("Building multi-channel mix:");
    println!("  Ch1 (EQ + Pan Left)    ┐");
    println!("  Ch2 (Comp + Pan Center)├→ Mixer → Output");
    println!("  Ch3 (Gain + Pan Right) ┘\n");
    
    // Channel 1: EQ + Pan
    mix_graph.add_node(Box::new(EqualizerNode::new("ch1_eq".to_string(), 3)))?;
    mix_graph.add_node(Box::new(PanNode::new("ch1_pan".to_string())))?;
    
    // Channel 2: Compressor + Pan
    mix_graph.add_node(Box::new(CompressorNode::new("ch2_comp".to_string())))?;
    mix_graph.add_node(Box::new(PanNode::new("ch2_pan".to_string())))?;
    
    // Channel 3: Gain + Pan
    mix_graph.add_node(Box::new(GainNode::new("ch3_gain".to_string())))?;
    mix_graph.add_node(Box::new(PanNode::new("ch3_pan".to_string())))?;
    
    // Mixer
    mix_graph.add_node(Box::new(MixerNode::new("mixer".to_string(), 3)))?;
    
    // Connect chains
    mix_graph.connect(Connection::simple("ch1_eq".to_string(), "ch1_pan".to_string()))?;
    mix_graph.connect(Connection::simple("ch1_pan".to_string(), "mixer".to_string()))?;
    
    mix_graph.connect(Connection::simple("ch2_comp".to_string(), "ch2_pan".to_string()))?;
    mix_graph.connect(Connection::simple("ch2_pan".to_string(), "mixer".to_string()))?;
    
    mix_graph.connect(Connection::simple("ch3_gain".to_string(), "ch3_pan".to_string()))?;
    mix_graph.connect(Connection::simple("ch3_pan".to_string(), "mixer".to_string()))?;
    
    // Configure panning
    mix_graph.set_parameter("ch1_pan", "pan", -0.8)?;  // Left
    mix_graph.set_parameter("ch2_pan", "pan", 0.0)?;   // Center
    mix_graph.set_parameter("ch3_pan", "pan", 0.8)?;   // Right
    
    println!("Configured 3-channel mix:");
    println!("  - Channel 1: Panned left (-0.8)");
    println!("  - Channel 2: Panned center (0.0)");
    println!("  - Channel 3: Panned right (0.8)\n");
    
    println!("✓ Multi-channel mixing graph configured successfully!");
    
    println!("\n===========================================");
    println!("Key Takeaways");
    println!("===========================================");
    println!("✓ Compositor and Orquestador plugins work together seamlessly");
    println!("✓ Nodes can be connected in any order to form processing chains");
    println!("✓ The audio graph handles routing and mixing automatically");
    println!("✓ Parameters can be adjusted in real-time");
    println!("✓ Complex multi-channel scenarios are supported");
    
    Ok(())
}
