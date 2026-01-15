import { type IFileEntry, type IFileProvider } from "@sonantica/shared";

export const createTauriFileProvider = (): IFileProvider => {
  return {
    async listDirectory(path?: string): Promise<IFileEntry[]> {
      try {
        const { readDir } = await import("@tauri-apps/plugin-fs");
        const { audioDir, homeDir } = await import("@tauri-apps/api/path");

        let targetPath = path;
        if (!targetPath) {
          targetPath = (await audioDir()) || (await homeDir());
        }

        const dirEntries = await readDir(targetPath);
        return dirEntries.map((entry) => ({
          name: entry.name || "Unknown",
          path: `${targetPath}/${entry.name}`,
          is_directory: entry.isDirectory,
          extension: entry.name?.split(".").pop(),
        }));
      } catch (err) {
        console.error("Tauri Provider Error:", err);
        return [];
      }
    },

    async getAudioDir(): Promise<string> {
      try {
        const { audioDir } = await import("@tauri-apps/api/path");
        return (await audioDir()) || "";
      } catch {
        return "";
      }
    },

    async getHomeDir(): Promise<string> {
      try {
        const { homeDir } = await import("@tauri-apps/api/path");
        return (await homeDir()) || "";
      } catch {
        return "";
      }
    },
  };
};
