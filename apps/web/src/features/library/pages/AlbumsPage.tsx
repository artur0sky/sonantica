/**
 * Albums Page
 * 
 * Browse library by albums.
 */

import { SearchBar } from '../../../shared/components/molecules';
import { useLibraryStore } from '../../../shared/store/libraryStore';
import { AlbumCard } from '../components/AlbumCard';

export function AlbumsPage() {
  const {
    stats,
    searchQuery,
    setSearchQuery,
    selectAlbum,
    getFilteredAlbums,
  } = useLibraryStore();

  const filteredAlbums = getFilteredAlbums();

  const handleAlbumClick = (album: any) => {
    selectAlbum(album);
    // TODO: Navigate to album detail view or show tracks
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Albums</h1>
        {stats.totalAlbums > 0 && (
          <p className="text-sm text-text-muted mb-4">
            {stats.totalAlbums} album{stats.totalAlbums !== 1 ? 's' : ''} in library
          </p>
        )}

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search albums..."
        />
      </div>

      {/* Content */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">
            {searchQuery ? `No albums found matching "${searchQuery}"` : 'No albums in library'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAlbums.map((album: any) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => handleAlbumClick(album)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
