// Socket.io logic for real-time color updates

import { SOCKET_URL } from "./config.js";
import { generateFavicon } from "./favicon.js";
import { createColorObjectsFromData } from "./physics.js";
import { addColorsToVisualization } from "./visualization.js"; // We'll modularize this next

let socket = null;
let isPageVisible = true;

export function initializeSocket() {
	try {
		socket = window.io(SOCKET_URL, {
			transports: ["websocket"],
			reconnectionAttempts: 5,
		});
		socket.on("connect", () => console.log("Connected to Socket.io server"));
		socket.on("disconnect", () =>
			console.log("Disconnected from Socket.io server"),
		);
		socket.on("colors", (msg) => {
			const country =
				msg.clientLocation?.country ||
				msg.request?.clientLocation?.country ||
				"unknown";
			const url = msg.request?.url || "unknown";
			console.log(
				"%c[SOCKET.IO] Received broadcast",
				"background: #4ecdc4; color: white; padding: 2px 6px; border-radius: 3px;",
				"\n  Title:",
				msg.paletteTitle,
				"\n  Colors:",
				msg.colors?.length,
				"\n  Country:",
				country,
				"\n  Request URL:",
				url,
			);
			document.documentElement.style.setProperty(
				"--last-color",
				msg.colors[0].hex,
			);
			generateFavicon(msg.colors[0].hex);
			addColorsToVisualization(msg);
			if (isPageVisible) {
				createColorObjectsFromData(msg);
			}
		});
		socket.on("connect_error", (error) =>
			console.error("Socket connection error:", error),
		);
		if (!isPageVisible) {
			socket.wasConnected = true;
			socket.disconnect();
		}
	} catch (error) {
		console.error("Error initializing socket:", error);
	}
}

export function setPageVisibility(visible) {
	isPageVisible = visible;
	if (socket) {
		if (isPageVisible && socket.disconnected && socket.wasConnected) {
			socket.connect();
		} else if (!isPageVisible && socket.connected) {
			socket.wasConnected = true;
			socket.disconnect();
		}
	}
}
