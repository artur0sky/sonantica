// Device Manager - Audio Device Enumeration
// Handles discovery and management of audio input/output devices

use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};

/// Represents an audio device (input or output)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    /// Unique identifier for the device
    pub id: String,
    /// Human-readable device name
    pub name: String,
    /// Whether this is an input device (microphone, line-in)
    pub is_input: bool,
    /// Whether this is the system default device
    pub is_default: bool,
    /// Number of input channels
    pub input_channels: Option<u16>,
    /// Number of output channels
    pub output_channels: Option<u16>,
    /// Supported sample rates (Hz)
    pub sample_rates: Vec<u32>,
    /// Host API (WASAPI, CoreAudio, ALSA, etc.)
    pub host_api: String,
}

/// Audio device manager
pub struct DeviceManager {
    host: cpal::Host,
}

impl DeviceManager {
    /// Create a new device manager using the default host
    pub fn new() -> Self {
        Self {
            host: cpal::default_host(),
        }
    }

    /// List all available audio devices (inputs and outputs)
    #[tracing::instrument(skip(self), name = "audio.list_devices")]
    pub fn list_devices(&self) -> anyhow::Result<Vec<AudioDevice>> {
        tracing::info!("Enumerating audio devices");
        let mut devices = Vec::new();

        // Get default devices for comparison
        let default_input = self.host.default_input_device();
        let default_output = self.host.default_output_device();

        // Enumerate input devices
        if let Ok(input_devices) = self.host.input_devices() {
            for device in input_devices {
                if let Ok(device_info) = self.get_device_info(&device, true) {
                    let is_default = default_input
                        .as_ref()
                        .and_then(|d| d.name().ok())
                        .map(|name| name == device_info.name)
                        .unwrap_or(false);

                    tracing::debug!(
                        device_name = %device_info.name,
                        is_default = is_default,
                        channels = device_info.input_channels,
                        "Found input device"
                    );

                    devices.push(AudioDevice {
                        is_default,
                        ..device_info
                    });
                }
            }
        } else {
            tracing::warn!("Failed to enumerate input devices");
        }

        // Enumerate output devices
        if let Ok(output_devices) = self.host.output_devices() {
            for device in output_devices {
                if let Ok(device_info) = self.get_device_info(&device, false) {
                    let is_default = default_output
                        .as_ref()
                        .and_then(|d| d.name().ok())
                        .map(|name| name == device_info.name)
                        .unwrap_or(false);

                    tracing::debug!(
                        device_name = %device_info.name,
                        is_default = is_default,
                        channels = device_info.output_channels,
                        "Found output device"
                    );

                    devices.push(AudioDevice {
                        is_default,
                        ..device_info
                    });
                }
            }
        } else {
            tracing::warn!("Failed to enumerate output devices");
        }

        tracing::info!(device_count = devices.len(), "Audio device enumeration complete");
        Ok(devices)
    }

    /// Get detailed information about a specific device
    fn get_device_info(
        &self,
        device: &cpal::Device,
        is_input: bool,
    ) -> anyhow::Result<AudioDevice> {
        let name = device.name()?;

        // Extract sample rates and channel counts
        let mut sample_rates = Vec::new();
        let mut max_channels = 0u16;

        // Handle input and output configs separately due to different types
        if is_input {
            if let Ok(configs) = device.supported_input_configs() {
                for config in configs {
                    let min_rate = config.min_sample_rate().0;
                    let max_rate = config.max_sample_rate().0;

                    // Add common sample rates within the supported range
                    for &rate in &[44100, 48000, 88200, 96000, 176400, 192000] {
                        if rate >= min_rate && rate <= max_rate && !sample_rates.contains(&rate) {
                            sample_rates.push(rate);
                        }
                    }

                    // Track maximum channels
                    max_channels = max_channels.max(config.channels());
                }
            }
        } else {
            if let Ok(configs) = device.supported_output_configs() {
                for config in configs {
                    let min_rate = config.min_sample_rate().0;
                    let max_rate = config.max_sample_rate().0;

                    // Add common sample rates within the supported range
                    for &rate in &[44100, 48000, 88200, 96000, 176400, 192000] {
                        if rate >= min_rate && rate <= max_rate && !sample_rates.contains(&rate) {
                            sample_rates.push(rate);
                        }
                    }

                    // Track maximum channels
                    max_channels = max_channels.max(config.channels());
                }
            }
        }

        // Sort sample rates
        sample_rates.sort_unstable();

        // Generate a stable ID (use device name as base)
        let id = format!(
            "{}_{}",
            if is_input { "input" } else { "output" },
            name.replace(' ', "_").to_lowercase()
        );

        Ok(AudioDevice {
            id,
            name,
            is_input,
            is_default: false, // Will be set by caller
            input_channels: if is_input { Some(max_channels) } else { None },
            output_channels: if !is_input { Some(max_channels) } else { None },
            sample_rates,
            host_api: self.host.id().name().to_string(),
        })
    }

    /// Get the default input device
    pub fn default_input_device(&self) -> anyhow::Result<Option<AudioDevice>> {
        if let Some(device) = self.host.default_input_device() {
            let mut info = self.get_device_info(&device, true)?;
            info.is_default = true;
            Ok(Some(info))
        } else {
            Ok(None)
        }
    }

    /// Get the default output device
    pub fn default_output_device(&self) -> anyhow::Result<Option<AudioDevice>> {
        if let Some(device) = self.host.default_output_device() {
            let mut info = self.get_device_info(&device, false)?;
            info.is_default = true;
            Ok(Some(info))
        } else {
            Ok(None)
        }
    }
}

impl Default for DeviceManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_device_enumeration() {
        let manager = DeviceManager::new();
        let devices = manager.list_devices().expect("Failed to list devices");

        // Should have at least one device on most systems
        assert!(
            !devices.is_empty(),
            "No audio devices found (this may fail in CI)"
        );

        // Verify device structure
        for device in &devices {
            assert!(!device.name.is_empty(), "Device name should not be empty");
            assert!(!device.id.is_empty(), "Device ID should not be empty");

            if device.is_input {
                assert!(
                    device.input_channels.is_some(),
                    "Input device should have input channels"
                );
            } else {
                assert!(
                    device.output_channels.is_some(),
                    "Output device should have output channels"
                );
            }
        }
    }

    #[test]
    fn test_default_devices() {
        let manager = DeviceManager::new();

        // Try to get default devices (may be None in headless environments)
        let _default_input = manager.default_input_device();
        let _default_output = manager.default_output_device();

        // Just verify the calls don't panic
    }
}
