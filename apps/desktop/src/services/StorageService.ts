/**
 * StorageService
 * 
 * Manages offline storage analysis and quota management.
 * Provides detailed breakdown of storage usage across different data types.
 */

export interface StorageBreakdown {
  total: number;
  used: number;
  available: number;
  percentage: number;
  breakdown: StorageCategory[];
}

export interface StorageCategory {
  id: string;
  label: string;
  value: number; // bytes
  percentage: number;
  color?: string;
}

/**
 * Get storage quota and usage information
 */
export async function getStorageInfo(): Promise<StorageBreakdown> {
  try {
    // Get storage estimate from browser API
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      // Get detailed breakdown
      const breakdown = await getStorageBreakdown(usage);

      return {
        total: quota,
        used: usage,
        available,
        percentage,
        breakdown,
      };
    }

    // Fallback if API not available
    return {
      total: 0,
      used: 0,
      available: 0,
      percentage: 0,
      breakdown: [],
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      total: 0,
      used: 0,
      available: 0,
      percentage: 0,
      breakdown: [],
    };
  }
}

/**
 * Get detailed breakdown of storage usage by category
 */
async function getStorageBreakdown(totalUsage: number): Promise<StorageCategory[]> {
  const categories: StorageCategory[] = [];

  try {
    // 1. Analyze IndexedDB for audio files and metadata
    const indexedDBAnalysis = await analyzeIndexedDB();
    
    // 2. Calculate LocalStorage usage
    const localStorageSize = getLocalStorageSize();
    
    // 3. Calculate SessionStorage usage
    const sessionStorageSize = getSessionStorageSize();
    
    // 4. Analyze Cache Storage (Service Workers) for app resources and images
    const cacheAnalysis = await analyzeCacheStorage();

    // Build detailed breakdown array
    
    // Audio Files (from IndexedDB)
    if (indexedDBAnalysis.audioFiles > 0) {
      categories.push({
        id: 'audio-files',
        label: 'Downloaded Audio Files',
        value: indexedDBAnalysis.audioFiles,
        percentage: totalUsage > 0 ? (indexedDBAnalysis.audioFiles / totalUsage) * 100 : 0,
        color: 'hsl(243, 75%, 59%)', // Accent color - Primary content
      });
    }

    // Album Art & Images (from Cache + IndexedDB)
    const totalImages = cacheAnalysis.images + indexedDBAnalysis.images;
    if (totalImages > 0) {
      categories.push({
        id: 'images',
        label: 'Album Art & Images',
        value: totalImages,
        percentage: totalUsage > 0 ? (totalImages / totalUsage) * 100 : 0,
        color: 'hsl(291, 64%, 42%)', // Purple - Visual content
      });
    }

    // Metadata & Database (from IndexedDB)
    if (indexedDBAnalysis.metadata > 0) {
      categories.push({
        id: 'metadata',
        label: 'Track Metadata & Library',
        value: indexedDBAnalysis.metadata,
        percentage: totalUsage > 0 ? (indexedDBAnalysis.metadata / totalUsage) * 100 : 0,
        color: 'hsl(48, 96%, 53%)', // Yellow - Data
      });
    }

    // App Resources (from Cache)
    if (cacheAnalysis.appResources > 0) {
      categories.push({
        id: 'app-resources',
        label: 'App Code & Resources',
        value: cacheAnalysis.appResources,
        percentage: totalUsage > 0 ? (cacheAnalysis.appResources / totalUsage) * 100 : 0,
        color: 'hsl(142, 76%, 36%)', // Green - App files
      });
    }

    // Settings & Preferences (from LocalStorage)
    if (localStorageSize > 0) {
      categories.push({
        id: 'settings',
        label: 'Settings & Preferences',
        value: localStorageSize,
        percentage: totalUsage > 0 ? (localStorageSize / totalUsage) * 100 : 0,
        color: 'hsl(24, 95%, 53%)', // Orange - Configuration
      });
    }

    // Session Data (from SessionStorage)
    if (sessionStorageSize > 0) {
      categories.push({
        id: 'session',
        label: 'Session Data',
        value: sessionStorageSize,
        percentage: totalUsage > 0 ? (sessionStorageSize / totalUsage) * 100 : 0,
        color: 'hsl(200, 98%, 39%)', // Blue - Temporary
      });
    }

    // Calculate "Other" category
    const accountedSize = categories.reduce((sum, cat) => sum + cat.value, 0);
    const otherSize = Math.max(0, totalUsage - accountedSize);

    if (otherSize > 0) {
      categories.push({
        id: 'other',
        label: 'Other Data',
        value: otherSize,
        percentage: totalUsage > 0 ? (otherSize / totalUsage) * 100 : 0,
        color: 'hsl(0, 0%, 60%)', // Gray - Unknown
      });
    }

    return categories;
  } catch (error) {
    console.error('Failed to get storage breakdown:', error);
    return [];
  }
}

/**
 * Analyze IndexedDB and categorize by content type
 */
async function analyzeIndexedDB(): Promise<{
  audioFiles: number;
  images: number;
  metadata: number;
}> {
  try {
    if (!('indexedDB' in window)) {
      return { audioFiles: 0, images: 0, metadata: 0 };
    }

    const databases = await window.indexedDB.databases();
    let audioFiles = 0;
    let images = 0;
    let metadata = 0;

    for (const dbInfo of databases) {
      if (!dbInfo.name) continue;

      try {
        const analysis = await analyzeDatabase(dbInfo.name);
        audioFiles += analysis.audioFiles;
        images += analysis.images;
        metadata += analysis.metadata;
      } catch (err) {
        console.warn(`Failed to analyze DB: ${dbInfo.name}`, err);
      }
    }

    return { audioFiles, images, metadata };
  } catch (error) {
    console.error('Failed to analyze IndexedDB:', error);
    return { audioFiles: 0, images: 0, metadata: 0 };
  }
}

