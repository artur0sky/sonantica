import { SettingSection, SettingRow, Switch, Button } from "@sonantica/ui";

export function LibrarySettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-100">
      <SettingSection
        title="Scanning"
        description="Configure how Sonántica indexes your music."
      >
        <SettingRow
          label="Auto-Scan on Startup"
          description="Check for new files every time the app launches."
        >
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Watch Folders"
          description="Monitor folders for changes in real-time."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Parallel Scanning"
          description="Scan multiple folders simultaneously. Faster, but uses more CPU."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingSection>

      <SettingSection
        title="Metadata"
        description="Configuration for tag reading and internet fetching."
      >
        <SettingRow
          label="Fetch Missing Metadata"
          description="Download covers and tags from MusicBrainz/Discogs."
        >
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <SettingRow
          label="Embedded Covers Priority"
          description="Prefer embedded art over folder.jpg."
        >
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Maintenance">
        <SettingRow
          label="Clear Library Cache"
          description="Remove all indexed data and rescan from scratch."
        >
          <Button
            variant="danger"
            size="sm"
            className="text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20"
          >
            Clear Database
          </Button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
