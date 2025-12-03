/**
 * GeoIP Service - Client location lookup
 * Uses ip-location-api for IP geolocation
 */

import type { Context } from "hono";
import { lookup } from "ip-location-api";
import { getFromCache, setInCache } from "./cacheService";

export interface ClientLocation {
	country?: string;
	region?: string;
	city?: string;
	ll?: [number, number]; // [latitude, longitude]
}

export interface ClientInfo {
	clientIp: string | null;
	clientLocation: ClientLocation | null;
}

/**
 * Get client IP from Hono context
 * Checks various headers for proxied requests (Fly.io, Cloudflare, etc.)
 */
export function getClientIp(c: Context): string | null {
	// Fly.io header
	const flyClientIp = c.req.header("fly-client-ip");
	if (flyClientIp) return flyClientIp;

	// Standard proxy headers
	const xForwardedFor = c.req.header("x-forwarded-for");
	if (xForwardedFor) {
		// Take the first IP in the chain (original client)
		return xForwardedFor.split(",")[0].trim();
	}

	const xRealIp = c.req.header("x-real-ip");
	if (xRealIp) return xRealIp;

	// Cloudflare
	const cfConnectingIp = c.req.header("cf-connecting-ip");
	if (cfConnectingIp) return cfConnectingIp;

	// Fallback - might not work behind proxies
	return null;
}

/**
 * Get client location from IP
 * Results are cached to avoid repeated lookups
 */
export function getClientLocation(ip: string): ClientLocation | null {
	if (!ip) return null;

	// Check cache first
	const cached = getFromCache<ClientLocation>("rateLimit", `geo:${ip}`);
	if (cached !== undefined) {
		return cached;
	}

	try {
		const location = lookup(ip);
		if (location) {
			const clientLocation: ClientLocation = {
				country: location.country,
				region: location.region,
				city: location.city,
				ll: location.ll,
			};
			// Cache for future lookups
			setInCache("rateLimit", `geo:${ip}`, clientLocation);
			return clientLocation;
		}
	} catch (error) {
		console.warn(`[GeoIP] Failed to lookup IP ${ip}:`, error);
	}

	// Cache null result to avoid repeated failed lookups
	setInCache("rateLimit", `geo:${ip}`, null);
	return null;
}

/**
 * Get complete client info (IP + location)
 */
export function getClientInfo(c: Context): ClientInfo {
	const clientIp = getClientIp(c);
	const clientLocation = clientIp ? getClientLocation(clientIp) : null;

	return {
		clientIp,
		clientLocation,
	};
}
