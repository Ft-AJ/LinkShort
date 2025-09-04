import mongoose from 'mongoose';
import Token from '../services/token.js';
import User from '../models/user.model.js';

// GET: Return URL details
export const getURL = async (req, res, next) => {
  try {
    const user = req.urlData;
    if (!req.urlData) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }
    
    const shortURL = `${req.protocol}://${req.get('host')}/${user.alias}`;    
    
    return res.status(200).json({
      success: true,
      originalURL: user.originalURL,
      newURL: shortURL,
      expiresAt: user.expiresAt,
      remainingTimeSeconds: req.remainingTimeSeconds,
    });
  } catch (err) {
    next(err);
  }
};

// POST: Create a shortened URL
export const createURL = async (req, res, next) => {
  try {
    const { originalURL, custom_alias, length } = req.body;

    // 1) If an unexpired short link for the same originalURL already exists,
    //    return it with remaining time instead of erroring.
    const now = new Date();
    const existingActive = await User.findOne({
      originalURL: originalURL?.trim(),
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

    // 2) Use custom alias or generate a token
    let alias = custom_alias || Token(
      typeof length === 'number'
        ? Math.max(1, Math.min(7, length))
        : 6
    );

    // 3) Check if alias already exists (still enforce alias uniqueness)
    const existingToken = await User.findOne({ alias });
    if (existingToken) {
      const err = new Error('Alias already exists!');
      err.statusCode = 409;
      throw err;
    }

    // 4) Create new short link (keep your 1-minute expiry)
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const newURLDoc = await User.create({
      originalURL: originalURL.trim(),
      alias,
      expiresAt,
    });

    const shortURL = `${req.protocol}://${req.get('host')}/${alias}`;

    res.status(201).json({
      success: true,
      message: 'Link added successfully',
      newURL: shortURL,
      data: newURLDoc,
    });
  } catch (err) {
    // Handle duplicate alias error
    if (err?.code === 11000 && err?.keyPattern?.alias) {
      err.statusCode = 409;
      err.message = 'Alias already exists!';
    }
    next(err);
  }
};


// GET: Redirect to original URL
export const getRedirect = (req, res) => {
  const user = req.urlData;

  res.set({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });

  return res.redirect(302, user.originalURL);
};
