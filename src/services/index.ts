/**
 * Service exports for Color Name API
 */

export {
  initColorService,
  getFindColors,
  getColorLists,
  getAvailableLists,
  getColorListMeta,
  hasColorList,
  getColorList,
  getColorCount,
  isInitialized,
  getServiceStats,
} from './colorService';

export {
  getFromCache,
  setInCache,
  hasInCache,
  deleteFromCache,
  clearCache,
  clearAllCaches,
  getCacheStats,
  getTotalCacheSize,
  getCacheInstance,
} from './cacheService';

export {
  initSocketService,
  broadcastColorEvent,
  emitColorLookup,
  getSocketServer,
  isSocketEnabled,
  getConnectedClientCount,
  getSocketStats,
  shutdownSocketService,
} from './socketService';
export type { SocketConfig } from './socketService';
