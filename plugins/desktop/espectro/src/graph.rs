use crate::{AudioBuffer, AudioNode, Connection, GraphError, Result};
use std::collections::{HashMap, HashSet, VecDeque};
use parking_lot::RwLock;
use std::sync::Arc;

/// The audio processing graph
/// 
/// This is the core of plugin interoperability. Nodes from different plugins
/// (Compositor, Orquestador) can be added to the graph and connected to form
/// complex audio processing chains.
pub struct AudioGraph {
    /// All nodes in the graph
    nodes: HashMap<String, Box<dyn AudioNode>>,
    
    /// All connections between nodes
    connections: Vec<Connection>,
    
    /// Topologically sorted execution order
    execution_order: Vec<String>,
    
    /// Cached buffers for intermediate results
    buffer_cache: HashMap<String, AudioBuffer>,
}

impl AudioGraph {
    /// Create a new empty audio graph
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            connections: Vec::new(),
            execution_order: Vec::new(),
            buffer_cache: HashMap::new(),
        }
    }
    
    /// Add a node to the graph
    /// 
    /// # Arguments
    /// * `node` - The node to add
    /// 
    /// # Errors
    /// Returns `GraphError::NodeAlreadyExists` if a node with the same ID already exists
    pub fn add_node(&mut self, node: Box<dyn AudioNode>) -> Result<()> {
        let id = node.id().to_string();
        
        if self.nodes.contains_key(&id) {
            return Err(GraphError::NodeAlreadyExists(id));
        }
        
        self.nodes.insert(id, node);
        self.recompute_execution_order()?;
        
        Ok(())
    }
    
    /// Remove a node and all its connections
    /// 
    /// # Arguments
    /// * `id` - ID of the node to remove
    /// 
    /// # Errors
    /// Returns `GraphError::NodeNotFound` if the node doesn't exist
    pub fn remove_node(&mut self, id: &str) -> Result<()> {
        if !self.nodes.contains_key(id) {
            return Err(GraphError::NodeNotFound(id.to_string()));
        }
        
        self.nodes.remove(id);
        self.connections.retain(|c| c.from_node != id && c.to_node != id);
        self.buffer_cache.remove(id);
        self.recompute_execution_order()?;
        
        Ok(())
    }
    
    /// Connect two nodes
    /// 
    /// # Arguments
    /// * `connection` - The connection to create
    /// 
    /// # Errors
    /// * `GraphError::NodeNotFound` if either node doesn't exist
    /// * `GraphError::CycleDetected` if the connection would create a cycle
    pub fn connect(&mut self, connection: Connection) -> Result<()> {
        // Validate nodes exist
        if !self.nodes.contains_key(&connection.from_node) {
            return Err(GraphError::NodeNotFound(connection.from_node.clone()));
        }
        if !self.nodes.contains_key(&connection.to_node) {
            return Err(GraphError::NodeNotFound(connection.to_node.clone()));
        }
        
        // Check for cycles
        if self.would_create_cycle(&connection) {
            return Err(GraphError::CycleDetected);
        }
        
        self.connections.push(connection);
        self.recompute_execution_order()?;
        
        Ok(())
    }
    
    /// Disconnect two nodes
    /// 
    /// # Arguments
    /// * `from_node` - Source node ID
    /// * `to_node` - Destination node ID
    pub fn disconnect(&mut self, from_node: &str, to_node: &str) -> Result<()> {
        self.connections.retain(|c| {
            !(c.from_node == from_node && c.to_node == to_node)
        });
        self.recompute_execution_order()?;
        
        Ok(())
    }
    
    /// Process audio through the entire graph
    /// 
    /// # Arguments
    /// * `input` - Input audio buffer (typically from an input device or file)
    /// 
    /// # Returns
    /// Final output buffer (from sink nodes)
    pub fn process(&mut self, input: AudioBuffer) -> Result<AudioBuffer> {
        self.buffer_cache.clear();
        
        // Store input for source nodes
        if let Some(first_node_id) = self.execution_order.first() {
            self.buffer_cache.insert(first_node_id.clone(), input);
        }
        
        // Process nodes in topological order
        for node_id in &self.execution_order.clone() {
            // Gather inputs BEFORE getting mutable reference to node
            let node_input = self.gather_inputs(node_id)?;
            
            // Now get mutable reference and process
            let node = self.nodes.get_mut(node_id)
                .ok_or_else(|| GraphError::NodeNotFound(node_id.clone()))?;
            
            let output = node.process(&node_input)
                .map_err(|e| GraphError::ProcessingError(e.to_string()))?;
            
            // Store output for downstream nodes
            self.buffer_cache.insert(node_id.clone(), output);
        }
        
        // Return final output (from sink nodes)
        self.get_final_output()
    }
    
    /// Set a parameter on a node
    /// 
    /// # Arguments
    /// * `node_id` - ID of the node
    /// * `parameter` - Parameter name
    /// * `value` - New parameter value
    pub fn set_parameter(&mut self, node_id: &str, parameter: &str, value: f32) -> Result<()> {
        let node = self.nodes.get_mut(node_id)
            .ok_or_else(|| GraphError::NodeNotFound(node_id.to_string()))?;
        
        node.set_parameter(parameter, value)
            .map_err(|e| GraphError::ProcessingError(e.to_string()))
    }
    
    /// Get a parameter from a node
    /// 
    /// # Arguments
    /// * `node_id` - ID of the node
    /// * `parameter` - Parameter name
    pub fn get_parameter(&self, node_id: &str, parameter: &str) -> Result<Option<f32>> {
        let node = self.nodes.get(node_id)
            .ok_or_else(|| GraphError::NodeNotFound(node_id.to_string()))?;
        
        Ok(node.get_parameter(parameter))
    }
    
    /// Get all node IDs in the graph
    pub fn node_ids(&self) -> Vec<String> {
        self.nodes.keys().cloned().collect()
    }
    
    /// Get all connections in the graph
    pub fn connections(&self) -> &[Connection] {
        &self.connections
    }
    
    /// Recompute execution order using topological sort (Kahn's algorithm)
    fn recompute_execution_order(&mut self) -> Result<()> {
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
        let mut queue: VecDeque<String> = in_degree
            .iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(id, _)| id.clone())
            .collect();
        
        let mut sorted = Vec::new();
        
        while let Some(node_id) = queue.pop_front() {
            sorted.push(node_id.clone());
            
            // Reduce in-degree for neighbors
            if let Some(neighbors) = adj_list.get(&node_id) {
                for neighbor in neighbors {
                    let degree = in_degree.get_mut(neighbor).unwrap();
                    *degree -= 1;
                    if *degree == 0 {
                        queue.push_back(neighbor.clone());
                    }
                }
            }
        }
        
        if sorted.len() != self.nodes.len() {
            return Err(GraphError::CycleDetected);
        }
        
        self.execution_order = sorted;
        Ok(())
    }
    
    /// Check if adding a connection would create a cycle
    fn would_create_cycle(&self, new_connection: &Connection) -> bool {
        // DFS to detect if there's a path from to_node back to from_node
        let mut visited = HashSet::new();
        let mut stack = vec![new_connection.to_node.clone()];
        
        while let Some(current) = stack.pop() {
            if current == new_connection.from_node {
                return true; // Cycle detected
            }
            
            if visited.contains(&current) {
                continue;
            }
            
            visited.insert(current.clone());
            
            // Add all nodes that current connects to
            for conn in &self.connections {
                if conn.from_node == current {
                    stack.push(conn.to_node.clone());
                }
            }
        }
        
        false
    }
    
    /// Gather inputs for a node from all connected upstream nodes
    fn gather_inputs(&self, node_id: &str) -> Result<AudioBuffer> {
        let incoming: Vec<&Connection> = self.connections
            .iter()
            .filter(|c| c.to_node == node_id)
            .collect();
        
        if incoming.is_empty() {
            // No inputs, return silence
            return Ok(AudioBuffer::silence(2, 48000, 512));
        }
        
        // Get first input
        let first_buffer = self.buffer_cache
            .get(&incoming[0].from_node)
            .ok_or_else(|| GraphError::NodeNotFound(incoming[0].from_node.clone()))?;
        
        let mut mixed = first_buffer.clone();
        
        // Mix additional inputs
        for conn in incoming.iter().skip(1) {
            let buffer = self.buffer_cache
                .get(&conn.from_node)
                .ok_or_else(|| GraphError::NodeNotFound(conn.from_node.clone()))?;
            
            mixed.mix(buffer);
        }
        
        Ok(mixed)
    }
    
    /// Get final output from sink nodes
    fn get_final_output(&self) -> Result<AudioBuffer> {
        // Find sink nodes (nodes with no outgoing connections)
        let sink_nodes: Vec<&String> = self.nodes
            .keys()
            .filter(|id| {
                !self.connections.iter().any(|c| &c.from_node == *id)
            })
            .collect();
        
        if sink_nodes.is_empty() {
            return Err(GraphError::ProcessingError("No sink nodes found".to_string()));
        }
        
        // Return output from first sink node
        self.buffer_cache
            .get(sink_nodes[0])
            .cloned()
            .ok_or_else(|| GraphError::NodeNotFound(sink_nodes[0].clone()))
    }
}

