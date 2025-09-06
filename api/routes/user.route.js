import express from 'express';
import { getURL, createURL, getRedirect } from '../controllers/url.controller.js';
import { validateURL, linkExpiration } from '../middleware/url.middleware.js';
import { rateLimitCreate, rateLimitRedirect } from '../middleware/rateLimit.js';

const router = express.Router();

// Health check - GET /api/ping
router.get('/ping', (req, res) => res.send('pong'));

// Create a new short URL - POST /api/
router.post('/', rateLimitCreate, validateURL, createURL);

// Get info about a short URL - GET /api/info/:id
router.get('/info/:id', linkExpiration, getURL);

// Redirect to original URL - GET /api/:alias
// NOTE: This must be last to avoid intercepting other routes
router.get('/:alias', rateLimitRedirect, linkExpiration, getRedirect);

export default router;
