/**
 * Storage Utilities
 * 
 * Utilities for persisting data to IndexedDB.
 * Used for library cache, player state, and queue persistence.
 * 
 * Security: Hardened against Quota checks and invalid stores.
 */

const DB_NAME = 'sonantica-db';
const DB_VERSION = 1;
const MAX_STORE_SIZE_WARN = 100 * 1024 * 1024; // 100MB warning

// Store names
export const STORES = {
  LIBRARY: 'library',
  PLAYER_STATE: 'player-state',
  QUEUE: 'queue',
} as const;

/**
 * Storage Security Validator
 */
class StorageSecurityValidator {
    static validateStoreName(storeName: string): void {
        const validStores = Object.values(STORES);
        if (!validStores.includes(storeName as any)) {
            throw new Error(`Invalid store name: ${storeName}`);
        }
    }

    static validateData(data: any): void {
        if (data === undefined) throw new Error('Cannot store undefined');
        // We can't easily check size of arbitrary object without serialization overhead.
        // We rely on IndexedDB internal checks but catch the error.
    }
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.LIBRARY)) {
            db.createObjectStore(STORES.LIBRARY);
        }
        if (!db.objectStoreNames.contains(STORES.PLAYER_STATE)) {
            db.createObjectStore(STORES.PLAYER_STATE);
        }
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
            db.createObjectStore(STORES.QUEUE);
        }
        };
    } catch (e) {
        reject(e);
    }
  });
}

/**
 * Save data to IndexedDB
 */
export async function saveToStorage<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    StorageSecurityValidator.validateStoreName(storeName);
    StorageSecurityValidator.validateData(data);

    const db = await openDB();
    
    // Transaction wrapper
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(data, key);

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            
            transaction.onerror = (event) => {
                db.close();
                const error = transaction.error || (event.target as IDBRequest).error;
                
                // Specific error handling
                if (error && error.name === 'QuotaExceededError') {
                     console.error('Storage quota exceeded!');
                     // We could dispatch an event here for UI notification
                }
                
                reject(error);
            };

            // Catch synchronous transaction creation errors
        } catch (txError) {
             db.close();
             reject(txError);
        }
    });

  } catch (error) {
    console.error(`Failed to save to storage (${storeName}/${key}):`, error);
    // Don't re-throw, just log, so app doesn't crash on saving non-critical state
    return;
  }
}

/**
 * Load data from IndexedDB
 */
export async function loadFromStorage<T>(storeName: string, key: string): Promise<T | null> {
  try {
    StorageSecurityValidator.validateStoreName(storeName);

    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        } catch (txError) {
            db.close();
            reject(txError);
        }
    });
  } catch (error) {
    console.error(`Failed to load from storage (${storeName}/${key}):`, error);
    return null;
  }
}

/**
 * Delete data from IndexedDB
 */
export async function deleteFromStorage(storeName: string, key: string): Promise<void> {
  try {
    StorageSecurityValidator.validateStoreName(storeName);
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.delete(key);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
      } catch (txError) {
          db.close();
          reject(txError);
      }
    });
  } catch (error) {
    console.error(`Failed to delete from storage (${storeName}/${key}):`, error);
    throw error;
  }
}

/**
 * Clear all data from a store
 */
export async function clearStorage(storeName: string): Promise<void> {
  try {
    StorageSecurityValidator.validateStoreName(storeName);
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.clear();

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
      } catch (e) {
          db.close();
          reject(e);
      }
    });
  } catch (error) {
    console.error(`Failed to clear storage (${storeName}):`, error);
    throw error;
  }
}

/**
 * PERFORMANCE: Batch write multiple items to IndexedDB
 * 
 * Much faster than individual writes for bulk operations.
 * Uses a single transaction for all writes.
 * 
 * @param storeName - Store to write to
 * @param items - Array of {key, data} pairs to write
 * @param onProgress - Optional progress callback
 * @returns Promise that resolves when all items are written
 * 
 * Example:
 * await saveBatchToStorage('library', [
 *   { key: 'track1', data: track1 },
 *   { key: 'track2', data: track2 },
 * ], (current, total) => console.log(`${current}/${total}`));
 */
export async function saveBatchToStorage<T>(
  storeName: string,
  items: Array<{ key: string; data: T }>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (items.length === 0) return;

  try {
    StorageSecurityValidator.validateStoreName(storeName);

    // Validate all items before starting transaction
    for (const item of items) {
      StorageSecurityValidator.validateData(item.data);
    }

    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      try {
        // Single transaction for all writes (MUCH faster)
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        let completed = 0;

        // Queue all writes in the transaction
        for (const item of items) {
          const request = store.put(item.data, item.key);
          
          request.onsuccess = () => {
            completed++;
            if (onProgress) {
              onProgress(completed, items.length);
            }
          };

          request.onerror = () => {
            console.error(`Failed to write item ${item.key}:`, request.error);
            // Continue with other items even if one fails
          };
        }

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = (event) => {
          db.close();
          const error = transaction.error || (event.target as IDBRequest).error;
          
          if (error && error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded during batch write!');
          }
          
          reject(error);
        };

      } catch (txError) {
        db.close();
        reject(txError);
      }
    });

  } catch (error) {
    console.error(`Failed to batch save to storage (${storeName}):`, error);
    throw error;
  }
}
