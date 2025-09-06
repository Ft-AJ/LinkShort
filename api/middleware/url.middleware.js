import validator from 'validator';
import User from '../models/user.model.js';

const ALIAS_RE = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * Validate request body for creating a short URL
 */
export const validateURL = (req, res, next) => {
  const { originalURL, length, custom_alias } = req.body;

  // Validate original URL
  if (!originalURL || !validator.isURL(originalURL, { require_protocol: true })) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL. Please include http:// or https://',
    });
  }

  // Validate length if provided
  if (length && (typeof length !== 'number' || length < 1 || length > 7)) {
    return res.status(400).json({
      success: false,
      message: 'Length must be a number between 1 and 7',
    });
  }

  // Validate custom alias format if provided
  if (custom_alias && !ALIAS_RE.test(custom_alias)) {
    return res.status(400).json({
      success: false,
      message: 'custom_alias must be 1–32 chars: letters, numbers, _ or -',
    });
  }

  next();
};


/**
 * Middleware: Ensure link exists and is not expired
 */
export const linkExpiration = async (req, res, next) => {
  try {
    const alias = req.params.alias || req.params.id;
    if (!alias) {
      return res.status(400).json({
        success: false,
        message: 'Alias parameter is required',
      });
    }

    const user = await User.findOne({ alias }).lean();

    // Handle link not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Check expiration
    if (user.expiresAt && user.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This short link has expired.',
      });
    }

    // Attach user data for next middlewares/controllers
    req.urlData = user;

    // Compute remaining time if applicable
    if (user.expiresAt) {
      const remainingMs = user.expiresAt - new Date();
      req.remainingTimeSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    }

    next();
  } catch (err) {
    console.error('linkExpiration error:', err);
    next(err);
  }
};
