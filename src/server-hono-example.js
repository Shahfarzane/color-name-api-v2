/**
 * Alternative server implementation using Hono framework
 *
 * Benefits:
 * - Cleaner route definitions
 * - Built-in middleware (cors, compress, rate-limit)
 * - Works on Node.js, Bun, Deno, Cloudflare Workers
 * - Easier to test
 * - TypeScript-first
 *
 * To use: npm install hono @hono/node-server
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { serve } from '@hono/node-server';
import { LRUCache } from 'lru-cache';

import { FindColors, hydrateColor } from './findColors.js';
import { getPaletteTitle } from './generatePaletteName.js';
import { svgTemplate } from './colorSwatchSVG.js';

// ============================================
// Configuration
// ============================================

const config = {
  port: parseInt(process.env.PORT || '8080'),
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
  maxColorsPerRequest: parseInt(process.env.MAX_COLORS_PER_REQUEST || '170'),
};

// ============================================
// Initialize Services
// ============================================

// Color lists and finder (same as current implementation)
import colorNameLists from 'color-name-lists';
import { colornames as colors } from 'color-name-list';
import { colornames as colorsBestOf } from 'color-name-list/bestof';
import { colornames as colorsShort } from 'color-name-list/short';

const colorsLists = {
  default: colors,
  bestOf: colorsBestOf,
  short: colorsShort,
  ...colorNameLists.lists,
};

const availableLists = Object.keys(colorsLists);
const findColors = new FindColors(colorsLists);

// Rate limiter cache
const rateLimitCache = new LRUCache({ max: 10000 });

// ============================================
// Middleware
// ============================================

function rateLimiter() {
  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();

    let record = rateLimitCache.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.rateLimit.windowMs };
    } else {
      record.count++;
    }
    rateLimitCache.set(ip, record);

    // Set headers
    c.header('X-RateLimit-Limit', String(config.rateLimit.max));
    c.header(
      'X-RateLimit-Remaining',
      String(Math.max(0, config.rateLimit.max - record.count))
    );
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > config.rateLimit.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          error: {
            status: 429,
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          },
        },
        429
      );
    }

    await next();
  };
}

// ============================================
// App Setup
// ============================================

const app = new Hono();

// Global middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET'],
    maxAge: 86400,
  })
);
app.use('*', compress());
app.use('/v1/*', rateLimiter());

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', c => c.json({ status: 'ok' }));

// Get all colors or specific colors by hex
app.get('/v1/', async c => {
  const values = c.req.query('values');
  const list = c.req.query('list') || 'default';
  const noduplicates = c.req.query('noduplicates') === 'true';

  // Validate list
  if (!availableLists.includes(list)) {
    return c.json(
      {
        error: {
          status: 400,
          message: `Invalid list. Available: ${availableLists.join(', ')}`,
        },
      },
      400
    );
  }

  // No values = return all colors
  if (!values) {
    const allColors = colorsLists[list].map(hydrateColor);
    return c.json({
      paletteTitle: `All ${list} colors`,
      colors: allColors,
    });
  }

  // Parse and validate colors
  const hexColors = values.toLowerCase().split(',').filter(Boolean);

  if (hexColors.length > config.maxColorsPerRequest) {
    return c.json(
      {
        error: {
          status: 400,
          message: `Max ${config.maxColorsPerRequest} colors per request`,
        },
      },
      400
    );
  }

  const invalidColors = hexColors.filter(
    hex => !/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)
  );
  if (invalidColors.length) {
    return c.json(
      {
        error: {
          status: 400,
          message: `Invalid hex colors: ${invalidColors.join(', ')}`,
        },
      },
      400
    );
  }

  // Get color names
  const colorResults = findColors.getNamesForValues(
    hexColors,
    noduplicates,
    list
  );

  // Check for exhaustion error
  if (colorResults.some(c => c.error)) {
    const exhausted = colorResults.find(c => c.error);
    return c.json(
      {
        error: { status: 409, message: exhausted.error, ...exhausted },
      },
      409
    );
  }

  return c.json({
    paletteTitle:
      hexColors.length === 1
        ? colorResults[0].name
        : getPaletteTitle(colorResults.map(c => c.name)),
    colors: colorResults,
  });
});

// Color by hex in path (e.g., /v1/ff0000)
app.get('/v1/:colors', async c => {
  const colors = c.req.param('colors');
  const list = c.req.query('list') || 'default';
  const noduplicates = c.req.query('noduplicates') === 'true';

  // Validate it looks like colors
  if (!/^[0-9a-f,]+$/i.test(colors)) {
    return c.json(
      {
        error: { status: 404, message: 'Invalid path' },
      },
      404
    );
  }

  // Delegate to main handler
  const url = new URL(c.req.url);
  url.searchParams.set('values', colors);
  return c.redirect(url.pathname.replace(`/${colors}`, '/') + url.search);
});

// Search by name
app.get('/v1/names/:query?', async c => {
  const query = c.req.param('query') || c.req.query('name') || '';
  const list = c.req.query('list') || 'default';
  const maxResults = Math.min(parseInt(c.req.query('maxResults') || '20'), 50);

  if (query.length < 3) {
    return c.json(
      {
        error: {
          status: 400,
          message: 'Search query must be at least 3 characters',
        },
      },
      400
    );
  }

  const results = findColors.searchNames(query, list, maxResults);
  return c.json({ colors: results });
});

// List available color lists
app.get('/v1/lists/', async c => {
  const listKey = c.req.query('list');

  if (listKey) {
    if (!availableLists.includes(listKey)) {
      return c.json(
        {
          error: { status: 400, message: `Invalid list: ${listKey}` },
        },
        400
      );
    }
    return c.json(colorNameLists.meta[listKey]);
  }

  return c.json({
    availableColorNameLists: availableLists,
    listDescriptions: colorNameLists.meta,
  });
});

// SVG swatch
app.get('/v1/swatch/', async c => {
  const color = c.req.query('color');
  const name = c.req.query('name');

  if (!color || !/^[0-9a-f]+$/i.test(color)) {
    return c.json(
      {
        error: { status: 400, message: 'Valid hex color required' },
      },
      400
    );
  }

  const svg = svgTemplate(`#${color}`, name);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
});

// 404 handler
app.notFound(c => {
  return c.json(
    {
      error: { status: 404, message: 'Not found' },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      error: { status: 500, message: 'Internal server error' },
    },
    500
  );
});

// ============================================
// Start Server
// ============================================

console.log(`Starting server on port ${config.port}...`);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  info => {
    console.log(`Server running at http://localhost:${info.port}/v1/`);
  }
);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  process.exit(0);
});
