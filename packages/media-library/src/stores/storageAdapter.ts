import { type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

/**
 * Custom storage adapter using idb-keyval (IndexedDB wrapper)
 * 
 * Used to avoid localStorage quota limits (5MB) when storing large library data.
 * IDB is asynchronous, so we must handle it gracefully.
 */
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch(e) {
      console.error('IDB Get Error', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch(e) {
      console.error('IDB Set Error', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch(e) {
      console.error('IDB Delete Error', e);
    }
  },
};
