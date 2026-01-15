use thiserror::Error;

#[derive(Error, Debug)]
pub enum GraphError {
    #[error("Node '{0}' already exists in the graph")]
    NodeAlreadyExists(String),
    
    #[error("Node '{0}' not found in the graph")]
    NodeNotFound(String),
    
    #[error("Connection would create a cycle in the graph")]
    CycleDetected,
    
    #[error("Invalid connection: {0}")]
    InvalidConnection(String),
    
    #[error("Parameter '{0}' not found")]
    ParameterNotFound(String),
    
    #[error("Invalid parameter value: {0}")]
    InvalidParameterValue(String),
    
    #[error("Audio processing error: {0}")]
    ProcessingError(String),
    
    #[error("Buffer size mismatch: expected {expected}, got {actual}")]
    BufferSizeMismatch { expected: usize, actual: usize },
    
    #[error("Channel count mismatch: expected {expected}, got {actual}")]
    ChannelMismatch { expected: usize, actual: usize },
}

pub type Result<T> = std::result::Result<T, GraphError>;