impl Default for AudioGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Thread-safe wrapper around AudioGraph
pub type SharedAudioGraph = Arc<RwLock<AudioGraph>>;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{NodeMetadata, NodeCategory};
    
    // Mock node for testing
    struct MockNode {
        id: String,
        gain: f32,
    }
    
    impl MockNode {
        fn new(id: &str) -> Self {
            Self {
                id: id.to_string(),
                gain: 1.0,
            }
        }
    }
    
    impl AudioNode for MockNode {
        fn id(&self) -> &str {
            &self.id
        }
        
        fn metadata(&self) -> NodeMetadata {
            NodeMetadata {
                name: "Mock Node".to_string(),
                category: NodeCategory::Effect,
                input_channels: 2,
                output_channels: 2,
                parameters: vec![],
                plugin: "test".to_string(),
            }
        }
        
        fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
            let mut output = input.clone();
            output.apply_gain(self.gain);
            Ok(output)
        }
        
        fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
            if name == "gain" {
                self.gain = value;
                Ok(())
            } else {
                Err(GraphError::ParameterNotFound(name.to_string()))
            }
        }
        
        fn get_parameter(&self, name: &str) -> Option<f32> {
            if name == "gain" {
                Some(self.gain)
            } else {
                None
            }
        }
    }
    
    #[test]
    fn test_add_remove_node() {
        let mut graph = AudioGraph::new();
        
        graph.add_node(Box::new(MockNode::new("node1"))).unwrap();
        assert_eq!(graph.node_ids().len(), 1);
        
        graph.remove_node("node1").unwrap();
        assert_eq!(graph.node_ids().len(), 0);
    }
    
    #[test]
    fn test_duplicate_node() {
        let mut graph = AudioGraph::new();
        
        graph.add_node(Box::new(MockNode::new("node1"))).unwrap();
        let result = graph.add_node(Box::new(MockNode::new("node1")));
        
        assert!(matches!(result, Err(GraphError::NodeAlreadyExists(_))));
    }
    
    #[test]
    fn test_connect_nodes() {
        let mut graph = AudioGraph::new();
        
        graph.add_node(Box::new(MockNode::new("node1"))).unwrap();
        graph.add_node(Box::new(MockNode::new("node2"))).unwrap();
        
        let conn = Connection::simple("node1".to_string(), "node2".to_string());
        graph.connect(conn).unwrap();
        
        assert_eq!(graph.connections().len(), 1);
    }
    
    #[test]
    fn test_cycle_detection() {
        let mut graph = AudioGraph::new();
        
        graph.add_node(Box::new(MockNode::new("node1"))).unwrap();
        graph.add_node(Box::new(MockNode::new("node2"))).unwrap();
        
        graph.connect(Connection::simple("node1".to_string(), "node2".to_string())).unwrap();
        
        // Try to create a cycle
        let result = graph.connect(Connection::simple("node2".to_string(), "node1".to_string()));
        
        assert!(matches!(result, Err(GraphError::CycleDetected)));
    }
}
