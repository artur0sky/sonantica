// Sonántica Studio Core - Audio Module
// Professional audio I/O and routing engine
//
// Architecture:
// - DeviceManager: Enumerate and manage audio devices
// - StreamManager: Handle audio stream lifecycle (future)
// - Patchbay: Route audio between devices (future)
// - Recorder: Capture audio to disk (future)

pub mod device_manager;

pub use device_manager::{AudioDevice, DeviceManager};
