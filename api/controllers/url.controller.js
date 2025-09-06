import mongoose from 'mongoose';
import Token from '../services/token.js';
import User from '../models/user.model.js';

/**
 * GET /info/:id
 * Return URL details (if not expired)
 */
export const getURL = async (req, res, next) => {
  try {
    const user = req.urlData; // set by linkExpiration middleware
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'URL not found or expired' 
      });
    }

    const shortURL = `${req.protocol}://${req.get('host')}/${user.alias}`;    

    return res.status(200).json({
      success: true,
      originalURL: user.originalURL,
      newURL: shortURL,
      expiresAt: user.expiresAt,
      remainingTimeSeconds: req.remainingTimeSeconds || 0,
    });
  } catch (err) {
    console.error('getURL error:', err);
    next(err);
  }
};


/**
 * POST /
 * Create a shortened URL (1 min expiry by default)
 */
export const createURL = async (req, res, next) => {
  try {
    const { originalURL, custom_alias, length } = req.body;
    if (!originalURL) {
      return res.status(400).json({ success: false, message: 'Original URL is required' });
    }

    const now = new Date();

    // 1) If unexpired short link exists → return it
    const existingActive = await User.findOne({
      originalURL: originalURL.trim(),
      expiresAt: { $gt: now },
    }).lean();

    if (existingActive) {
      const remainingMs = new Date(existingActive.expiresAt) - now;
      const remainingTimeSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      const shortURL = `${req.protocol}://${req.get('host')}/${existingActive.alias}`;

      return res.status(200).json({
        success: true,
        message: 'URL already exists',
        newURL: shortURL,
        expiresAt: existingActive.expiresAt,
        remainingTimeSeconds,
        data: existingActive,
      });
    }

    // 2) Generate or use custom alias
    let alias = custom_alias || Token(
      typeof length === 'number'
        ? Math.max(1, Math.min(7, length))
        : 6
    );

    // 3) Check alias uniqueness
    const existingToken = await User.findOne({ alias });
    if (existingToken) {
      return res.status(409).json({
        success: false,
        message: 'Alias already exists!',
      });
    }

    // 4) Create new short link (1 min expiry)
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const newURLDoc = await User.create({
      originalURL: originalURL.trim(),
      alias,
      expiresAt,
    });

    const shortURL = `${req.protocol}://${req.get('host')}/${alias}`;

    return res.status(201).json({
      success: true,
      message: 'Link added successfully',
      newURL: shortURL,
      data: newURLDoc,
    });
  } catch (err) {
    console.error('createURL error:', err);
    next(err);
  }
};


/**
 * GET /:alias
 * Redirect to original URL if active
 */
export const getRedirect = (req, res) => {
  const user = req.urlData; // set by linkExpiration middleware

  if (!user) {
    return res.status(404).send('Link expired or not found');
  }

  // Disable caching for security
  res.set({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });

  return res.redirect(302, user.originalURL);
};
