/**
 * Artists Page
 * 
 * Browse library by artists.
 */

import { SearchBar } from '../../../shared/components/molecules';
import { useLibraryStore } from '../../../shared/store/libraryStore';
import { ArtistCard } from '../components/ArtistCard';

export function ArtistsPage() {
  const {
    stats,
    searchQuery,
    setSearchQuery,
    selectArtist,
    getFilteredArtists,
  } = useLibraryStore();

  const filteredArtists = getFilteredArtists();

  const handleArtistClick = (artist: any) => {
    selectArtist(artist);
    // TODO: Navigate to artist detail view or show albums
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Artists</h1>
        {stats.totalArtists > 0 && (
          <p className="text-sm text-text-muted mb-4">
            {stats.totalArtists} artist{stats.totalArtists !== 1 ? 's' : ''} in library
          </p>
        )}

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search artists..."
        />
      </div>

      {/* Content */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">
            {searchQuery ? `No artists found matching "${searchQuery}"` : 'No artists in library'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map((artist: any) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => handleArtistClick(artist)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
