import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  originalURL: {
    type: String,
    required: true,
  },
  alias: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: {
      expireAfterSeconds: 0, // Automatically deletes document at expiration
    },
  },
});

const User = mongoose.model('User', userSchema);

export default User;