/**
 * Analyze a specific IndexedDB database
 */
function analyzeDatabase(dbName: string): Promise<{
  audioFiles: number;
  images: number;
  metadata: number;
}> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName);
      
      request.onsuccess = () => {
        const db = request.result;
        let audioFiles = 0;
        let images = 0;
        let metadata = 0;

        try {
          const objectStoreNames = Array.from(db.objectStoreNames);
          
          if (objectStoreNames.length === 0) {
            db.close();
            resolve({ audioFiles: 0, images: 0, metadata: 0 });
            return;
          }

          const transaction = db.transaction(objectStoreNames, 'readonly');
          let storesProcessed = 0;

          objectStoreNames.forEach((storeName) => {
            try {
              const store = transaction.objectStore(storeName);
              const storeNameLower = storeName.toLowerCase();

              // Categorize by store name patterns
              let category: 'audio' | 'image' | 'metadata' = 'metadata';
              
              if (storeNameLower.includes('audio') || 
                  storeNameLower.includes('track') || 
                  storeNameLower.includes('song') ||
                  storeNameLower.includes('music') ||
                  storeNameLower.includes('file')) {
                category = 'audio';
              } else if (storeNameLower.includes('image') || 
                         storeNameLower.includes('cover') || 
                         storeNameLower.includes('art') ||
                         storeNameLower.includes('thumbnail') ||
                         storeNameLower.includes('picture')) {
                category = 'image';
              }

              const countRequest = store.count();

              countRequest.onsuccess = () => {
                const count = countRequest.result;
                
                // Estimate size based on category
                // Audio files: ~5MB per track (average)
                // Images: ~100KB per image (album art)
                // Metadata: ~5KB per record
                let estimatedSize = 0;
                
                if (category === 'audio') {
                  estimatedSize = count * 5 * 1024 * 1024; // 5MB per audio file
                  audioFiles += estimatedSize;
                } else if (category === 'image') {
                  estimatedSize = count * 100 * 1024; // 100KB per image
                  images += estimatedSize;
                } else {
                  estimatedSize = count * 5 * 1024; // 5KB per metadata record
                  metadata += estimatedSize;
                }

                storesProcessed++;
                if (storesProcessed === objectStoreNames.length) {
                  db.close();
                  resolve({ audioFiles, images, metadata });
                }
              };

              countRequest.onerror = () => {
                storesProcessed++;
                if (storesProcessed === objectStoreNames.length) {
                  db.close();
                  resolve({ audioFiles, images, metadata });
                }
              };
            } catch (err) {
              storesProcessed++;
              if (storesProcessed === objectStoreNames.length) {
                db.close();
                resolve({ audioFiles, images, metadata });
              }
            }
          });
        } catch (err) {
          db.close();
          resolve({ audioFiles: 0, images: 0, metadata: 0 });
        }
      };

      request.onerror = () => {
        resolve({ audioFiles: 0, images: 0, metadata: 0 });
      };
    } catch (error) {
      resolve({ audioFiles: 0, images: 0, metadata: 0 });
    }
  });
}

/**
 * Calculate LocalStorage size
 */
function getLocalStorageSize(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += key.length + (localStorage[key]?.length || 0);
      }
    }
    // Convert characters to bytes (UTF-16 = 2 bytes per char)
    return total * 2;
  } catch (error) {
    console.error('Failed to get LocalStorage size:', error);
    return 0;
  }
}

/**
 * Calculate SessionStorage size
 */
function getSessionStorageSize(): number {
  try {
    let total = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        total += key.length + (sessionStorage[key]?.length || 0);
      }
    }
    // Convert characters to bytes (UTF-16 = 2 bytes per char)
    return total * 2;
  } catch (error) {
    console.error('Failed to get SessionStorage size:', error);
    return 0;
  }
}

/**
 * Analyze Cache Storage and categorize by content type
 */
async function analyzeCacheStorage(): Promise<{
  images: number;
  appResources: number;
}> {
  try {
    if (!('caches' in window)) {
      return { images: 0, appResources: 0 };
    }

    const cacheNames = await caches.keys();
    let images = 0;
    let appResources = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;
          const url = request.url.toLowerCase();
          const contentType = response.headers.get('content-type')?.toLowerCase() || '';

          // Categorize by content type or file extension
          if (
            contentType.includes('image/') ||
            url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|bmp)(\?|$)/)
          ) {
            images += size;
          } else {
            // Everything else is app resources (JS, CSS, HTML, fonts, etc.)
            appResources += size;
          }
        }
      }
    }

    return { images, appResources };
  } catch (error) {
    console.error('Failed to analyze Cache Storage:', error);
    return { images: 0, appResources: 0 };
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Clear all offline storage
 */
export async function clearAllStorage(): Promise<void> {
  try {
    // Clear LocalStorage
    localStorage.clear();

    // Clear SessionStorage
    sessionStorage.clear();

    // Clear IndexedDB
    if ('indexedDB' in window) {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    }

    // Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }

    console.log('All storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}
