use serde::{Deserialize, Serialize};

/// Connection between two nodes in the audio graph
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Connection {
    /// Source node ID
    pub from_node: String,
    
    /// Source output index (0-based)
    pub from_output: usize,
    
    /// Destination node ID
    pub to_node: String,
    
    /// Destination input index (0-based)
    pub to_input: usize,
}

impl Connection {
    /// Create a new connection
    pub fn new(from_node: String, from_output: usize, to_node: String, to_input: usize) -> Self {
        Self {
            from_node,
            from_output,
            to_node,
            to_input,
        }
    }
    
    /// Create a simple connection (output 0 to input 0)
    pub fn simple(from_node: String, to_node: String) -> Self {
        Self::new(from_node, 0, to_node, 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_connection_creation() {
        let conn = Connection::new("node1".to_string(), 0, "node2".to_string(), 1);
        assert_eq!(conn.from_node, "node1");
        assert_eq!(conn.from_output, 0);
        assert_eq!(conn.to_node, "node2");
        assert_eq!(conn.to_input, 1);
    }
    
    #[test]
    fn test_simple_connection() {
        let conn = Connection::simple("a".to_string(), "b".to_string());
        assert_eq!(conn.from_output, 0);
        assert_eq!(conn.to_input, 0);
    }
}
