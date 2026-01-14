import {
  IconMusic,
  IconDisc,
  IconMicrophone,
  IconPlaylist,
  IconHistory,
  IconHeart,
} from "@tabler/icons-react";
import { Link } from "wouter";

const librarySections = [
  {
    title: "Tracks",
    description: "Your entire music collection",
    path: "/library/tracks",
    icon: IconMusic,
    color: "text-blue-400",
  },
  {
    title: "Albums",
    description: "Browse by album",
    path: "/albums",
    icon: IconDisc,
    color: "text-purple-400",
  },
  {
    title: "Artists",
    description: "Browse by artist",
    path: "/artists",
    icon: IconMicrophone,
    color: "text-pink-400",
  },
  {
    title: "Playlists",
    description: "Your custom collections",
    path: "/playlists",
    icon: IconPlaylist,
    color: "text-emerald-400",
  },
];

export function LibraryPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-text">Library</h1>
        <p className="text-text-muted">
          Organize and explore your sound interpreted collection.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {librarySections.map((section) => (
          <Link key={section.path} href={section.path}>
            <a className="block group">
              <div className="h-full p-6 rounded-2xl bg-surface border border-border/50 transition-all duration-300 group-hover:bg-surface-elevated group-hover:border-accent/30 group-hover:shadow-xl group-hover:shadow-accent/5">
                <div className="flex flex-col gap-4">
                  <div
                    className={`p-3 rounded-xl bg-surface-elevated w-fit group-hover:scale-110 transition-transform ${section.color}`}
                  >
                    <section.icon size={24} stroke={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text group-hover:text-accent transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted opacity-50 px-1">
            Speed Dial
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/library/favorites">
              <a className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border/40 hover:bg-surface-elevated transition-all group">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                  <IconHeart size={18} fill="currentColor" />
                </div>
                <span className="font-semibold text-sm">Favorites</span>
              </a>
            </Link>
            <Link href="/analytics">
              <a className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border/40 hover:bg-surface-elevated transition-all group">
                <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <IconHistory size={18} />
                </div>
                <span className="font-semibold text-sm">Recently Played</span>
              </a>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
