import { SettingSection, SettingRow, Switch } from "@sonantica/ui";

export function AudioSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SettingSection
        title="Playback Engine"
        description="Configure how Sonántica processes and outputs audio."
      >
        <SettingRow
          label="Exclusive Mode"
          description="Take exclusive control of the audio device for bit-perfect playback (Windows/macOS)."
        >
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Gapless Playback"
          description="Eliminate silence between tracks."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Crossfade"
          description="Smoothly fade between tracks."
        >
          <div className="w-32">
            {/* Mock Select for now */}
            <div className="bg-surface p-2 rounded text-sm text-center">
              Disabled
            </div>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Volume & Normalization"
        description="Manage audio levels and dynamic range."
      >
        <SettingRow
          label="ReplayGain"
          description="Normalize volume across tracks to a standard level."
        >
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Pre-Amp"
          description="Adjust the base gain for the equalizer."
        >
          <div className="text-sm text-text-muted">0 dB</div>
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="High Fidelity"
        description="Settings for audiophiles."
      >
        <SettingRow
          label="SoX Resampler"
          description="Use high-quality resampling (uses more CPU)."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
