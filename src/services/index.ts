/**
 * Service exports for Color Name API
 */

export {
	clearAllCaches,
	clearCache,
	deleteFromCache,
	getCacheInstance,
	getCacheStats,
	getFromCache,
	getTotalCacheSize,
	hasInCache,
	setInCache,
} from "./cacheService";
export {
	getAvailableLists,
	getColorCount,
	getColorList,
	getColorListMeta,
	getColorLists,
	getFindColors,
	getServiceStats,
	hasColorList,
	initColorService,
	isInitialized,
} from "./colorService";
export type { SocketConfig } from "./socketService";
export {
	broadcastColorEvent,
	emitColorLookup,
	getConnectedClientCount,
	getSocketServer,
	getSocketStats,
	initSocketService,
	isSocketEnabled,
	shutdownSocketService,
} from "./socketService";
