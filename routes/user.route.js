import express from 'express';
import { getURL, createURL, getRedirect } from '../controllers/url.controller.js';
import { validateURL, linkExpiration } from '../middleware/url.middleware.js';
import { rateLimitCreate, rateLimitRedirect } from '../middleware/rateLimit.js';

const router = express.Router();

// Get info about a short URL
router.get('/info/:id', linkExpiration, getURL);

// Create a new short URL
router.post('/', validateURL, createURL);

// Redirect to original URL
router.get('/:alias', rateLimitRedirect, linkExpiration, getRedirect);

export default router;
