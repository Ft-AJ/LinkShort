import { randomInt } from 'crypto';

// Generate a random alphanumeric token of given length
function Token(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars[randomInt(chars.length)];
  }

  return result;
}

export default Token;
