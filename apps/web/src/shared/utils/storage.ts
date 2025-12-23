/**
 * Storage Utilities
 * 
 * Utilities for persisting data to IndexedDB.
 * Used for library cache, player state, and queue persistence.
 */

const DB_NAME = 'sonantica-db';
const DB_VERSION = 1;

// Store names
export const STORES = {
  LIBRARY: 'library',
  PLAYER_STATE: 'player-state',
  QUEUE: 'queue',
} as const;

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
  });
}

/**
 * Save data to IndexedDB
 */
export async function saveToStorage<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    store.put(data, key);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(`Failed to save to storage (${storeName}/${key}):`, error);
    throw error;
  }
}

/**
 * Load data from IndexedDB
 */
export async function loadFromStorage<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
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
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    store.delete(key);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
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
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(`Failed to clear storage (${storeName}):`, error);
    throw error;
  }
}
