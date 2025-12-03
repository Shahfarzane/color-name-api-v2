/**
 * Socket Service - Socket.IO integration
 * Handles real-time color broadcasting
 */

import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import type { HydratedColor, SocketColorEvent } from "../types";

// Socket.IO server instance
let io: SocketServer | null = null;
let enabled = false;

// Default allowed origins
const DEFAULT_ORIGINS = [
	"http://localhost:3000",
	"http://localhost:8080",
	"https://color.pizza",
	"https://gh-pages-puce.vercel.app",
];

/**
 * Socket service configuration
 */
export interface SocketConfig {
	enabled?: boolean;
	origins?: string[];
}

/**
 * Initialize Socket.IO server
 */
export function initSocketService(
	httpServer: HttpServer,
	config: SocketConfig = {},
): SocketServer | null {
	const {
		enabled: socketEnabled = process.env.SOCKET === "true",
		origins = process.env.ALLOWED_SOCKET_ORIGINS?.split(",") || DEFAULT_ORIGINS,
	} = config;

	enabled = socketEnabled;

	if (!enabled) {
		console.log("[SocketService] Socket.IO disabled");
		return null;
	}

	console.log("[SocketService] Initializing Socket.IO...");

	io = new SocketServer(httpServer, {
		cors: {
			origin: origins,
			methods: ["GET", "POST"],
			credentials: true,
		},
		transports: ["websocket", "polling"],
	});

	// Connection handling
	io.on("connection", (socket) => {
		console.log(`[SocketService] Client connected: ${socket.id}`);

		socket.on("disconnect", (reason) => {
			console.log(
				`[SocketService] Client disconnected: ${socket.id} (${reason})`,
			);
		});

		socket.on("error", (error) => {
			console.error(`[SocketService] Socket error: ${error.message}`);
		});
	});

	console.log("[SocketService] Socket.IO initialized");
	console.log(`[SocketService] Allowed origins: ${origins.join(", ")}`);

	return io;
}

/**
 * Broadcast color event to all connected clients
 */
export function broadcastColorEvent(event: SocketColorEvent): void {
	if (!io || !enabled) {
		return;
	}

	// Emit colors in the format expected by the frontend
	// Frontend expects: { paletteTitle, colors, list, request, timestamp }
	// Extract clientLocation from request for easy frontend access
	const clientLocation = event.request?.clientLocation || null;

	io.emit("colors", {
		paletteTitle: event.paletteTitle,
		colors: event.colors.slice(0, 50).map((c) => ({
			name: c.name,
			hex: c.hex,
			requestedHex: c.requestedHex || "",
		})),
		list: event.list,
		request: event.request,
		clientLocation,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Broadcast a color lookup result
 */
export function emitColorLookup(
	paletteTitle: string,
	colors: HydratedColor[],
	list: string,
	request?: {
		url: string;
		method: string;
		clientLocation?: unknown;
		xReferrer?: string | null;
	},
): void {
	broadcastColorEvent({
		paletteTitle,
		colors,
		list,
		request,
	});
}

/**
 * Get Socket.IO server instance
 */
export function getSocketServer(): SocketServer | null {
	return io;
}

/**
 * Check if Socket.IO is enabled
 */
export function isSocketEnabled(): boolean {
	return enabled;
}

/**
 * Get connected client count
 */
export function getConnectedClientCount(): number {
	if (!io) return 0;
	return io.engine.clientsCount;
}

/**
 * Get socket service stats
 */
export function getSocketStats(): {
	enabled: boolean;
	connectedClients: number;
} {
	return {
		enabled,
		connectedClients: getConnectedClientCount(),
	};
}

/**
 * Shutdown socket service
 */
export async function shutdownSocketService(): Promise<void> {
	if (!io) return;

	console.log("[SocketService] Shutting down...");

	return new Promise((resolve) => {
		io?.close(() => {
			console.log("[SocketService] Shut down complete");
			io = null;
			enabled = false;
			resolve();
		});
	});
}
