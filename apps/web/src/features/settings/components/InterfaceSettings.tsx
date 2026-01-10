import { SettingSection, SettingRow, Switch, Select } from "@sonantica/ui";
import { useSettingsStore } from "../../../stores/settingsStore";
import { features } from "../../../utils/browser";

export function InterfaceSettings() {
  const {
    animations,
    animationSpeed,
    reducedMotion,
    hoverAnimations,
    transitionAnimations,
    listAnimations,
    toggle,
    setAnimationSpeed,
  } = useSettingsStore();

  // Detect system preference
  const systemPrefersReducedMotion = features.prefersReducedMotion();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-200">
      <SettingSection
        title="Appearance"
        description="Customize the look and feel of Sonántica."
      >
        {/* Master Animation Toggle */}
        <SettingRow
          label="Animations"
          description="Enable fluid transitions and effects throughout the app."
        >
          <Switch checked={animations} onChange={() => toggle("animations")} />
        </SettingRow>

        {/* Animation Speed */}
        {animations && (
          <SettingRow
            label="Animation Speed"
            description="Control how fast animations play. Faster speeds improve perceived performance."
          >
            <Select
              value={animationSpeed}
              onChange={(e) => {
                const value = typeof e === "string" ? e : e.target.value;
                setAnimationSpeed(value as "slow" | "normal" | "fast");
              }}
              options={[
                { value: "slow", label: "Slow (200ms)" },
                { value: "normal", label: "Normal (100ms) - Recommended" },
                { value: "fast", label: "Fast (75ms)" },
              ]}
              className="w-64"
            />
          </SettingRow>
        )}

        {/* Reduced Motion */}
        <SettingRow
          label="Reduced Motion"
          description={
            systemPrefersReducedMotion
              ? "⚠️ System preference detected: Reduced motion is enabled."
              : "Minimize animations for accessibility or personal preference."
          }
        >
          <Switch
            checked={reducedMotion}
            onChange={() => toggle("reducedMotion")}
          />
        </SettingRow>
      </SettingSection>

      {/* Advanced Animation Controls */}
      {animations && !reducedMotion && (
        <SettingSection
          title="Advanced Animation Settings"
          description="Fine-tune which animations are enabled."
        >
          <SettingRow
            label="Hover Effects"
            description="Animate elements when hovering with the mouse."
          >
            <Switch
              checked={hoverAnimations}
              onChange={() => toggle("hoverAnimations")}
            />
          </SettingRow>

          <SettingRow
            label="Page Transitions"
            description="Smooth transitions when navigating between pages."
          >
            <Switch
              checked={transitionAnimations}
              onChange={() => toggle("transitionAnimations")}
            />
          </SettingRow>

          <SettingRow
            label="List Animations"
            description="Animate items appearing in lists (tracks, albums, artists)."
          >
            <Switch
              checked={listAnimations}
              onChange={() => toggle("listAnimations")}
            />
          </SettingRow>
        </SettingSection>
      )}

      {/* Performance Info */}
      <SettingSection
        title="Performance"
        description="Animation settings optimized for high refresh rate displays (60Hz, 90Hz, 120Hz, 144Hz+)."
      >
        <div className="text-sm text-text-muted space-y-2">
          <p>
            <strong>Current Configuration:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Animations:{" "}
              <span className="text-accent">
                {animations ? "Enabled" : "Disabled"}
              </span>
            </li>
            {animations && (
              <>
                <li>
                  Speed: <span className="text-accent">{animationSpeed}</span> (
                  {animationSpeed === "slow"
                    ? "200ms"
                    : animationSpeed === "fast"
                    ? "75ms"
                    : "100ms"}
                  )
                </li>
                <li>
                  INP Target: <span className="text-accent">&lt; 200ms</span>{" "}
                  (Good)
                </li>
              </>
            )}
          </ul>
        </div>
      </SettingSection>
    </div>
  );
}
